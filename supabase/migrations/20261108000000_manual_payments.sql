-- Manual settlement (cash on delivery / bank transfer) replaces the demo
-- payment adapter. Enum values must be committed before they are referenced,
-- hence the separate migration from 20261108000100_storefront_rpcs.sql.
alter type public.payment_provider    add value if not exists 'manual';
alter type public.payment_method_type add value if not exists 'cash_on_delivery';
alter type public.payment_method_type add value if not exists 'bank_transfer';
