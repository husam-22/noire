'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  ArrowUpRight,
  ShoppingBag,
  Eye,
  Layers,
} from 'lucide-react';
import { Container, Section } from '@/components/layout';
import { Reveal, StaggerContainer, StaggerItem } from '@/components/motion';
import {
  Eyebrow,
  ProductBadge,
  PriceDisplay,
  StockStatusIndicator,
  Button,
  TechnicalCode,
} from '@/components/ui';
import { useCommerce } from '@/lib/context/commerce-context';
import type { Collection, Product } from '@/types';

interface FeaturedCollectionSectionProps {
  collection: Collection;
  products: Product[];
}

export function FeaturedCollectionSection({
  collection,
  products,
}: FeaturedCollectionSectionProps) {
  const t = useTranslations('home.featured');
  const { addToCart, setQuickViewProduct } = useCommerce();

  // Primary Hero Product of the Collection (Monolith One Spatial Speaker or first product)
  const heroCollectionProduct =
    products.find((p) => p.id === 'prod-02') || products[0];

  // Supporting Collection Instruments
  const supportingProducts = products
    .filter((p) => p.id !== heroCollectionProduct?.id)
    .slice(0, 3);

  if (!heroCollectionProduct) return null;

  return (
    <Section
      id="featured-collection"
      spacing="lg"
      tone="default"
      borderBottom
      aria-labelledby="featured-collection-heading"
    >
      <Container size="wide">
        {/* Top Editorial Spread Header */}
        <Reveal className="mb-12 grid grid-cols-1 items-end gap-8 border-b border-border pb-8 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-7">
            <div className="flex flex-wrap items-center gap-3">
              <Eyebrow index="04" tone="accent">
                {t('eyebrow')}
              </Eyebrow>
              <TechnicalCode>{collection.code}</TechnicalCode>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-subtle">
                {t('season', { season: collection.season })}
              </span>
            </div>
            <h2
              id="featured-collection-heading"
              className="font-display text-h1 tracking-tighter text-foreground"
            >
              {collection.title}:{' '}
              <span className="font-normal italic text-foreground-muted">
                {collection.subtitle}
              </span>
            </h2>
          </div>

          <div className="flex flex-col justify-between space-y-4 lg:col-span-5 lg:items-end lg:text-end">
            <p className="max-w-md text-small leading-relaxed text-foreground-muted">
              {collection.description}
            </p>
            <Link
              href={`/shop?collection=${collection.slug}`}
              className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-foreground underline underline-offset-8 transition-colors hover:text-accent"
            >
              <span>{t('exploreArchive', { title: collection.title })}</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </Reveal>

        {/* Asymmetrical 12-Column Spread: Left 7 Columns (Monumental Hero Object + Technical Ledger) / Right 5 Columns (Supporting Instruments Stack) */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left 7 Columns: Large Flagship Collection Anchor */}
          <Reveal className="border border-border bg-surface lg:col-span-7">
            {/* Top Plate Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-muted sm:px-6">
              <span>
                {t('anchorInstrument', { model: heroCollectionProduct.modelNumber })}
              </span>
              <span className="text-accent">
                {t('serializedAllocation')}
              </span>
            </div>

            {/* Large Editorial Image */}
            <div className="group relative aspect-[16/11] w-full overflow-hidden border-b border-border bg-surface-muted">
              <Link
                href={`/product/${heroCollectionProduct.slug}`}
                className="block h-full w-full"
              >
                <img
                  src={heroCollectionProduct.primaryImage}
                  alt={heroCollectionProduct.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 ease-noire-out group-hover:scale-105"
                />
              </Link>

              <div className="pointer-events-none absolute start-4 top-4 sm:start-6 sm:top-6">
                <ProductBadge
                  type={heroCollectionProduct.badge}
                  label={heroCollectionProduct.badgeLabel}
                />
              </div>
            </div>

            {/* Technical Collection Specifications Ledger */}
            <div className="grid grid-cols-2 border-b border-border bg-surface-muted/50 sm:grid-cols-4">
              <div className="border-b border-e border-border p-4 sm:border-b-0">
                <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-foreground-subtle">
                  {t('specs.metallurgy')}
                </span>
                <span className="mt-1 block font-mono text-xs text-foreground">
                  {t('specs.metallurgyValue')}
                </span>
              </div>
              <div className="border-b border-border p-4 sm:border-b-0 sm:border-e">
                <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-foreground-subtle">
                  {t('specs.finish')}
                </span>
                <span className="mt-1 block font-mono text-xs text-foreground">
                  {t('specs.finishValue')}
                </span>
              </div>
              <div className="border-e border-border p-4">
                <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-foreground-subtle">
                  {t('specs.power')}
                </span>
                <span className="mt-1 block font-mono text-xs text-foreground">
                  {t('specs.powerValue')}
                </span>
              </div>
              <div className="p-4">
                <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-foreground-subtle">
                  {t('specs.mass')}
                </span>
                <span className="mt-1 block font-mono text-xs text-foreground">
                  {t('specs.massValue')}
                </span>
              </div>
            </div>

            {/* Hero Product Dossier & Actions */}
            <div className="space-y-6 p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="space-y-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
                    {heroCollectionProduct.categoryName}
                  </span>
                  <Link
                    href={`/product/${heroCollectionProduct.slug}`}
                    className="block font-display text-h2 tracking-tight text-foreground transition-colors hover:text-accent"
                  >
                    {heroCollectionProduct.name}
                  </Link>
                  <p className="max-w-xl text-small leading-relaxed text-foreground-muted">
                    {heroCollectionProduct.shortDescription}
                  </p>
                </div>

                <div className="shrink-0 sm:text-end">
                  <PriceDisplay
                    price={heroCollectionProduct.price}
                    compareAtPrice={heroCollectionProduct.compareAtPrice}
                    size="lg"
                  />
                  <div className="mt-1.5">
                    <StockStatusIndicator
                      status={heroCollectionProduct.stockStatus}
                      inventoryCount={heroCollectionProduct.inventoryCount}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<ShoppingBag className="h-3.5 w-3.5" />}
                  onClick={() =>
                    addToCart({
                      product: heroCollectionProduct,
                      color: heroCollectionProduct.colors[0],
                      quantity: 1,
                    })
                  }
                >
                  {t('allocateFlagship')}
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  leftIcon={<Eye className="h-3.5 w-3.5" />}
                  onClick={() => setQuickViewProduct(heroCollectionProduct)}
                >
                  {t('quickInspect')}
                </Button>

                <Link
                  href={`/product/${heroCollectionProduct.slug}`}
                  className="ms-auto inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground-muted transition-colors hover:text-foreground"
                >
                  <span>{t('fullSpecifications')}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </Reveal>

          {/* Right 5 Columns: Supporting Collection Instruments + Collection Dossier */}
          <div className="flex flex-col justify-between space-y-6 lg:col-span-5">
            {/* Collection Technical Note Card */}
            <Reveal
              delay={0.08}
              className="border border-border bg-surface-muted p-6"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground">
                  <Layers className="h-3.5 w-3.5 text-accent" />
                  <span>{t('cohesion')}</span>
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-subtle">
                  {t('objectsInSeries', { count: String(collection.productIds.length).padStart(2, '0') })}
                </span>
              </div>
              <p className="mt-3 text-caption leading-relaxed text-foreground-muted">
                {collection.editorialEssay}
              </p>
            </Reveal>

            {/* Supporting Collection Objects Stack */}
            <StaggerContainer className="space-y-4">
              {supportingProducts.map((product, idx) => (
                <StaggerItem
                  key={product.id}
                  className="group grid w-full min-w-0 grid-cols-12 border border-border bg-surface transition-colors duration-300 hover:border-foreground/50"
                >
                  {/* Thumbnail Plate (4 Cols) */}
                  <Link
                    href={`/product/${product.slug}`}
                    className="relative col-span-4 overflow-hidden border-e border-border bg-surface-muted"
                  >
                    <img
                      src={product.primaryImage}
                      alt={product.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 ease-noire-out group-hover:scale-105"
                    />
                    <span className="absolute start-2 top-2 border border-border bg-background/90 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground">
                      04.{idx + 2}
                    </span>
                  </Link>

                  {/* Instrument Info & Instant Allocation (8 Cols) */}
                  <div className="col-span-8 min-w-0 flex flex-col justify-between p-4 sm:p-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-subtle">
                          {product.modelNumber}
                        </span>
                        <PriceDisplay
                          price={product.price}
                          compareAtPrice={product.compareAtPrice}
                          size="sm"
                        />
                      </div>

                      <Link
                        href={`/product/${product.slug}`}
                        className="block font-display text-base font-medium tracking-tight text-foreground transition-colors group-hover:text-accent"
                      >
                        {product.name}
                      </Link>

                      <p className="line-clamp-2 text-caption text-foreground-muted">
                        {product.subtitle}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                      <div className="flex items-center gap-1.5">
                        {product.colors.map((c) => (
                          <span
                            key={c.id}
                            title={c.name}
                            className="h-2.5 w-2.5 rounded-full border border-border"
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                      </div>

                      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => setQuickViewProduct(product)}
                          aria-label={t('quickInspect', { name: product.name })}
                          className="border border-border px-1.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-muted transition-colors hover:border-foreground hover:text-foreground sm:px-2"
                        >
                          {t('inspect')}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            addToCart({
                              product,
                              color: product.colors[0],
                              quantity: 1,
                            })
                          }
                          className="border border-foreground bg-foreground px-1.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-background transition-opacity hover:opacity-90 sm:px-2.5"
                        >
                          {t('allocate')}
                        </button>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </Container>
    </Section>
  );
}
