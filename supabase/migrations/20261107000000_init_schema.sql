-- ============================================================================
-- NOIRÉ — Supabase schema v1
-- Postgres 15 · Supabase Auth · Row Level Security
--
-- Mirrors the TypeScript domain contracts in `types/index.ts` so the existing
-- service layer (`lib/services`) can be re-pointed from fixtures to Postgres
-- without changing UI code.
--
-- Conventions
--   • Catalog identifiers are `text` so fixture ids (`prod-01`, `cat-audio`)
--     survive the migration unchanged; everything created at runtime is `uuid`.
--   • Money is stored as `numeric(12,2)` in USD. Totals are computed server-side.
--   • Rich, read-mostly document fields (gallery, specifications, story blocks,
--     FAQs) are `jsonb`; anything that is queried, joined, or counted is relational.
--   • Every table has RLS enabled. Public = anon + authenticated. Writes to the
--     catalog require the `admin` role (see `public.is_admin()`).
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ----------------------------------------------------------------------------
-- 1. Enums
-- ----------------------------------------------------------------------------
create type public.app_role as enum ('customer', 'staff', 'admin');
create type public.locale_code as enum ('en', 'ar');
create type public.category_slug as enum (
  'audio', 'desk-architecture', 'lighting', 'travel-carry', 'smart-instruments', 'tactile-input'
);
create type public.stock_status as enum ('in_stock', 'low_stock', 'pre_order', 'out_of_stock');
create type public.product_status as enum ('active', 'draft', 'archived');
create type public.product_badge as enum (
  'new_release', 'limited_edition', 'archival', 'bestseller', 'award_winner'
);
create type public.order_status as enum (
  'pending_settlement', 'processing', 'craft_calibration', 'shipped', 'delivered', 'cancelled', 'returned'
);
create type public.payment_status as enum ('pending', 'paid', 'refunded', 'failed');
create type public.payment_provider as enum ('demo', 'stripe_elements', 'apple_pay', 'studio_wire');
create type public.payment_method_type as enum ('card', 'apple_pay', 'wire_transfer');
create type public.discount_type as enum ('percentage', 'fixed_amount', 'free_shipping');
create type public.discount_status as enum ('active', 'scheduled', 'expired', 'disabled', 'archived');
create type public.customer_status as enum ('active', 'vip', 'inactive');
create type public.customer_tier as enum ('Private Client', 'Collector', 'Member');
create type public.currency_code as enum ('USD', 'EUR', 'GBP', 'JPY');

-- ----------------------------------------------------------------------------
-- 2. Helpers
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Role is mirrored into auth JWT `app_metadata.role` by the `sync_role_claim`
-- trigger below, so policies can read it without an extra table lookup.
create or replace function public.jwt_role()
returns public.app_role language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> 'role',
    'customer'
  )::public.app_role
$$;

-- The service role (server-side admin client, seed script, webhooks) is treated as admin.
create or replace function public.is_service_role()
returns boolean language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') = 'service_role'
$$;

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select public.is_service_role() or public.jwt_role() = 'admin'
$$;

create or replace function public.is_staff()
returns boolean language sql stable as $$
  select public.is_service_role() or public.jwt_role() in ('admin', 'staff')
$$;

-- ----------------------------------------------------------------------------
-- 3. Identity
-- ----------------------------------------------------------------------------
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  email          text not null,
  first_name     text not null default '',
  last_name      text not null default '',
  phone          text,
  avatar_url     text,
  client_code    text unique,                       -- e.g. "NR-CL-0421"
  role           public.app_role not null default 'customer',
  status         public.customer_status not null default 'active',
  tier           public.customer_tier not null default 'Member',
  location       text,
  notes          text,                              -- staff-only
  preferences    jsonb not null default '{
                   "newsletter": false,
                   "privateReleases": false,
                   "smsUpdates": false,
                   "preferredCurrency": "USD",
                   "disciplines": []
                 }'::jsonb,
  preferred_locale public.locale_code not null default 'en',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile for every new auth user.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, first_name, last_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'first_name', split_part(coalesce(new.raw_user_meta_data ->> 'full_name', ''), ' ', 1)),
    coalesce(new.raw_user_meta_data ->> 'last_name', nullif(regexp_replace(coalesce(new.raw_user_meta_data ->> 'full_name', ''), '^\S+\s*', ''), '')),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep `app_metadata.role` in sync so RLS can trust the JWT.
create or replace function public.sync_role_claim()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', new.role::text)
   where id = new.id;
  return new;
end $$;
create trigger profiles_sync_role_claim
  after insert or update of role on public.profiles
  for each row execute function public.sync_role_claim();

-- Only admins may change roles, status, tier, or staff notes — even through a self-update.
create or replace function public.guard_profile_privileged_columns()
returns trigger language plpgsql as $$
begin
  if (new.role is distinct from old.role
      or new.status is distinct from old.status
      or new.tier is distinct from old.tier
      or new.notes is distinct from old.notes
      or new.client_code is distinct from old.client_code)
     and not public.is_admin() then
    raise exception 'insufficient_privilege: privileged profile columns' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger profiles_guard_privileged before update on public.profiles
  for each row execute function public.guard_profile_privileged_columns();

create table public.addresses (
  id                  uuid primary key default gen_random_uuid(),
  profile_id          uuid not null references public.profiles (id) on delete cascade,
  label               text not null default 'Primary',
  first_name          text not null,
  last_name           text not null,
  company             text,
  line1               text not null,
  line2               text,
  city                text not null,
  state               text not null default '',
  postal_code         text not null,
  country             text not null,                -- ISO-3166 alpha-2
  phone               text not null default '',
  is_default_shipping boolean not null default false,
  is_default_billing  boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index addresses_profile_idx on public.addresses (profile_id);
create unique index addresses_one_default_shipping on public.addresses (profile_id) where is_default_shipping;
create unique index addresses_one_default_billing  on public.addresses (profile_id) where is_default_billing;
create trigger addresses_updated_at before update on public.addresses
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. Catalog
-- ----------------------------------------------------------------------------
create table public.categories (
  id                    text primary key,                       -- "cat-audio"
  slug                  public.category_slug not null unique,
  index_number          text not null,                          -- "01"
  name                  text not null,
  short_name            text not null,
  description           text not null default '',
  editorial_statement   text not null default '',
  hero_image            text,
  thumbnail_image       text,
  featured_product_slug text,
  sort_order            int not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

create table public.category_translations (
  category_id         text not null references public.categories (id) on delete cascade,
  locale              public.locale_code not null,
  name                text,
  short_name          text,
  description         text,
  editorial_statement text,
  primary key (category_id, locale)
);

create table public.collections (
  id              text primary key,                             -- "col-monolith"
  slug            text not null unique,
  code            text not null,                                -- "EDITION 04 // MONOLITH"
  title           text not null,
  subtitle        text not null default '',
  description     text not null default '',
  editorial_essay text not null default '',
  hero_image      text,
  secondary_image text,
  season          text not null default '',
  featured        boolean not null default false,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger collections_updated_at before update on public.collections
  for each row execute function public.set_updated_at();

create table public.collection_translations (
  collection_id   text not null references public.collections (id) on delete cascade,
  locale          public.locale_code not null,
  title           text,
  subtitle        text,
  description     text,
  editorial_essay text,
  season          text,
  primary key (collection_id, locale)
);

create table public.products (
  id                    text primary key,                       -- "prod-01"
  slug                  text not null unique,
  sku                   text not null unique,
  model_number          text not null,
  name                  text not null,
  subtitle              text not null default '',
  short_description     text not null default '',
  editorial_description text not null default '',
  category_id           text not null references public.categories (id),
  price                 numeric(12,2) not null check (price >= 0),
  compare_at_price      numeric(12,2) check (compare_at_price is null or compare_at_price >= 0),
  currency              public.currency_code not null default 'USD',
  stock_status          public.stock_status not null default 'in_stock',
  inventory_count       int not null default 0 check (inventory_count >= 0),
  low_stock_threshold   int not null default 5,
  badge                 public.product_badge,
  badge_label           text,
  featured              boolean not null default false,
  is_spotlight          boolean not null default false,
  is_new_arrival        boolean not null default false,
  release_year          int,
  designed_in           text,
  primary_image         text not null,
  secondary_image       text,
  gallery               jsonb not null default '[]'::jsonb,     -- Product.gallery[]
  colors                jsonb not null default '[]'::jsonb,     -- ProductColorVariant[]
  options               jsonb not null default '[]'::jsonb,     -- ProductOptionVariant[]
  option_group_label    text,
  materials             text[] not null default '{}',
  highlights            text[] not null default '{}',
  specifications        jsonb not null default '[]'::jsonb,     -- ProductSpecification[]
  story_blocks          jsonb not null default '[]'::jsonb,     -- ProductStoryBlock[]
  faqs                  jsonb not null default '[]'::jsonb,     -- ProductFAQ[]
  shipping_estimate     text not null default '',
  warranty_years        int not null default 3,
  seo_title             text,
  seo_description       text,
  canonical_path        text,
  status                public.product_status not null default 'draft',
  search_vector         tsvector generated always as (
                          setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
                          setweight(to_tsvector('simple', coalesce(model_number, '') || ' ' || coalesce(sku, '')), 'A') ||
                          setweight(to_tsvector('simple', coalesce(subtitle, '')), 'B') ||
                          setweight(to_tsvector('simple', coalesce(short_description, '')), 'C') ||
                          setweight(to_tsvector('simple', array_to_string(materials, ' ')), 'C')
                        ) stored,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);
create index products_status_idx on public.products (status);
create index products_price_idx on public.products (price);
create index products_search_idx on public.products using gin (search_vector);
create index products_name_trgm_idx on public.products using gin (name gin_trgm_ops);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_translations (
  product_id            text not null references public.products (id) on delete cascade,
  locale                public.locale_code not null,
  name                  text,
  subtitle              text,
  short_description     text,
  editorial_description text,
  highlights            text[],
  materials             text[],
  specifications        jsonb,
  story_blocks          jsonb,
  faqs                  jsonb,
  shipping_estimate     text,
  seo_title             text,
  seo_description       text,
  primary key (product_id, locale)
);

create table public.product_collections (
  product_id    text not null references public.products (id) on delete cascade,
  collection_id text not null references public.collections (id) on delete cascade,
  sort_order    int not null default 0,
  primary key (product_id, collection_id)
);
create index product_collections_collection_idx on public.product_collections (collection_id);

create table public.product_relations (
  product_id         text not null references public.products (id) on delete cascade,
  related_product_id text not null references public.products (id) on delete cascade,
  sort_order         int not null default 0,
  primary key (product_id, related_product_id),
  check (product_id <> related_product_id)
);

create table public.reviews (
  id                uuid primary key default gen_random_uuid(),
  product_id        text not null references public.products (id) on delete cascade,
  profile_id        uuid references public.profiles (id) on delete set null,
  author_name       text not null,
  author_location   text not null default '',
  author_role       text,
  rating            smallint not null check (rating between 1 and 5),
  title             text not null,
  body              text not null,
  verified_purchase boolean not null default false,
  variant_purchased text not null default '',
  helpful_count     int not null default 0,
  approved          boolean not null default false,             -- moderation gate
  created_at        timestamptz not null default now()
);
create index reviews_product_idx on public.reviews (product_id) where approved;

create table public.journal_articles (
  id                   text primary key,                        -- "art-01"
  slug                 text not null unique,
  issue_number         text not null,
  category             text not null,
  title                text not null,
  subtitle             text not null default '',
  excerpt              text not null default '',
  cover_image          text,
  author_name          text not null,
  author_role          text not null default '',
  published_at         timestamptz,
  reading_time_minutes int not null default 5,
  featured             boolean not null default false,
  related_product_ids  text[] not null default '{}',
  content              text[] not null default '{}',
  status               public.product_status not null default 'draft',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create trigger journal_articles_updated_at before update on public.journal_articles
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. Commerce configuration
-- ----------------------------------------------------------------------------
create table public.shipping_methods (
  id                  text primary key,                         -- "ship-white-glove"
  code                text not null unique,
  name                text not null,
  carrier             text not null,
  estimated_window    text not null,
  estimated_dispatch  text not null default '',
  base_cost           numeric(12,2) not null check (base_cost >= 0),
  free_above_subtotal numeric(12,2),
  description         text not null default '',
  countries           text[],                                   -- null = worldwide
  active              boolean not null default true,
  sort_order          int not null default 0
);

create table public.discounts (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,
  description      text not null default '',
  type             public.discount_type not null,
  value            numeric(12,2) not null check (value >= 0),
  min_order_amount numeric(12,2),
  usage_limit      int,
  usage_count      int not null default 0,
  per_customer_limit int,
  status           public.discount_status not null default 'active',
  starts_at        timestamptz not null default now(),
  expires_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create unique index discounts_code_upper_idx on public.discounts (upper(code));
create trigger discounts_updated_at before update on public.discounts
  for each row execute function public.set_updated_at();

create table public.settings (
  key        text primary key,
  value      jsonb not null,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 6. Orders
-- ----------------------------------------------------------------------------
create sequence public.order_number_seq start 94820;

create table public.orders (
  id                   uuid primary key default gen_random_uuid(),
  order_number         text not null unique default ('NR-' || nextval('public.order_number_seq')::text),
  allocation_reference text,
  idempotency_key      text unique,                             -- client-generated, prevents double submit
  profile_id           uuid references public.profiles (id) on delete set null,   -- null = guest
  customer_email       text not null,
  customer_first_name  text not null,
  customer_last_name   text not null,
  customer_phone       text,
  status               public.order_status not null default 'pending_settlement',
  payment_status       public.payment_status not null default 'pending',
  payment_provider     public.payment_provider not null default 'demo',
  payment_method_type  public.payment_method_type,
  payment_brand        text,
  payment_last4        text check (payment_last4 is null or payment_last4 ~ '^\d{4}$'),
  payment_cardholder   text,
  payment_intent_id    text,                                    -- provider reference only
  shipping_method_id   text references public.shipping_methods (id),
  shipping_method      jsonb not null,                          -- snapshot of ShippingMethod
  shipping_address     jsonb not null,                          -- snapshot of Address
  billing_address      jsonb not null,
  subtotal             numeric(12,2) not null,
  discount_amount      numeric(12,2) not null default 0,
  discount_id          uuid references public.discounts (id),
  discount_code        text,
  shipping_cost        numeric(12,2) not null default 0,
  tax_amount           numeric(12,2) not null default 0,
  total                numeric(12,2) not null,
  currency             public.currency_code not null default 'USD',
  carrier              text,
  tracking_number      text,
  estimated_dispatch   text,
  estimated_delivery   text,
  notes                text,
  locale               public.locale_code not null default 'en',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  check (total = round(subtotal - discount_amount + shipping_cost + tax_amount, 2))
);
create index orders_profile_idx on public.orders (profile_id, created_at desc);
create index orders_email_idx on public.orders (lower(customer_email));
create index orders_status_idx on public.orders (status);
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  product_id      text references public.products (id) on delete set null,
  product_slug    text not null,
  product_name    text not null,
  model_number    text not null,
  sku             text not null,
  variant_name    text not null default '',
  selected_finish jsonb,                                        -- {id,name,hex}
  selected_option jsonb,                                        -- {id,label,priceDelta}
  image           text,
  quantity        int not null check (quantity > 0),
  unit_price      numeric(12,2) not null,
  total_price     numeric(12,2) not null,
  check (total_price = round(unit_price * quantity, 2))
);
create index order_items_order_idx on public.order_items (order_id);

create table public.order_events (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  status      text not null,
  description text not null,
  location    text,
  completed   boolean not null default true,
  actor_id    uuid references public.profiles (id),
  created_at  timestamptz not null default now()
);
create index order_events_order_idx on public.order_events (order_id, created_at);

create table public.discount_redemptions (
  id          uuid primary key default gen_random_uuid(),
  discount_id uuid not null references public.discounts (id) on delete cascade,
  order_id    uuid not null references public.orders (id) on delete cascade,
  profile_id  uuid references public.profiles (id) on delete set null,
  amount      numeric(12,2) not null,
  created_at  timestamptz not null default now(),
  unique (order_id)
);

create table public.inventory_movements (
  id          uuid primary key default gen_random_uuid(),
  product_id  text not null references public.products (id) on delete cascade,
  order_id    uuid references public.orders (id) on delete set null,
  delta       int not null,                                     -- negative = allocation
  reason      text not null,                                    -- 'order', 'cancel', 'restock', 'adjustment'
  actor_id    uuid references public.profiles (id),
  created_at  timestamptz not null default now()
);
create index inventory_movements_product_idx on public.inventory_movements (product_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 7. Customer-owned data
-- ----------------------------------------------------------------------------
create table public.wishlist_items (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  product_id text not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, product_id)
);

create table public.carts (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete cascade,
  items      jsonb not null default '[]'::jsonb,                -- CartItem[]
  updated_at timestamptz not null default now()
);
create trigger carts_updated_at before update on public.carts
  for each row execute function public.set_updated_at();

create table public.newsletter_subscribers (
  email       text primary key,
  locale      public.locale_code not null default 'en',
  source      text,
  confirmed   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 8. Audit log (admin & staff mutations)
-- ----------------------------------------------------------------------------
create table public.audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid,
  action      text not null,                                    -- 'product.update', 'order.status'
  entity      text not null,
  entity_id   text not null,
  before      jsonb,
  after       jsonb,
  created_at  timestamptz not null default now()
);
create index audit_log_entity_idx on public.audit_log (entity, entity_id, created_at desc);

create or replace function public.log_audit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log (actor_id, action, entity, entity_id, before, after)
  values (
    auth.uid(),
    tg_table_name || '.' || lower(tg_op),
    tg_table_name,
    coalesce((case when tg_op = 'DELETE' then old.id::text else new.id::text end), ''),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

create trigger products_audit  after insert or update or delete on public.products
  for each row execute function public.log_audit();
create trigger discounts_audit after insert or update or delete on public.discounts
  for each row execute function public.log_audit();
create trigger orders_audit    after update on public.orders
  for each row execute function public.log_audit();

-- ----------------------------------------------------------------------------
-- 9. Row Level Security
-- ----------------------------------------------------------------------------
alter table public.profiles              enable row level security;
alter table public.addresses             enable row level security;
alter table public.categories            enable row level security;
alter table public.category_translations enable row level security;
alter table public.collections           enable row level security;
alter table public.collection_translations enable row level security;
alter table public.products              enable row level security;
alter table public.product_translations  enable row level security;
alter table public.product_collections   enable row level security;
alter table public.product_relations     enable row level security;
alter table public.reviews               enable row level security;
alter table public.journal_articles      enable row level security;
alter table public.shipping_methods      enable row level security;
alter table public.discounts             enable row level security;
alter table public.settings              enable row level security;
alter table public.orders                enable row level security;
alter table public.order_items           enable row level security;
alter table public.order_events          enable row level security;
alter table public.discount_redemptions  enable row level security;
alter table public.inventory_movements   enable row level security;
alter table public.wishlist_items        enable row level security;
alter table public.carts                 enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.audit_log             enable row level security;

-- Profiles: owners read/update themselves (never their own role); staff read all; admin everything.
create policy "profiles: self read"   on public.profiles for select using (auth.uid() = id or public.is_staff());
create policy "profiles: self update" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles: admin all"   on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- Addresses: strictly owner-scoped; staff read for order support.
create policy "addresses: owner"      on public.addresses for all
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
create policy "addresses: staff read" on public.addresses for select using (public.is_staff());

-- Catalog: public can read published rows; admins manage.
create policy "categories: public read"   on public.categories for select using (true);
create policy "categories: admin write"   on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "category_tr: public read"  on public.category_translations for select using (true);
create policy "category_tr: admin write"  on public.category_translations for all using (public.is_admin()) with check (public.is_admin());
create policy "collections: public read"  on public.collections for select using (true);
create policy "collections: admin write"  on public.collections for all using (public.is_admin()) with check (public.is_admin());
create policy "collection_tr: public read" on public.collection_translations for select using (true);
create policy "collection_tr: admin write" on public.collection_translations for all using (public.is_admin()) with check (public.is_admin());
create policy "products: public read"     on public.products for select using (status = 'active' or public.is_staff());
create policy "products: admin write"     on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "product_tr: public read"   on public.product_translations for select using (true);
create policy "product_tr: admin write"   on public.product_translations for all using (public.is_admin()) with check (public.is_admin());
create policy "product_col: public read"  on public.product_collections for select using (true);
create policy "product_col: admin write"  on public.product_collections for all using (public.is_admin()) with check (public.is_admin());
create policy "product_rel: public read"  on public.product_relations for select using (true);
create policy "product_rel: admin write"  on public.product_relations for all using (public.is_admin()) with check (public.is_admin());
create policy "journal: public read"      on public.journal_articles for select using (status = 'active' or public.is_staff());
create policy "journal: admin write"      on public.journal_articles for all using (public.is_admin()) with check (public.is_admin());
create policy "shipping: public read"     on public.shipping_methods for select using (active or public.is_staff());
create policy "shipping: admin write"     on public.shipping_methods for all using (public.is_admin()) with check (public.is_admin());

-- Reviews: approved are public; authenticated users may submit (unapproved) reviews for themselves.
create policy "reviews: public read"   on public.reviews for select using (approved or public.is_staff() or profile_id = auth.uid());
create policy "reviews: self insert"   on public.reviews for insert with check (auth.uid() = profile_id and approved = false);
create policy "reviews: admin write"   on public.reviews for all using (public.is_admin()) with check (public.is_admin());

-- Discounts are never listed publicly; validation goes through the `validate_discount` RPC.
create policy "discounts: staff read"  on public.discounts for select using (public.is_staff());
create policy "discounts: admin write" on public.discounts for all using (public.is_admin()) with check (public.is_admin());
create policy "settings: staff read"   on public.settings for select using (public.is_staff());
create policy "settings: admin write"  on public.settings for all using (public.is_admin()) with check (public.is_admin());

-- Orders: owner read; staff read/update; inserts only through the `place_order` RPC (security definer).
create policy "orders: owner read"     on public.orders for select using (profile_id = auth.uid() or public.is_staff());
create policy "orders: staff update"   on public.orders for update using (public.is_staff()) with check (public.is_staff());
create policy "order_items: via order" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and (o.profile_id = auth.uid() or public.is_staff())));
create policy "order_events: via order" on public.order_events for select
  using (exists (select 1 from public.orders o where o.id = order_id and (o.profile_id = auth.uid() or public.is_staff())));
create policy "order_events: staff insert" on public.order_events for insert with check (public.is_staff());
create policy "redemptions: staff read" on public.discount_redemptions for select using (public.is_staff());
create policy "inventory: staff read"   on public.inventory_movements for select using (public.is_staff());
create policy "inventory: admin write"  on public.inventory_movements for insert with check (public.is_admin());

-- Customer-owned data.
create policy "wishlist: owner" on public.wishlist_items for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "carts: owner" on public.carts for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "newsletter: anyone insert" on public.newsletter_subscribers for insert with check (true);
create policy "newsletter: staff read"    on public.newsletter_subscribers for select using (public.is_staff());
create policy "audit: admin read"         on public.audit_log for select using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 10. Public read views (shape rows close to the TypeScript contracts)
-- ----------------------------------------------------------------------------
create or replace view public.catalog_products as
select
  p.*,
  c.slug  as category_slug,
  c.name  as category_name,
  coalesce(array_agg(pc.collection_id order by pc.sort_order) filter (where pc.collection_id is not null), '{}') as collection_ids,
  coalesce(array_agg(pr.related_product_id order by pr.sort_order) filter (where pr.related_product_id is not null), '{}') as related_product_ids
from public.products p
join public.categories c on c.id = p.category_id
left join public.product_collections pc on pc.product_id = p.id
left join public.product_relations pr on pr.product_id = p.id
group by p.id, c.slug, c.name;

create or replace view public.catalog_categories as
select c.*, count(p.id) filter (where p.status = 'active') as product_count
from public.categories c
left join public.products p on p.category_id = c.id
group by c.id;

create or replace view public.catalog_collections as
select
  c.*,
  coalesce(array_agg(pc.product_id order by pc.sort_order) filter (where pc.product_id is not null), '{}') as product_ids
from public.collections c
left join public.product_collections pc on pc.collection_id = c.id
group by c.id;

-- ----------------------------------------------------------------------------
-- 11. Grants (PostgREST roles)
-- ----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant select on public.catalog_products, public.catalog_categories, public.catalog_collections to anon, authenticated;
grant select on all tables in schema public to authenticated;
grant select on public.categories, public.category_translations, public.collections, public.collection_translations,
             public.products, public.product_translations, public.product_collections, public.product_relations,
             public.reviews, public.journal_articles, public.shipping_methods to anon;
grant insert on public.newsletter_subscribers to anon;
-- Authenticated users get DML grants on every table; RLS policies above decide what each role may touch.
grant insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
