'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { RotateCcw, SearchX, Compass, ShieldCheck } from 'lucide-react';
import { ProductCard } from '@/components/product';
import {
  Skeleton,
  EmptyState,
  ErrorState,
  Button,
} from '@/components/ui';
import { Reveal } from '@/components/motion';
import { cn } from '@/lib/utils';
import type { ShopViewMode } from './shop-filter-utils';
import type { Product } from '@/types';

interface ShopProductGridProps {
  products: Product[];
  totalCatalogCount: number;
  viewMode: ShopViewMode;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  onResetFilters: () => void;
  onClearSearch?: () => void;
  hasSearchQuery?: boolean;
  isSidebarOpen?: boolean;
}

export function ShopProductGridSkeleton({
  viewMode = 'editorial',
  count = 6,
}: {
  viewMode?: ShopViewMode;
  count?: number;
}) {
  const t = useTranslations('shop.grid');
  return (
    <div
      aria-busy="true"
      aria-label={t('loading')}
      className="space-y-8"
    >
      {viewMode === 'editorial' && (
        <div className="grid grid-cols-1 border border-border bg-surface lg:grid-cols-12">
          <Skeleton className="aspect-[16/11] w-full lg:col-span-7" />
          <div className="flex flex-col justify-between space-y-6 p-6 sm:p-8 lg:col-span-5">
            <div className="space-y-4">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-6 w-44" />
            </div>
            <div className="space-y-3 border-t border-border pt-4">
              <Skeleton className="h-7 w-28" />
              <div className="grid grid-cols-2 gap-2.5">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className={cn(
          'grid grid-cols-1 gap-6',
          viewMode === 'grid-2'
            ? 'md:grid-cols-2'
            : 'md:grid-cols-2 xl:grid-cols-3'
        )}
      >
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="flex flex-col justify-between border border-border bg-surface"
          >
            <Skeleton className="aspect-[4/5] w-full border-b border-border" />
            <div className="space-y-3 p-5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3.5 w-full" />
            </div>
            <div className="flex items-center justify-between border-t border-border px-5 py-3.5">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ShopProductGrid({
  products,
  totalCatalogCount,
  viewMode,
  currentPage,
  pageSize,
  isLoading,
  errorMessage,
  onRetry,
  onResetFilters,
  onClearSearch,
  hasSearchQuery = false,
  isSidebarOpen = true,
}: ShopProductGridProps) {
  const t = useTranslations('shop.grid');
  // 1. Service Error State
  if (errorMessage) {
    return (
      <ErrorState
        code={t('errorCode')}
        title={t('errorTitle')}
        description={errorMessage}
        onRetry={onRetry}
        retryLabel={t('errorRetry')}
        secondaryAction={
          <Button variant="outline" size="sm" onClick={onResetFilters}>
            {t('resetParameters')}
          </Button>
        }
      />
    );
  }

  // 2. Loading State
  if (isLoading) {
    return <ShopProductGridSkeleton viewMode={viewMode} count={6} />;
  }

  // 3. Empty Catalog State (when the entire store has 0 active products)
  if (totalCatalogCount === 0) {
    return (
      <EmptyState
        code={t('offlineCode')}
        title={t('offlineTitle')}
        description={t('offlineDescription')}
        icon={<Compass className="h-5 w-5" />}
        primaryAction={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={onRetry}
          >
            {t('reloadArchive')}
          </Button>
        }
      />
    );
  }

  // 4. No Products Match Filters State
  if (products.length === 0) {
    return (
      <EmptyState
        code={t('noMatchCode')}
        title={t('noMatchTitle')}
        description={t('noMatchDescription')}
        icon={<SearchX className="h-5 w-5" />}
        primaryAction={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={onResetFilters}
          >
            {t('resetAllFilters')}
          </Button>
        }
        secondaryAction={
          hasSearchQuery && onClearSearch ? (
            <Button variant="outline" size="sm" onClick={onClearSearch}>
              {t('clearSearchQuery')}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const baseIndexOffset = (currentPage - 1) * pageSize;

  // 5. EDITORIAL RHYTHM VIEW (Lead Large-Split Plate + Architectural Grid + Laboratory Interlude)
  if (viewMode === 'editorial') {
    const useLeadSplit = currentPage === 1 && products.length >= 2;
    const leadProduct = useLeadSplit ? products[0] : null;
    const gridProducts = useLeadSplit ? products.slice(1) : products;

    return (
      <div className="space-y-8">
        {/* Lead Flagship Split Plate (Position 01) */}
        {leadProduct && (
          <Reveal>
            <ProductCard
              product={leadProduct}
              indexLabel="01 // LEAD ARCHIVE INSTRUMENT"
              variant="large-split"
              priority
            />
          </Reveal>
        )}

        {/* Curated Architectural Grid for Remaining Products */}
        {gridProducts.length > 0 && (
          <div
            className={cn(
              'grid grid-cols-1 gap-6',
              isSidebarOpen
                ? 'md:grid-cols-2 xl:grid-cols-3'
                : 'md:grid-cols-2 lg:grid-cols-3'
            )}
          >
            {gridProducts.map((product, idx) => {
              const serialIndex =
                baseIndexOffset + (useLeadSplit ? idx + 2 : idx + 1);
              const formattedSerial = t('serialArchive', { index: String(serialIndex).padStart(2, '0') });

              return (
                <Reveal key={product.id} delay={Math.min(idx * 0.04, 0.2)}>
                  <ProductCard
                    product={product}
                    indexLabel={formattedSerial}
                    aspect="portrait"
                  />
                </Reveal>
              );
            })}
          </div>
        )}

        {/* Subtle Architectural Provenance Footnote Banner */}
        <div className="flex flex-col justify-between gap-4 border border-border bg-surface-muted/60 p-5 sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-start gap-3 sm:items-center">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-accent sm:mt-0"
              aria-hidden="true"
            />
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-foreground-muted">
              {t('provenance')}
            </p>
          </div>
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-subtle">
            {t('tolerance')}
          </span>
        </div>
      </div>
    );
  }

  // 6. 2-COLUMN GALLERY PLATES VIEW
  if (viewMode === 'grid-2') {
    return (
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {products.map((product, idx) => {
          const serialIndex = baseIndexOffset + idx + 1;
          return (
            <Reveal key={product.id} delay={Math.min(idx * 0.04, 0.2)}>
              <ProductCard
                product={product}
                indexLabel={t('serialPlate', { index: String(serialIndex).padStart(2, '0') })}
                aspect="landscape"
              />
            </Reveal>
          );
        })}
      </div>
    );
  }

  // 7. 3-COLUMN TECHNICAL GRID VIEW
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6',
        isSidebarOpen
          ? 'md:grid-cols-2 xl:grid-cols-3'
          : 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      )}
    >
      {products.map((product, idx) => {
        const serialIndex = baseIndexOffset + idx + 1;
        return (
          <Reveal key={product.id} delay={Math.min(idx * 0.04, 0.2)}>
            <ProductCard
              product={product}
              indexLabel={t('serialArchive', { index: String(serialIndex).padStart(2, '0') })}
              aspect="portrait"
            />
          </Reveal>
        );
      })}
    </div>
  );
}
