import React from 'react';
import {
  getCategories,
  getCollections,
  getFeaturedProducts,
  getSpotlightProduct,
  getProducts,
  getJournalArticles,
  getStorefrontContent,
} from '@/lib/services/localized';
import { GlobalHeader, GlobalFooter } from '@/components/navigation';
import { QuickViewModal } from '@/components/product';
import {
  HeroSection,
  HeroTransition,
  BrandStatementSection,
  FeaturedCollectionSection,
  ProductShowcaseSection,
  CategoryDiscoverySection,
  ProductSpotlightSection,
  StoryCraftSection,
  JournalSection,
  NewsletterSection,
} from '@/components/home';

export default async function NoireHomePage() {
  const [
    categories,
    collections,
    featuredProducts,
    spotlightProduct,
    allProductsResponse,
    journalArticles,
    storefrontContent,
  ] = await Promise.all([
    getCategories(),
    getCollections(),
    getFeaturedProducts(4),
    getSpotlightProduct(),
    getProducts({ limit: 12, sort: 'featured' }),
    getJournalArticles(),
    getStorefrontContent(),
  ]);

  const allProducts = allProductsResponse.items;

  // 01. Hero Product: NR-01 // Aether Planar Magnetic Headphones
  const heroProduct =
    allProducts.find((p) => p.id === 'prod-01') || featuredProducts[0];

  // 04. Flagship Collection: chosen in /admin/content, falling back to the first collection.
  const flagshipCollection =
    collections.find((c) => c.id === storefrontContent.featuredCollectionId) ||
    collections.find((c) => c.featured) ||
    collections[0];
  const collectionProducts = flagshipCollection
    ? allProducts.filter((p) => flagshipCollection.productIds.includes(p.id))
    : [];

  // 05. Showcase Products: Curated order for visual rhythm (Large -> Offset Pair -> Large -> Trio)
  const showcaseProducts = [
    allProducts.find((p) => p.id === 'prod-01'), // 01 Large: Aether Headphones
    allProducts.find((p) => p.id === 'prod-04'), // 02 Pair Left: Kinetic-65 Keyboard
    allProducts.find((p) => p.id === 'prod-03'), // 03 Pair Right: Solis Task Lamp
    allProducts.find((p) => p.id === 'prod-05'), // 04 Large: Plinth Desk System
    allProducts.find((p) => p.id === 'prod-06'), // 05 Trio: Nomad Power Core
    allProducts.find((p) => p.id === 'prod-08'), // 06 Trio: Orbit MagSafe Charger
    allProducts.find((p) => p.id === 'prod-12'), // 07 Trio: Chronos E-Ink Horology
  ].filter((p): p is NonNullable<typeof p> => Boolean(p));

  // 07. Campaign Spotlight Product: NR-02 // Monolith One Spatial Speaker
  const campaignSpotlightProduct =
    allProducts.find((p) => p.id === 'prod-02') || spotlightProduct;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Global Navigation Header (Transparent over dark cinema hero -> Solid Alabaster on scroll) */}
      <GlobalHeader
        categories={categories}
        collections={collections}
        featuredProducts={featuredProducts}
        spotlightProduct={spotlightProduct}
        allowTransparentTop
      />

      {/* Primary Editorial Flagship Content */}
      <main id="main-content">
        {/* 01 — HERO */}
        <HeroSection heroProduct={heroProduct} />

        {/* 02 — HERO TRANSITION */}
        <HeroTransition />

        {/* 03 — BRAND STATEMENT */}
        <BrandStatementSection />

        {/* 04 — FEATURED COLLECTION */}
        {flagshipCollection && (
          <FeaturedCollectionSection
            collection={flagshipCollection}
            products={collectionProducts}
          />
        )}

        {/* 05 — PRODUCT SHOWCASE */}
        <ProductShowcaseSection products={showcaseProducts} />

        {/* 06 — CATEGORY DISCOVERY */}
        <CategoryDiscoverySection categories={categories} />

        {/* 07 — PRODUCT SPOTLIGHT */}
        <ProductSpotlightSection product={campaignSpotlightProduct} />

        {/* 08 — STORY / CRAFT */}
        <StoryCraftSection />

        {/* 09 — JOURNAL */}
        <JournalSection articles={journalArticles} />

        {/* 10 — NEWSLETTER / PRIVATE DISPATCH */}
        <NewsletterSection />
      </main>

      {/* 11 — GLOBAL EDITORIAL FOOTER */}
      <GlobalFooter categories={categories} collections={collections} />

      {/* Global Quick Inspect Product Modal */}
      <QuickViewModal />
    </div>
  );
}
