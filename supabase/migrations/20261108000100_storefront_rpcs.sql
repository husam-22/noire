-- ============================================================================
-- NOIRÉ — storefront + admin RPCs that complete the Supabase integration.
--
--   • orders default to manual settlement (no card provider connected)
--   • get_order_receipt(uuid)      — guest-safe receipt lookup by unguessable id
--   • confirm_order_payment(uuid)  — staff marks a manual payment as settled
--   • admin_customers view         — profiles + order aggregates for the dashboard
--   • content.* settings           — storefront content managed from /admin/content
-- ============================================================================

alter table public.orders alter column payment_provider set default 'manual';

-- ----------------------------------------------------------------------------
-- get_order_receipt(order_id) → jsonb | null
-- The order id is a v4 UUID issued only to the buyer (confirmation URL), so it
-- acts as the capability for guests; signed-in owners and staff also pass RLS.
-- ----------------------------------------------------------------------------
create or replace function public.get_order_receipt(p_order_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'order',  to_jsonb(o),
    'items',  coalesce((select jsonb_agg(to_jsonb(i) order by i.product_name) from public.order_items  i where i.order_id = o.id), '[]'::jsonb),
    'events', coalesce((select jsonb_agg(to_jsonb(e) order by e.created_at)   from public.order_events e where e.order_id = o.id), '[]'::jsonb)
  )
  from public.orders o
  where o.id = p_order_id;
$$;

grant execute on function public.get_order_receipt(uuid) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- confirm_order_payment(order_id, reference) — staff only
-- ----------------------------------------------------------------------------
create or replace function public.confirm_order_payment(p_order_id uuid, p_reference text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;

  update public.orders
     set payment_status = 'paid',
         payment_intent_id = coalesce(nullif(trim(p_reference), ''), payment_intent_id),
         status = case when status = 'pending_settlement' then 'processing'::public.order_status else status end
   where id = p_order_id;

  if not found then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;

  insert into public.order_events (order_id, status, description, completed, actor_id)
  values (p_order_id, 'processing', 'Payment confirmed. Order moved to the production queue.', true, auth.uid());
end $$;

grant execute on function public.confirm_order_payment(uuid, text) to authenticated;

-- ----------------------------------------------------------------------------
-- admin_customers — one row per profile with order aggregates.
-- security_invoker keeps RLS of profiles/orders in force (staff see all).
-- ----------------------------------------------------------------------------
create or replace view public.admin_customers
with (security_invoker = true) as
select
  p.*,
  coalesce(s.orders_count, 0)::int       as orders_count,
  coalesce(s.total_spent, 0)::numeric    as total_spent,
  s.last_order_at
from public.profiles p
left join (
  select profile_id,
         count(*)                           as orders_count,
         sum(total) filter (where status not in ('cancelled', 'returned')) as total_spent,
         max(created_at)                    as last_order_at
    from public.orders
   where profile_id is not null
   group by profile_id
) s on s.profile_id = p.id;

grant select on public.admin_customers to authenticated;

-- ----------------------------------------------------------------------------
-- Storefront content settings (read publicly through get_storefront_content).
-- ----------------------------------------------------------------------------
insert into public.settings (key, value) values
  ('content.announcement', '""'::jsonb),
  ('content.featured_collection_id', 'null'::jsonb)
on conflict (key) do nothing;

create or replace function public.get_storefront_content()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
    from public.settings
   where key like 'content.%' or key in ('store.currency', 'store.free_shipping_threshold');
$$;

grant execute on function public.get_storefront_content() to anon, authenticated;
