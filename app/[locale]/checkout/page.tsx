import React from 'react';
import type { Metadata } from 'next';
import {
  getCategories,
  getCollections,
  getFeaturedProducts,
  getSpotlightProduct,
  getShippingMethods,
} from '@/lib/services/localized';
import { GlobalHeader, GlobalFooter } from '@/components/navigation';
import { QuickViewModal } from '@/components/product';
import { CheckoutExperience } from '@/components/checkout';

export const metadata: Metadata = {
  title: 'Checkout | NOIRÉ',
  description: 'Complete your NOIRÉ order — pay in cash on delivery or by bank transfer.',
  robots: { index: false, follow: false },
};

export default async function NoireCheckoutPage() {
  const [categories, collections, featuredProducts, spotlightProduct, shippingMethods] =
    await Promise.all([
      getCategories(),
      getCollections(),
      getFeaturedProducts(4),
      getSpotlightProduct(),
      getShippingMethods(),
    ]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <GlobalHeader
        categories={categories}
        collections={collections}
        featuredProducts={featuredProducts}
        spotlightProduct={spotlightProduct}
        allowTransparentTop={false}
      />
      <CheckoutExperience initialShippingMethods={shippingMethods} />
      <GlobalFooter categories={categories} collections={collections} />
      <QuickViewModal />
    </div>
  );
}
