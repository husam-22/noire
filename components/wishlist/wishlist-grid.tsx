'use client';

import type { CartItem, Collection, Product, ProductColorVariant, ProductOptionVariant } from '@/types';
import { useTranslations } from 'next-intl';
import { WishlistItem } from '@/components/wishlist/wishlist-item';

interface WishlistGridProps {
  products: Product[];
  cart: CartItem[];
  collections: Collection[];
  onRemove: (product: Product) => void;
  onQuickInspect: (product: Product) => void;
  onAllocate: (params: {
    product: Product;
    color: ProductColorVariant;
    option?: ProductOptionVariant;
    quantity: number;
  }) => void;
}

export function WishlistGrid({
  products,
  cart,
  collections,
  onRemove,
  onQuickInspect,
  onAllocate,
}: WishlistGridProps) {
  const t = useTranslations('wishlist.grid');
  const collectionById = new Map(collections.map((collection) => [collection.id, collection]));

  return (
    <section aria-labelledby="saved-instruments-heading" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-accent">{t('code')}</p>
          <h2 id="saved-instruments-heading" className="mt-1 font-display text-2xl text-foreground sm:text-3xl">
            {t('title')}
          </h2>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
          {t('count', { count: products.length })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12 lg:gap-5">
        {products.map((product, index) => {
          const collection = product.collectionIds
            .map((id) => collectionById.get(id))
            .find((candidate) => candidate !== undefined);
          const featured = products.length === 1;
          const spanClass = products.length === 1
            ? 'lg:col-span-12'
            : index % 2 === 0
              ? 'lg:col-span-7'
              : 'lg:col-span-5';

          return (
            <div key={product.id} className={spanClass}>
              <WishlistItem
                product={product}
                cart={cart}
                serial={index + 1}
                collectionLabel={collection?.title}
                featured={featured}
                onRemove={onRemove}
                onQuickInspect={onQuickInspect}
                onAllocate={onAllocate}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
