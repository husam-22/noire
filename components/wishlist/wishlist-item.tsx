'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Eye, Heart, ShoppingBag } from 'lucide-react';
import type { CartItem, Product, ProductColorVariant, ProductOptionVariant } from '@/types';
import {
  Button,
  ColorSwatchGroup,
  PriceDisplay,
  ProductBadge,
  QuantitySelector,
  StockStatusIndicator,
  TechnicalCode,
} from '@/components/ui';
import { formatPrice } from '@/lib/utils';

interface WishlistItemProps {
  product: Product;
  cart: CartItem[];
  serial: number;
  collectionLabel?: string;
  featured?: boolean;
  onRemove: (product: Product) => void;
  onQuickInspect: (product: Product) => void;
  onAllocate: (params: {
    product: Product;
    color: ProductColorVariant;
    option?: ProductOptionVariant;
    quantity: number;
  }) => void;
}

export function WishlistItem({
  product,
  cart,
  serial,
  collectionLabel,
  featured = false,
  onRemove,
  onQuickInspect,
  onAllocate,
}: WishlistItemProps) {
  const t = useTranslations('wishlist.item');
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [selectedColorId, setSelectedColorId] = useState(() =>
    product.colors.length === 1 ? product.colors[0].id : ''
  );
  const [selectedOptionId, setSelectedOptionId] = useState(() => {
    const options = product.options ?? [];
    return options.length === 1 && options[0].inStock ? options[0].id : '';
  });
  const [quantity, setQuantity] = useState(1);

  const selectedColor = product.colors.find((color) => color.id === selectedColorId);
  const options = product.options ?? [];
  const selectedOption = options.find((option) => option.id === selectedOptionId);
  const hasOptions = options.length > 0;
  const needsFinishSelection = product.colors.length > 0 && !selectedColor;
  const needsOptionSelection = hasOptions && !selectedOption;
  const productHasAllocationStock =
    product.stockStatus === 'pre_order' ||
    (product.stockStatus !== 'out_of_stock' && product.inventoryCount > 0);
  const activePrice = product.price + (selectedOption?.priceDelta ?? 0);
  const compareAtPrice = product.compareAtPrice
    ? product.compareAtPrice + (selectedOption?.priceDelta ?? 0)
    : undefined;
  const cartItemId = selectedColor && (!hasOptions || selectedOption)
    ? `${product.id}__${selectedColor.id}__${selectedOption?.id ?? 'default'}`
    : '';
  const matchingCartItem = cart.find((item) => item.id === cartItemId);
  const otherCartConfigurations = cart.filter(
    (item) => item.productId === product.id && item.id !== cartItemId
  );
  const isAlreadyAllocated = Boolean(matchingCartItem);
  const finishAvailable = Boolean(selectedColor?.inStock);
  const optionAvailable = !hasOptions || Boolean(selectedOption?.inStock);
  const canAllocate =
    productHasAllocationStock &&
    finishAvailable &&
    optionAvailable &&
    !needsFinishSelection &&
    !needsOptionSelection;
  const quantityLimit = Math.max(
    1,
    Math.min(10, product.inventoryCount || 5)
  );
  const maxAdditionalQuantity = Math.max(
    0,
    quantityLimit - (matchingCartItem?.quantity ?? 0)
  );
  const hasRemainingCapacity = maxAdditionalQuantity > 0;
  const image = selectedColor?.image || product.primaryImage;

  const handleAllocate = () => {
    if (!selectedColor || !canAllocate || !hasRemainingCapacity) return;
    onAllocate({
      product,
      color: selectedColor,
      option: selectedOption,
      quantity: Math.min(quantity, maxAdditionalQuantity),
    });
  };

  return (
    <motion.article
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.32, delay: prefersReducedMotion ? 0 : Math.min(serial * 0.035, 0.2) }}
      className={`group min-w-0 border border-border bg-surface transition-colors duration-300 hover:border-foreground/45 ${featured ? 'md:grid md:grid-cols-12' : ''}`}
    >
      <div className={`relative overflow-hidden border-b border-border bg-surface-muted ${featured ? 'md:col-span-7 md:border-b-0 md:border-e' : ''}`}>
        <Link
          href={`/product/${product.slug}`}
          aria-label={t('open', { name: product.name })}
          className={`relative block w-full overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-foreground ${featured ? 'aspect-[4/3]' : 'aspect-[4/5]'}`}
        >
          <Image
            src={image}
            alt={`${product.name}${selectedColor ? ` in ${selectedColor.name}` : ''}`}
            fill
            sizes={featured ? '(min-width: 1024px) 52vw, 100vw' : '(min-width: 768px) 48vw, 100vw'}
            className="object-cover transition-transform duration-700 ease-noire-out group-hover:scale-[1.025] motion-reduce:transform-none"
          />
        </Link>
        <div className="pointer-events-none absolute start-3 end-3 top-3 flex items-start justify-between gap-2 sm:start-4 sm:end-4 sm:top-4">
          <span className="border border-border bg-background/90 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.13em] text-foreground">
            {t('serial', { index: String(serial).padStart(2, '0') })}
          </span>
          <div className="pointer-events-auto">
            <ProductBadge type={product.badge} label={product.badgeLabel} />
          </div>
        </div>
      </div>

      <div className={`flex min-w-0 flex-col justify-between p-4 sm:p-6 ${featured ? 'md:col-span-5 md:p-7' : ''}`}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <TechnicalCode>{product.modelNumber}</TechnicalCode>
          </div>

          <div className="pt-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.13em] text-accent">
                {product.categoryName}
              </span>
              {collectionLabel && (
                <span className="max-w-full break-words text-end font-mono text-[9px] uppercase tracking-[0.1em] text-foreground-subtle">
                  {collectionLabel}
                </span>
              )}
            </div>
            <Link
              href={`/product/${product.slug}`}
              className="mt-1.5 block break-words font-display text-xl leading-snug text-foreground transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:text-2xl"
            >
              {product.name}
              <ArrowUpRight className="ms-1.5 inline h-4 w-4 text-foreground-subtle" aria-hidden="true" />
            </Link>
            <p className="mt-1.5 text-small leading-relaxed text-foreground-muted">
              {product.subtitle}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-y border-border py-3">
            <div className="flex flex-wrap items-baseline gap-2">
              {needsOptionSelection && (
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-foreground-subtle">
                  {t('from')}
                </span>
              )}
              <PriceDisplay
                price={activePrice}
                compareAtPrice={compareAtPrice}
                size={featured ? 'lg' : 'md'}
                showDiscountBadge
              />
            </div>
            <StockStatusIndicator
              status={product.stockStatus}
              inventoryCount={product.inventoryCount}
            />
          </div>

          <div className="mt-4 space-y-4">
            {product.colors.length > 0 ? (
              <fieldset>
                <legend className="mb-2 font-mono text-[10px] uppercase tracking-[0.13em] text-foreground-muted">
                  {t('finish')}{needsFinishSelection ? t('selectToAdd') : ''}
                </legend>
                <ColorSwatchGroup
                  colors={product.colors}
                  selectedColorId={selectedColorId}
                  onSelect={(color) => setSelectedColorId(color.id)}
                  size="lg"
                  showLabel={Boolean(selectedColor)}
                />
                {selectedColor && !selectedColor.inStock && (
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-danger">
                    {t('unavailableColor', { color: selectedColor.name })}
                  </p>
                )}
                {needsFinishSelection && (
                  <p className="mt-2 text-[10px] text-foreground-subtle">
                    {t('selectFinish')}
                  </p>
                )}
              </fieldset>
            ) : (
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-danger">
                {t('noFinish')}
              </p>
            )}

            {hasOptions && (
              <fieldset className="space-y-2">
                <legend className="font-mono text-[10px] uppercase tracking-[0.13em] text-foreground-muted">
                  {t('configuration')}{needsOptionSelection ? t('selectToAdd') : ''}
                </legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {options.map((option) => {
                    const selected = selectedOptionId === option.id;
                    return (
                      <label
                        key={option.id}
                        className={`flex min-h-11 min-w-0 cursor-pointer items-start gap-2.5 border px-3 py-2.5 transition-colors ${selected ? 'border-foreground bg-surface-muted' : 'border-border hover:border-foreground/50'} ${!option.inStock ? 'cursor-not-allowed opacity-50' : ''}`}
                      >
                        <input
                          type="radio"
                          name={`wishlist-option-${product.id}`}
                          value={option.id}
                          checked={selected}
                          disabled={!option.inStock}
                          onChange={() => setSelectedOptionId(option.id)}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                          aria-label={`${option.label}${option.priceDelta ? `, ${option.priceDelta > 0 ? t('plus') : ''}${formatPrice(option.priceDelta)}` : ''}${!option.inStock ? t('optionUnavailableAria') : ''}`}
                        />
                        <span className="min-w-0 flex-1 break-words font-mono text-[10px] leading-relaxed text-foreground">
                          {option.label}
                          {option.priceDelta !== 0 && (
                            <span className="mt-1 block text-foreground-subtle">
                              {option.priceDelta > 0 ? '+' : ''}{formatPrice(option.priceDelta)}
                            </span>
                          )}
                          {!option.inStock && (
                            <span className="mt-1 block text-danger">{t('unavailable')}</span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}
          </div>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.13em] text-foreground-subtle">
              {product.stockStatus === 'pre_order'
                ? t('nextBatch', { estimate: product.shippingEstimate })
                : productHasAllocationStock
                  ? t('ready', { estimate: product.shippingEstimate })
                  : t('unavailable')}
            </span>
            {productHasAllocationStock && (
              <QuantitySelector
                value={Math.min(quantity, Math.max(1, maxAdditionalQuantity))}
                onChange={setQuantity}
                max={Math.max(1, maxAdditionalQuantity)}
                size="md"
                disabled={!canAllocate || !hasRemainingCapacity}
                ariaLabel={t('quantity')}
              />
            )}
          </div>

          <div aria-live="polite" aria-atomic="true" className="mb-3 min-h-5">
            {matchingCartItem ? (
              <p className={`font-mono text-[9px] uppercase tracking-[0.13em] ${hasRemainingCapacity ? 'text-success' : 'text-accent'}`}>
                {hasRemainingCapacity
                  ? t('alreadyInBag', { count: matchingCartItem.quantity })
                  : t('limitReached', { count: String(matchingCartItem.quantity).padStart(2, '0') })}
              </p>
            ) : otherCartConfigurations.length > 0 ? (
              <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-accent">
                {t('inBagOther')}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {isAlreadyAllocated ? (
              <Button
                variant="outline"
                size="md"
                fullWidth
                disabled={!canAllocate || !hasRemainingCapacity}
                leftIcon={<ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />}
                onClick={handleAllocate}
              >
                {t('addAnother')}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                fullWidth
                disabled={!canAllocate || !hasRemainingCapacity}
                leftIcon={<ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />}
                onClick={handleAllocate}
              >
                {product.stockStatus === 'pre_order' ? t('reserve') : t('addToBag')}
              </Button>
            )}
            <Button
              variant="secondary"
              size="md"
              fullWidth
              leftIcon={<Eye className="h-3.5 w-3.5" aria-hidden="true" />}
              onClick={() => onQuickInspect(product)}
            >
              {t('quickView')}
            </Button>
          </div>
          {!canAllocate && productHasAllocationStock && (
            <p className="mt-2 text-[10px] text-foreground-subtle">
              {t('chooseConfig')}
            </p>
          )}

          <button
            type="button"
            onClick={() => onRemove(product)}
            aria-label={t('removeAria', { name: product.name })}
            className="mt-3 inline-flex min-h-11 items-center gap-2 font-mono text-[9px] uppercase tracking-[0.13em] text-foreground-subtle transition-colors hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            <Heart className="h-3.5 w-3.5" aria-hidden="true" />
            {t('remove')}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
