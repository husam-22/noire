'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, Eye, Heart, RotateCcw } from 'lucide-react';
import type { Collection, Product } from '@/types';
import { QuickViewModal } from '@/components/product';
import { WishlistGrid } from '@/components/wishlist/wishlist-grid';
import { WishlistHeader } from '@/components/wishlist/wishlist-header';
import { WishlistContentSkeleton } from '@/components/wishlist/wishlist-loading';
import {
  Button,
  EmptyState,
  Modal,
  PriceDisplay,
  TechnicalCode,
} from '@/components/ui';
import { useCommerce } from '@/lib/context/commerce-context';

interface WishlistExperienceProps {
  allProducts: Product[];
  collections: Collection[];
}

export function WishlistExperience({
  allProducts,
  collections,
}: WishlistExperienceProps) {
  const t = useTranslations('wishlist');
  const {
    addToCart,
    cart,
    clearWishlist,
    isCartHydrated,
    pruneWishlistIds,
    recentlyViewedIds,
    removeWishlistItem,
    setQuickViewProduct,
    syncCartItemFromValidation,
    wishlistIds,
  } = useCommerce();
  const [isClearConfirmationOpen, setIsClearConfirmationOpen] = useState(false);

  const productsById = useMemo(
    () => new Map(allProducts.map((product) => [product.id, product])),
    [allProducts]
  );

  const wishlistProducts = useMemo(() => {
    const seen = new Set<string>();
    const resolved: Product[] = [];
    for (const id of wishlistIds) {
      const product = productsById.get(id);
      if (!product || seen.has(id)) continue;
      seen.add(id);
      resolved.push(product);
    }
    return resolved;
  }, [productsById, wishlistIds]);

  const wishlistProductIds = useMemo(
    () => new Set(wishlistProducts.map((product) => product.id)),
    [wishlistProducts]
  );

  const activeAllocationCount = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          wishlistProductIds.has(item.productId) ? total + item.quantity : total,
        0
      ),
    [cart, wishlistProductIds]
  );

  const recentlyViewedProducts = useMemo(() => {
    const seen = new Set<string>();
    const resolved: Product[] = [];
    for (const id of recentlyViewedIds) {
      const product = productsById.get(id);
      if (!product || wishlistProductIds.has(id) || seen.has(id)) continue;
      seen.add(id);
      resolved.push(product);
      if (resolved.length === 4) break;
    }
    return resolved;
  }, [productsById, recentlyViewedIds, wishlistProductIds]);

  useEffect(() => {
    if (!isCartHydrated) return;
    pruneWishlistIds(allProducts.map((product) => product.id));
  }, [allProducts, isCartHydrated, pruneWishlistIds, wishlistIds]);

  const handleAllocate = useCallback(
    ({
      product,
      color,
      option,
      quantity,
    }: {
      product: Product;
      color: Product['colors'][number];
      option?: NonNullable<Product['options']>[number];
      quantity: number;
    }) => {
      addToCart({ product, color, option, quantity });
      const compositeId = `${product.id}__${color.id}__${option?.id ?? 'default'}`;
      syncCartItemFromValidation(compositeId, {
        price: product.price + (option?.priceDelta ?? 0),
      });
    },
    [addToCart, syncCartItemFromValidation]
  );

  const confirmClearArchive = useCallback(() => {
    clearWishlist();
    setIsClearConfirmationOpen(false);
  }, [clearWishlist]);

  const savedCount = isCartHydrated ? wishlistProducts.length : 0;
  const visibleActiveAllocationCount = isCartHydrated ? activeAllocationCount : 0;

  return (
    <>
      <WishlistHeader
        savedCount={savedCount}
        activeAllocationCount={visibleActiveAllocationCount}
        onClearArchive={() => setIsClearConfirmationOpen(true)}
      />

      <section className="bg-background py-8 sm:py-10 lg:py-12">
        <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
          {!isCartHydrated ? (
            <WishlistContentSkeleton />
          ) : wishlistProducts.length > 0 ? (
            <WishlistGrid
              products={wishlistProducts}
              cart={cart}
              collections={collections}
              onRemove={removeWishlistItem}
              onQuickInspect={setQuickViewProduct}
              onAllocate={handleAllocate}
            />
          ) : (
            <EmptyState
              code={t('empty.code')}
              title={t('empty.title')}
              description={t('empty.description')}
              icon={<Heart className="h-5 w-5" aria-hidden="true" />}
              primaryAction={
                <Link
                  href="/shop"
                  className="inline-flex min-h-11 items-center gap-2 border border-foreground bg-foreground px-5 font-mono text-[10px] uppercase tracking-[0.13em] text-background transition-colors hover:bg-foreground/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  {t('empty.explore')} <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden="true" />
                </Link>
              }
              secondaryAction={
                <Link
                  href="/"
                  className="inline-flex min-h-11 items-center border-b border-border px-1 font-mono text-[10px] uppercase tracking-[0.13em] text-foreground-muted transition-colors hover:border-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  {t('empty.home')}
                </Link>
              }
            />
          )}

          {isCartHydrated && (
            <RecentlyViewedSection
              products={recentlyViewedProducts}
              onQuickInspect={setQuickViewProduct}
            />
          )}
        </div>
      </section>

      <Modal
        isOpen={isClearConfirmationOpen}
        onClose={() => setIsClearConfirmationOpen(false)}
        title={t('clearModal.title')}
        code={t('clearModal.code')}
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsClearConfirmationOpen(false)}
            >
              {t('clearModal.keep')}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              leftIcon={<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}
              onClick={confirmClearArchive}
            >
              {t('clearModal.confirm')}
            </Button>
          </>
        }
      >
        <p className="text-small leading-relaxed text-foreground-muted">
          {t('clearModal.body')}
        </p>
      </Modal>

      <QuickViewModal />
    </>
  );
}

function RecentlyViewedSection({
  products,
  onQuickInspect,
}: {
  products: Product[];
  onQuickInspect: (product: Product) => void;
}) {
  const t = useTranslations('wishlist.recent');
  return (
    <section aria-labelledby="recently-viewed-heading" className="mt-12 border-t border-border pt-7 sm:mt-16 sm:pt-9">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-accent">{t('code')}</p>
          <h2 id="recently-viewed-heading" className="mt-1 font-display text-2xl text-foreground sm:text-3xl">
            {t('title')}
          </h2>
        </div>
        <Link
          href="/shop"
          className="inline-flex min-h-11 items-center gap-2 font-mono text-[9px] uppercase tracking-[0.13em] text-foreground-muted transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          {t('viewAll')} <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden="true" />
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="border border-border bg-surface px-4 py-5 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle sm:px-5">
          {t('empty')}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, index) => (
            <article key={product.id} className="group flex min-w-0 flex-col border border-border bg-surface transition-colors hover:border-foreground/40">
              <Link
                href={`/product/${product.slug}`}
                aria-label={t('open', { name: product.name })}
                className="relative block aspect-[4/3] overflow-hidden bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-foreground"
              >
                <Image
                  src={product.primaryImage}
                  alt={product.name}
                  fill
                  sizes="(min-width: 1024px) 24vw, (min-width: 640px) 48vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.025] motion-reduce:transform-none"
                />
                <span className="absolute start-3 top-3 border border-border bg-background/90 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground">
                  {t('badge', { index: String(index + 1).padStart(2, '0') })}
                </span>
              </Link>
              <div className="flex flex-1 flex-col p-4">
                <TechnicalCode>{product.modelNumber}</TechnicalCode>
                <Link
                  href={`/product/${product.slug}`}
                  className="mt-2 font-display text-lg leading-snug text-foreground transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  {product.name}
                </Link>
                <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                  <PriceDisplay price={product.price} size="sm" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    className="shrink-0 px-2"
                    leftIcon={<Eye className="h-3.5 w-3.5" aria-hidden="true" />}
                    onClick={() => onQuickInspect(product)}
                    aria-label={t('quickView', { name: product.name })}
                  >
                    {t('view')}
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

