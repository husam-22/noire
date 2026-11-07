-- ----------------------------------------------------------------------------
-- Store settings that the storefront reads publicly (manual payments, support
-- contact) and the admin edits from /admin/settings.
-- ----------------------------------------------------------------------------
insert into public.settings (key, value) values
  ('store.name', '"NOIRÉ"'::jsonb),
  ('store.support_email', '""'::jsonb),
  ('store.support_phone', '""'::jsonb),
  ('payments.cash_on_delivery_enabled', 'true'::jsonb),
  ('payments.bank_transfer_enabled', 'true'::jsonb),
  ('payments.bank_transfer_instructions', '""'::jsonb)
on conflict (key) do nothing;

-- The storefront no longer has a demo provider; orders are settled manually.
update public.settings set value = '"manual"'::jsonb where key = 'checkout.payment_provider';

create or replace function public.get_storefront_content()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
    from public.settings
   where key like 'content.%'
      or key like 'payments.%'
      or key in ('store.name', 'store.currency', 'store.free_shipping_threshold', 'store.support_email', 'store.support_phone');
$$;

grant execute on function public.get_storefront_content() to anon, authenticated;
