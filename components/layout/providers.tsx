'use client';

import React from 'react';
import type { ShippingMethod } from '@/types';
import { ToastProvider } from '@/components/ui/toast';
import { CommerceProvider } from '@/lib/context/commerce-context';
import { CheckoutProvider } from '@/lib/context/checkout-context';
import {
  DEFAULT_STOREFRONT_CONTENT,
  StorefrontContentProvider,
  type StorefrontContent,
} from '@/lib/context/storefront-content-context';

export function NoireProviders({
  children,
  shippingMethods,
  storefrontContent = DEFAULT_STOREFRONT_CONTENT,
}: {
  children: React.ReactNode;
  shippingMethods: ShippingMethod[];
  storefrontContent?: StorefrontContent;
}) {
  return (
    <StorefrontContentProvider value={storefrontContent}>
      <ToastProvider>
        <CommerceProvider shippingMethods={shippingMethods}>
          <CheckoutProvider>{children}</CheckoutProvider>
        </CommerceProvider>
      </ToastProvider>
    </StorefrontContentProvider>
  );
}
