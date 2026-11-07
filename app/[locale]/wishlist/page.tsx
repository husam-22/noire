import type { Metadata } from 'next';
import {
  getCanonicalCatalog,
  getCategories,
  getCollections,
  getFeaturedProducts,
  getSpotlightProduct,
} from '@/lib/services/localized';
import { GlobalFooter, GlobalHeader } from '@/components/navigation';
import { WishlistExperience } from '@/components/wishlist/wishlist-experience';

export const metadata: Metadata = {
  title: 'Saved Archive — Private Instrument Ledger',
  description:
    'A private ledger of saved NOIRÉ instruments, exact finishes, and active allocations.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function NoireWishlistPage() {
  const [categories, collections, featuredProducts, spotlightProduct, catalog] =
    await Promise.all([
      getCategories(),
      getCollections(),
      getFeaturedProducts(4),
      getSpotlightProduct(),
      getCanonicalCatalog(),
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

      <main id="main-content">
        <WishlistExperience allProducts={catalog} collections={collections} />
      </main>

      <GlobalFooter categories={categories} collections={collections} />
    </div>
  );
}
