-- ============================================================================
-- NOIRÉ — Commerce RPCs
--
-- All money-moving logic lives here so the browser can never decide a price.
-- Functions are `security definer` and validate every input against the
-- catalog before touching orders, discounts, or inventory.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- validate_discount(code, subtotal) → { valid, discount_id, type, value, amount, message }
-- Callable by anon + authenticated. Never exposes the discounts table itself.
-- ----------------------------------------------------------------------------
create or replace function public.validate_discount(p_code text, p_subtotal numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  d public.discounts%rowtype;
  v_amount numeric(12,2) := 0;
  v_customer_uses int := 0;
begin
  if p_code is null or length(trim(p_code)) = 0 then
    return jsonb_build_object('valid', false, 'code', 'EMPTY', 'message', 'Enter an allocation code.');
  end if;

  select * into d from public.discounts where upper(code) = upper(trim(p_code));
  if not found then
    return jsonb_build_object('valid', false, 'code', 'NOT_FOUND', 'message', 'This allocation code is not recognised.');
  end if;
  if d.status <> 'active' then
    return jsonb_build_object('valid', false, 'code', 'INACTIVE', 'message', 'This allocation code is not currently active.');
  end if;
  if d.starts_at > now() then
    return jsonb_build_object('valid', false, 'code', 'SCHEDULED', 'message', 'This allocation code is not active yet.');
  end if;
  if d.expires_at is not null and d.expires_at < now() then
    return jsonb_build_object('valid', false, 'code', 'EXPIRED', 'message', 'This allocation code has expired.');
  end if;
  if d.usage_limit is not null and d.usage_count >= d.usage_limit then
    return jsonb_build_object('valid', false, 'code', 'EXHAUSTED', 'message', 'This allocation code has been fully redeemed.');
  end if;
  if d.min_order_amount is not null and p_subtotal < d.min_order_amount then
    return jsonb_build_object(
      'valid', false, 'code', 'MIN_ORDER',
      'message', format('A minimum subtotal of $%s is required for this code.', d.min_order_amount),
      'minOrderAmount', d.min_order_amount
    );
  end if;
  if d.per_customer_limit is not null and auth.uid() is not null then
    select count(*) into v_customer_uses from public.discount_redemptions
     where discount_id = d.id and profile_id = auth.uid();
    if v_customer_uses >= d.per_customer_limit then
      return jsonb_build_object('valid', false, 'code', 'CUSTOMER_LIMIT', 'message', 'You have already used this allocation code.');
    end if;
  end if;

  v_amount := case d.type
    when 'percentage'   then round(p_subtotal * d.value / 100, 2)
    when 'fixed_amount' then least(d.value, p_subtotal)
    else 0
  end;

  return jsonb_build_object(
    'valid', true,
    'discountId', d.id,
    'code', d.code,
    'type', d.type,
    'value', d.value,
    'amount', v_amount,
    'freeShipping', d.type = 'free_shipping',
    'description', d.description
  );
end $$;

grant execute on function public.validate_discount(text, numeric) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- quote_shipping(method_id, subtotal, country) → quoted cost
-- ----------------------------------------------------------------------------
create or replace function public.quote_shipping(p_method_id text, p_subtotal numeric, p_country text default null)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select case
           when m.free_above_subtotal is not null and p_subtotal >= m.free_above_subtotal then 0
           else m.base_cost
         end
    from public.shipping_methods m
   where m.id = p_method_id
     and m.active
     and (m.countries is null or p_country is null or p_country = any (m.countries));
$$;

grant execute on function public.quote_shipping(text, numeric, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- place_order(payload) → order id
--
-- payload = {
--   idempotencyKey: text,
--   customer: { firstName, lastName, email, phone },
--   shippingAddress: Address, billingAddress: Address,
--   shippingMethodId: text,
--   items: [{ productId, colorId, optionId?, quantity }],
--   discountCode?: text,
--   payment: { provider, methodType, brand?, last4?, cardholderName?, intentId? },
--   notes?: text, locale?: 'en' | 'ar'
-- }
--
-- The function re-prices every line from `products`, re-validates the discount,
-- quotes shipping, atomically decrements inventory, and records a timeline event.
-- Tax is 0 until a tax provider is connected (see docs/BACKEND_REQUIREMENTS.md).
-- ----------------------------------------------------------------------------
create or replace function public.place_order(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id      uuid;
  v_existing      uuid;
  v_item          jsonb;
  v_product       public.products%rowtype;
  v_color         jsonb;
  v_option        jsonb;
  v_qty           int;
  v_unit_price    numeric(12,2);
  v_subtotal      numeric(12,2) := 0;
  v_discount      jsonb := null;
  v_discount_amt  numeric(12,2) := 0;
  v_discount_id   uuid := null;
  v_shipping_cost numeric(12,2);
  v_shipping      public.shipping_methods%rowtype;
  v_tax           numeric(12,2) := 0;
  v_total         numeric(12,2);
  v_country       text := payload -> 'shippingAddress' ->> 'country';
  v_lines         jsonb := '[]'::jsonb;
begin
  -- 0. Idempotency: the same key always returns the same order.
  if coalesce(payload ->> 'idempotencyKey', '') = '' then
    raise exception 'idempotencyKey is required' using errcode = '22023';
  end if;
  select id into v_existing from public.orders where idempotency_key = payload ->> 'idempotencyKey';
  if found then
    return v_existing;
  end if;

  if jsonb_array_length(coalesce(payload -> 'items', '[]'::jsonb)) = 0 then
    raise exception 'Order must contain at least one item' using errcode = '22023';
  end if;

  -- 1. Shipping method must exist and serve the destination.
  select * into v_shipping from public.shipping_methods
   where id = payload ->> 'shippingMethodId' and active
     and (countries is null or v_country is null or v_country = any (countries));
  if not found then
    raise exception 'Selected shipping method is unavailable for this destination' using errcode = '22023';
  end if;

  -- 2. Re-price every line from the catalog and lock the rows for inventory.
  for v_item in select * from jsonb_array_elements(payload -> 'items') loop
    v_qty := greatest(coalesce((v_item ->> 'quantity')::int, 0), 0);
    if v_qty = 0 then
      raise exception 'Invalid quantity for product %', v_item ->> 'productId' using errcode = '22023';
    end if;

    select * into v_product from public.products
     where id = v_item ->> 'productId' and status = 'active'
     for update;
    if not found then
      raise exception 'Product % is no longer available', v_item ->> 'productId' using errcode = 'P0002';
    end if;

    if v_product.stock_status = 'out_of_stock' or (v_product.stock_status <> 'pre_order' and v_product.inventory_count < v_qty) then
      raise exception 'Insufficient inventory for %', v_product.name using errcode = 'P0003';
    end if;

    v_color := null;
    select c into v_color from jsonb_array_elements(v_product.colors) c
     where c ->> 'id' = v_item ->> 'colorId' and coalesce((c ->> 'inStock')::boolean, true);
    if v_color is null then
      raise exception 'Selected finish is unavailable for %', v_product.name using errcode = '22023';
    end if;

    v_option := null;
    if coalesce(v_item ->> 'optionId', '') <> '' then
      select o into v_option from jsonb_array_elements(v_product.options) o
       where o ->> 'id' = v_item ->> 'optionId' and coalesce((o ->> 'inStock')::boolean, true);
      if v_option is null then
        raise exception 'Selected configuration is unavailable for %', v_product.name using errcode = '22023';
      end if;
    end if;

    v_unit_price := v_product.price + coalesce((v_option ->> 'priceDelta')::numeric, 0);
    v_subtotal := v_subtotal + round(v_unit_price * v_qty, 2);

    v_lines := v_lines || jsonb_build_object(
      'product', to_jsonb(v_product),
      'color', v_color,
      'option', v_option,
      'quantity', v_qty,
      'unitPrice', v_unit_price
    );
  end loop;

  -- 3. Discount (optional) — same rules as validate_discount, evaluated server-side.
  if coalesce(payload ->> 'discountCode', '') <> '' then
    v_discount := public.validate_discount(payload ->> 'discountCode', v_subtotal);
    if not (v_discount ->> 'valid')::boolean then
      raise exception '%', v_discount ->> 'message' using errcode = '22023';
    end if;
    v_discount_amt := (v_discount ->> 'amount')::numeric;
    v_discount_id  := (v_discount ->> 'discountId')::uuid;
  end if;

  -- 4. Shipping quote.
  v_shipping_cost := public.quote_shipping(v_shipping.id, v_subtotal, v_country);
  if v_discount is not null and (v_discount ->> 'freeShipping')::boolean then
    v_shipping_cost := 0;
  end if;

  v_total := round(v_subtotal - v_discount_amt + v_shipping_cost + v_tax, 2);

  -- 5. Persist the order header.
  insert into public.orders (
    idempotency_key, profile_id,
    customer_email, customer_first_name, customer_last_name, customer_phone,
    status, payment_status, payment_provider, payment_method_type,
    payment_brand, payment_last4, payment_cardholder, payment_intent_id,
    shipping_method_id, shipping_method, shipping_address, billing_address,
    subtotal, discount_amount, discount_id, discount_code,
    shipping_cost, tax_amount, total, currency,
    estimated_dispatch, estimated_delivery, notes, locale,
    allocation_reference
  ) values (
    payload ->> 'idempotencyKey', auth.uid(),
    lower(trim(payload -> 'customer' ->> 'email')),
    payload -> 'customer' ->> 'firstName',
    payload -> 'customer' ->> 'lastName',
    payload -> 'customer' ->> 'phone',
    'pending_settlement', 'pending',
    coalesce((payload -> 'payment' ->> 'provider')::public.payment_provider, 'demo'),
    (payload -> 'payment' ->> 'methodType')::public.payment_method_type,
    payload -> 'payment' ->> 'brand',
    payload -> 'payment' ->> 'last4',
    payload -> 'payment' ->> 'cardholderName',
    payload -> 'payment' ->> 'intentId',
    v_shipping.id, to_jsonb(v_shipping),
    payload -> 'shippingAddress', payload -> 'billingAddress',
    v_subtotal, v_discount_amt, v_discount_id, nullif(upper(trim(payload ->> 'discountCode')), ''),
    v_shipping_cost, v_tax, v_total, 'USD',
    v_shipping.estimated_dispatch, v_shipping.estimated_window,
    nullif(left(payload ->> 'notes', 500), ''),
    coalesce((payload ->> 'locale')::public.locale_code, 'en'),
    'ALLOC-' || to_char(now(), 'YYYY') || '-' || lpad((floor(random() * 9000) + 1000)::text, 4, '0')
  )
  returning id into v_order_id;

  -- 6. Lines + inventory allocation.
  for v_item in select * from jsonb_array_elements(v_lines) loop
    insert into public.order_items (
      order_id, product_id, product_slug, product_name, model_number, sku,
      variant_name, selected_finish, selected_option, image,
      quantity, unit_price, total_price
    ) values (
      v_order_id,
      v_item -> 'product' ->> 'id',
      v_item -> 'product' ->> 'slug',
      v_item -> 'product' ->> 'name',
      v_item -> 'product' ->> 'model_number',
      (v_item -> 'product' ->> 'sku') || coalesce(v_item -> 'color' ->> 'skuSuffix', ''),
      concat_ws(' · ', v_item -> 'color' ->> 'name', v_item -> 'option' ->> 'label'),
      jsonb_build_object('id', v_item -> 'color' ->> 'id', 'name', v_item -> 'color' ->> 'name', 'hex', v_item -> 'color' ->> 'hex'),
      case when v_item -> 'option' is null or v_item -> 'option' = 'null'::jsonb then null
           else jsonb_build_object('id', v_item -> 'option' ->> 'id', 'label', v_item -> 'option' ->> 'label',
                                   'priceDelta', coalesce((v_item -> 'option' ->> 'priceDelta')::numeric, 0)) end,
      coalesce(v_item -> 'color' ->> 'image', v_item -> 'product' ->> 'primary_image'),
      (v_item ->> 'quantity')::int,
      (v_item ->> 'unitPrice')::numeric,
      round((v_item ->> 'unitPrice')::numeric * (v_item ->> 'quantity')::int, 2)
    );

    if (v_item -> 'product' ->> 'stock_status') <> 'pre_order' then
      update public.products
         set inventory_count = inventory_count - (v_item ->> 'quantity')::int,
             stock_status = case
               when inventory_count - (v_item ->> 'quantity')::int <= 0 then 'out_of_stock'::public.stock_status
               when inventory_count - (v_item ->> 'quantity')::int <= low_stock_threshold then 'low_stock'::public.stock_status
               else stock_status end
       where id = v_item -> 'product' ->> 'id';

      insert into public.inventory_movements (product_id, order_id, delta, reason, actor_id)
      values (v_item -> 'product' ->> 'id', v_order_id, -((v_item ->> 'quantity')::int), 'order', auth.uid());
    end if;
  end loop;

  -- 7. Discount ledger.
  if v_discount_id is not null then
    insert into public.discount_redemptions (discount_id, order_id, profile_id, amount)
    values (v_discount_id, v_order_id, auth.uid(), v_discount_amt);
    update public.discounts set usage_count = usage_count + 1 where id = v_discount_id;
  end if;

  -- 8. Timeline.
  insert into public.order_events (order_id, status, description, completed, actor_id)
  values (v_order_id, 'pending_settlement', 'Order received. Awaiting payment settlement.', true, auth.uid());

  return v_order_id;
end $$;

grant execute on function public.place_order(jsonb) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- set_order_status(order_id, status, description, tracking?) — staff only
-- ----------------------------------------------------------------------------
create or replace function public.set_order_status(
  p_order_id uuid,
  p_status public.order_status,
  p_description text default null,
  p_carrier text default null,
  p_tracking_number text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old public.orders%rowtype;
  v_item record;
begin
  if not public.is_staff() then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;

  select * into v_old from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;

  -- Release inventory when an order is cancelled or returned.
  if p_status in ('cancelled', 'returned') and v_old.status not in ('cancelled', 'returned') then
    for v_item in select product_id, quantity from public.order_items where order_id = p_order_id and product_id is not null loop
      update public.products
         set inventory_count = inventory_count + v_item.quantity,
             stock_status = case when stock_status = 'out_of_stock' then 'in_stock'::public.stock_status else stock_status end
       where id = v_item.product_id;
      insert into public.inventory_movements (product_id, order_id, delta, reason, actor_id)
      values (v_item.product_id, p_order_id, v_item.quantity, p_status::text, auth.uid());
    end loop;
  end if;

  update public.orders
     set status = p_status,
         carrier = coalesce(p_carrier, carrier),
         tracking_number = coalesce(p_tracking_number, tracking_number),
         payment_status = case when p_status = 'returned' then 'refunded'::public.payment_status else payment_status end
   where id = p_order_id;

  insert into public.order_events (order_id, status, description, completed, actor_id)
  values (p_order_id, p_status::text, coalesce(p_description, 'Status updated to ' || p_status::text), true, auth.uid());
end $$;

grant execute on function public.set_order_status(uuid, public.order_status, text, text, text) to authenticated;

-- ----------------------------------------------------------------------------
-- mark_order_paid(order_id, provider_ref) — called by the payment webhook
-- handler with the service role; never exposed to browser roles.
-- ----------------------------------------------------------------------------
create or replace function public.mark_order_paid(p_order_id uuid, p_provider_ref text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
     set payment_status = 'paid',
         payment_intent_id = coalesce(p_provider_ref, payment_intent_id),
         status = case when status = 'pending_settlement' then 'processing'::public.order_status else status end
   where id = p_order_id;

  insert into public.order_events (order_id, status, description, completed)
  values (p_order_id, 'processing', 'Payment settled. Allocation moved to production queue.', true);
end $$;

revoke execute on function public.mark_order_paid(uuid, text) from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- admin_dashboard_stats(days) → jsonb — staff only
-- ----------------------------------------------------------------------------
create or replace function public.admin_dashboard_stats(p_days int default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_from timestamptz := now() - make_interval(days => p_days);
  v_prev_from timestamptz := now() - make_interval(days => p_days * 2);
  cur record;
  prev record;
begin
  if not public.is_staff() then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;

  select coalesce(sum(total), 0) as revenue, count(*) as orders,
         count(distinct coalesce(profile_id::text, customer_email)) as customers
    into cur
    from public.orders where created_at >= v_from and status not in ('cancelled', 'returned');

  select coalesce(sum(total), 0) as revenue, count(*) as orders,
         count(distinct coalesce(profile_id::text, customer_email)) as customers
    into prev
    from public.orders where created_at >= v_prev_from and created_at < v_from and status not in ('cancelled', 'returned');

  return jsonb_build_object(
    'totalRevenue', cur.revenue,
    'revenueChangePercentage', case when prev.revenue = 0 then 0 else round((cur.revenue - prev.revenue) / prev.revenue * 100, 1) end,
    'totalOrders', cur.orders,
    'ordersChangePercentage', case when prev.orders = 0 then 0 else round((cur.orders - prev.orders)::numeric / prev.orders * 100, 1) end,
    'totalCustomers', cur.customers,
    'customersChangePercentage', case when prev.customers = 0 then 0 else round((cur.customers - prev.customers)::numeric / prev.customers * 100, 1) end,
    'averageOrderValue', case when cur.orders = 0 then 0 else round(cur.revenue / cur.orders, 2) end,
    'revenueSeries', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'date', d::date, 'revenue', coalesce(s.revenue, 0), 'orders', coalesce(s.orders, 0)
      ) order by d), '[]'::jsonb)
      from generate_series(v_from::date, now()::date, '1 day') d
      left join (
        select created_at::date as day, sum(total) as revenue, count(*) as orders
          from public.orders where created_at >= v_from and status not in ('cancelled', 'returned')
         group by 1
      ) s on s.day = d::date
    ),
    'categoryPerformance', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'category', c.slug, 'name', c.name, 'revenue', x.revenue, 'unitsSold', x.units
      ) order by x.revenue desc), '[]'::jsonb)
      from (
        select p.category_id, sum(oi.total_price) as revenue, sum(oi.quantity) as units
          from public.order_items oi
          join public.orders o on o.id = oi.order_id
          join public.products p on p.id = oi.product_id
         where o.created_at >= v_from and o.status not in ('cancelled', 'returned')
         group by p.category_id
      ) x join public.categories c on c.id = x.category_id
    ),
    'inventoryAlerts', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'productId', id, 'productName', name, 'modelNumber', model_number, 'sku', sku,
        'currentStock', inventory_count, 'reorderThreshold', low_stock_threshold,
        'severity', case when inventory_count = 0 then 'critical' else 'warning' end
      ) order by inventory_count), '[]'::jsonb)
      from public.products where status = 'active' and inventory_count <= low_stock_threshold
    )
  );
end $$;

grant execute on function public.admin_dashboard_stats(int) to authenticated;
