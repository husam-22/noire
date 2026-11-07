'use client';

import React, { createContext, useContext } from 'react';
import type { StorefrontContent } from '@/lib/services/supabase/content';

export type { StorefrontContent };

export const DEFAULT_STOREFRONT_CONTENT: StorefrontContent = {
  storeName: 'NOIRÉ',
  announcement: '',
  featuredCollectionId: null,
  currency: 'USD',
  freeShippingThreshold: 500,
  supportEmail: '',
  supportPhone: '',
  cashOnDeliveryEnabled: true,
  bankTransferEnabled: true,
  bankTransferInstructions: '',
};

const StorefrontContentContext = createContext<StorefrontContent>(DEFAULT_STOREFRONT_CONTENT);

export function StorefrontContentProvider({
  value,
  children,
}: {
  value: StorefrontContent;
  children: React.ReactNode;
}) {
  return <StorefrontContentContext.Provider value={value}>{children}</StorefrontContentContext.Provider>;
}

/** Store settings published from /admin/settings and /admin/content (announcement, payment methods, support contact). */
export function useStorefrontContent(): StorefrontContent {
  return useContext(StorefrontContentContext);
}
