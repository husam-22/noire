import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import {
  getCanonicalCatalog,
  getCategories,
  getCollections,
  getFeaturedProducts,
  getSpotlightProduct,
} from '@/lib/services/localized';
import { GlobalFooter, GlobalHeader } from '@/components/navigation';
import { WishlistExperience } from '@/components/wishlist/wishlist-experience';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'pages.wishlist' });
  return {
    title: t('title'),
    description: t('description'),
    robots: { index: false, follow: false },
  };
}

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
