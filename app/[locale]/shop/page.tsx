import React, { Suspense } from 'react';
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
import { ShopExperience } from '@/components/shop';
import ShopLoading from './loading';

export const metadata: Metadata = {
  title: 'The Instrument Archive — Shop All | NOIRÉ',
  description:
    'Explore NOIRÉ’s complete archive of acoustic instruments, architectural lighting, desk systems, tactile mechanical input, and nomadic field hardware.',
};

export default async function NoireShopPage() {
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
    getProducts({ limit: 50, sort: 'featured' }),
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Global Navigation Header (Solid Alabaster on Shop Archive) */}
      <GlobalHeader
        categories={categories}
        collections={collections}
        featuredProducts={featuredProducts}
        spotlightProduct={spotlightProduct}
        allowTransparentTop={false}
      />

      {/* Primary Shop Archive Content */}
      <main id="main-content">
        <Suspense fallback={<ShopLoading />}>
          <ShopExperience
            initialProducts={allProductsResponse.items}
            categories={categories}
            collections={collections}
          />
        </Suspense>
      </main>

      {/* Global Editorial Footer */}
      <GlobalFooter categories={categories} collections={collections} />

      {/* Global Quick Inspect Product Modal */}
      <QuickViewModal />
    </div>
  );
}
