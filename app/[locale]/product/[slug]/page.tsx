import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import {
  getProductBySlug,
  getRelatedProducts,
  getReviewsByProductId,
  getCategories,
  getCollections,
  getFeaturedProducts,
  getSpotlightProduct,
  getProducts,
} from '@/lib/services/localized';
import { GlobalHeader, GlobalFooter } from '@/components/navigation';
import { QuickViewModal } from '@/components/product';
import {
  ProductBreadcrumbs,
  ProductHeroExperience,
  ProductStorySection,
  ProductMaterialCraft,
  ProductTechnicalDossier,
  ProductFaqReviewsSection,
  ProductRecommendations,
} from '@/components/product-detail';

interface ProductDetailPageProps {
  params: {
    locale: string;
    slug: string;
  };
}

// Product pages are rendered on demand from the database so catalog edits in
// the admin area are visible immediately (revalidated by the admin actions).
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  setRequestLocale(params.locale);
  const product = await getProductBySlug(params.slug);

  if (!product) {
    return {
      title: 'Instrument Not Found | NOIRÉ Archive',
      description: 'The requested instrument dossier could not be located.',
    };
  }

  const seoDescription = product.seoDescription?.trim() || product.shortDescription;
  const canonicalPath = product.canonicalPath?.startsWith('/')
    ? product.canonicalPath
    : `/product/${product.slug}`;

  return {
    title: product.seoTitle?.trim() || `${product.name} (${product.modelNumber}) | NOIRÉ`,
    description: seoDescription,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: product.seoTitle?.trim() || `${product.name} — ${product.subtitle} | NOIRÉ`,
      description: seoDescription,
      images: [
        {
          url: product.primaryImage,
          alt: product.name,
        },
      ],
    },
  };
}

export default async function NoireProductDetailPage({
  params,
}: ProductDetailPageProps) {
  setRequestLocale(params.locale);
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const [
    categories,
    collections,
    featuredProducts,
    spotlightProduct,
    relatedProducts,
    reviews,
    allProductsResponse,
  ] = await Promise.all([
    getCategories(),
    getCollections(),
    getFeaturedProducts(4),
    getSpotlightProduct(),
    getRelatedProducts(product.id, 3),
    getReviewsByProductId(product.id),
    getProducts({ limit: 50 }),
  ]);

  const productCollections = collections.filter(
    (col) =>
      product.collectionIds.includes(col.id) ||
      col.productIds.includes(product.id)
  );

  // Public product metadata only; inventory and review data are omitted.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    mpn: product.modelNumber,
    description: product.shortDescription,
    category: product.categoryName,
    image: [
      product.primaryImage,
      product.secondaryImage,
      ...product.gallery.map((g) => g.url),
    ],
    brand: {
      '@type': 'Brand',
      name: 'NOIRÉ',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: product.currency,
      price: product.price,
      url: `/product/${product.slug}`,
    },
  };
  const jsonLdString = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Structured Product Metadata */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString }}
      />

      {/* Global Navigation Header */}
      <GlobalHeader
        categories={categories}
        collections={collections}
        featuredProducts={featuredProducts}
        spotlightProduct={spotlightProduct}
        allowTransparentTop={false}
      />

      {/* Primary Product Detail Content */}
      <main id="main-content">
        {/* 16 — BREADCRUMBS */}
        <ProductBreadcrumbs product={product} />

        {/* 03–08, 13 — PRODUCT HERO, GALLERY, IDENTITY, CONFIGURATION & PURCHASE MODULE */}
        <ProductHeroExperience
          product={product}
          collections={productCollections}
        />

        {/* 10 — EDITORIAL PRODUCT STORY & MONOGRAPH */}
        <ProductStorySection product={product} />

        {/* 11 — MATERIALITY & SURFACE CRAFT */}
        <ProductMaterialCraft product={product} />

        {/* 09 — TECHNICAL SPECIFICATION DOSSIER */}
        <ProductTechnicalDossier product={product} />

        {/* 12 — CLIENT CALIBRATION REPORTS & ENGINEERING FAQS */}
        <ProductFaqReviewsSection product={product} reviews={reviews} />

        {/* 14 & 15 — COMPLEMENTARY INSTRUMENTS & RECENTLY VIEWED */}
        <ProductRecommendations
          currentProduct={product}
          relatedProducts={relatedProducts}
          allProducts={allProductsResponse.items}
        />
      </main>

      {/* Global Editorial Footer */}
      <GlobalFooter categories={categories} collections={collections} />

      {/* Global Quick Inspect Modal (For Related & Recently Viewed ProductCards) */}
      <QuickViewModal />
    </div>
  );
}
