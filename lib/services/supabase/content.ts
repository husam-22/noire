import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface StorefrontContent {
  storeName: string;
  announcement: string;
  featuredCollectionId: string | null;
  currency: string;
  freeShippingThreshold: number;
  supportEmail: string;
  supportPhone: string;
  cashOnDeliveryEnabled: boolean;
  bankTransferEnabled: boolean;
  bankTransferInstructions: string;
}

function readString(value: Record<string, unknown>, key: string, fallback = ''): string {
  return typeof value[key] === 'string' ? (value[key] as string) : fallback;
}
function readBoolean(value: Record<string, unknown>, key: string, fallback: boolean): boolean {
  return typeof value[key] === 'boolean' ? (value[key] as boolean) : fallback;
}

/** Public storefront settings (announcement bar, featured collection, store defaults). */
export async function getStorefrontContent(): Promise<StorefrontContent> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.rpc('get_storefront_content');
  const value = (!error && data && typeof data === 'object' && !Array.isArray(data) ? data : {}) as Record<string, unknown>;
  const cod = readBoolean(value, 'payments.cash_on_delivery_enabled', true);
  const bank = readBoolean(value, 'payments.bank_transfer_enabled', true);
  return {
    storeName: readString(value, 'store.name', 'NOIRÉ'),
    announcement: readString(value, 'content.announcement'),
    featuredCollectionId: readString(value, 'content.featured_collection_id') || null,
    currency: readString(value, 'store.currency', 'USD'),
    freeShippingThreshold:
      typeof value['store.free_shipping_threshold'] === 'number' ? (value['store.free_shipping_threshold'] as number) : 500,
    supportEmail: readString(value, 'store.support_email'),
    supportPhone: readString(value, 'store.support_phone'),
    // Never disable both methods: checkout would have no way to settle.
    cashOnDeliveryEnabled: cod || !bank,
    bankTransferEnabled: bank,
    bankTransferInstructions: readString(value, 'payments.bank_transfer_instructions'),
  };
}
