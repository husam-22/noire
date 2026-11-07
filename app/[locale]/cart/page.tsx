import React from 'react';
import type { Metadata } from 'next';
import {
  getCategories,
  getCollections,
  getFeaturedProducts,
  getSpotlightProduct,
  getProducts,
} from '@/lib/services/localized';
import { GlobalHeader, GlobalFooter } from '@/components/navigation';
import { QuickViewModal } from '@/components/product';
import { CartExperience } from '@/components/cart';

export const metadata: Metadata = {
  title: 'Your Bag | NOIRÉ',
  description: 'Review the items in your NOIRÉ bag before checkout.',
  robots: { index: false, follow: false },
};

export default async function NoireCartPage() {
  const [
    categories,
    collections,
    featuredProducts,
    spotlightProduct,
    allProductsResponse,
  ] = await Promise.all([
    getCategories(),
    getCollections(),
    getFeaturedProducts(4),
    getSpotlightProduct(),
    getProducts({ limit: 50 }),
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Global Navigation Header */}
      <GlobalHeader
        categories={categories}
        collections={collections}
        featuredProducts={featuredProducts}
        spotlightProduct={spotlightProduct}
        allowTransparentTop={false}
      />

      {/* Bag */}
      <main id="main-content">
        <CartExperience allProducts={allProductsResponse.items} />
      </main>

      {/* Global Editorial Footer */}
      <GlobalFooter categories={categories} collections={collections} />

      {/* Global Quick Inspect Modal */}
      <QuickViewModal />
    </div>
  );
}
