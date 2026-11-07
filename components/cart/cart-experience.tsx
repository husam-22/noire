'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from '@/i18n/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ShoppingBag,
  Trash2,
  Heart,
  Eye,
  ArrowUpRight,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Tag,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  Sparkles,
  Lock,
  Info,
} from 'lucide-react';
import type { Product } from '@/types';
import {
  useCommerce,
  FREE_SHIPPING_THRESHOLD,
} from '@/lib/context/commerce-context';
import { Container, Section } from '@/components/layout';
import {
  Button,
  EmptyState,
  Eyebrow,
  PriceDisplay,
  QuantitySelector,
  TechnicalCode,
} from '@/components/ui';
import { ProductCard } from '@/components/product';
import { cn, formatPrice } from '@/lib/utils';
import { CartSkeleton } from './cart-skeleton';

export interface CartExperienceProps {
  allProducts: Product[];
}

export function CartExperience({ allProducts }: CartExperienceProps) {
  const prefersReducedMotion = useReducedMotion();
  const {
    cart,
    isCartHydrated,
    cartCount,
    cartSubtotal,
    discountAmount,
    appliedDiscount,
    shippingEstimateCost,
    cartTotal,
    freeShippingProgress,
    amountUntilFreeShipping,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    moveToWishlist,
    clearCart,
    applyDiscountCode,
    removeDiscountCode,
    wishlistIds,
    recentlyViewedIds,
    setIsCartDrawerOpen,
    setIsSearchOpen,
    setQuickViewProduct,
  } = useCommerce();

  const [promoInput, setPromoInput] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [promoFeedback, setPromoFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [showTaxTelemetryNote, setShowTaxTelemetryNote] = useState(false);

  // Track primary checkout button visibility for mobile sticky bottom bar
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const [showStickyMobileCheckout, setShowStickyMobileCheckout] =
    useState(false);

  useEffect(() => {
    const el = summaryRef.current;
    if (!el || cart.length === 0) {
      setShowStickyMobileCheckout(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyMobileCheckout(!entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [cart.length]);

  // Keep the document end clear of the fixed mobile checkout bar, including the global footer.
  useEffect(() => {
    if (cart.length === 0) return;
    const previousPaddingBottom = document.body.style.paddingBottom;
    const mobileViewport = window.matchMedia('(max-width: 1023px)');
    const applyFooterClearance = () => {
      document.body.style.paddingBottom = mobileViewport.matches
        ? 'calc(88px + env(safe-area-inset-bottom))'
        : previousPaddingBottom;
    };

    applyFooterClearance();
    mobileViewport.addEventListener('change', applyFooterClearance);
    return () => {
      mobileViewport.removeEventListener('change', applyFooterClearance);
      document.body.style.paddingBottom = previousPaddingBottom;
    };
  }, [cart.length]);

  // Map productIds in cart for quick lookup
  const cartProductIdSet = useMemo(
    () => new Set(cart.map((item) => item.productId)),
    [cart]
  );

  // Products saved in Wishlist Archive that are not currently in the Bag ("Saved for Later")
  const savedForLaterProducts = useMemo(() => {
    return wishlistIds
      .filter((id) => !cartProductIdSet.has(id))
      .map((id) => allProducts.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));
  }, [wishlistIds, cartProductIdSet, allProducts]);

  // Complementary instruments based on relatedProductIds of items in the Bag (or featured fallback)
  const complementaryProducts = useMemo(() => {
    const relatedIds = new Set<string>();
    cart.forEach((item) => {
      const fullProduct = allProducts.find((p) => p.id === item.productId);
      fullProduct?.relatedProductIds.forEach((relId) => {
        if (!cartProductIdSet.has(relId)) {
          relatedIds.add(relId);
        }
      });
    });

    const resolved = Array.from(relatedIds)
      .map((id) => allProducts.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));

    if (resolved.length >= 3) {
      return resolved.slice(0, 3);
    }

    const fallback = allProducts.filter(
      (p) => !cartProductIdSet.has(p.id) && !relatedIds.has(p.id)
    );
    return [...resolved, ...fallback].slice(0, 3);
  }, [cart, allProducts, cartProductIdSet]);

  // Recently viewed products from localStorage (excluding items currently in the Bag)
  const recentlyViewedProducts = useMemo(() => {
    return recentlyViewedIds
      .filter((id) => !cartProductIdSet.has(id))
      .map((id) => allProducts.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p))
      .slice(0, 4);
  }, [recentlyViewedIds, cartProductIdSet, allProducts]);

  // Check if appliedDiscount has a minimum order requirement not currently met
  const discountBelowMinimum = useMemo(() => {
    if (!appliedDiscount?.minOrderAmount) return false;
    return cartSubtotal < appliedDiscount.minOrderAmount;
  }, [appliedDiscount, cartSubtotal]);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = promoInput.trim();
    if (!trimmed) return;

    setIsApplyingPromo(true);
    setPromoFeedback(null);
    try {
      const res = await applyDiscountCode(trimmed);
      setPromoFeedback({
        type: res.valid ? 'success' : 'error',
        message: res.message,
      });
      if (res.valid) {
        setPromoInput('');
      }
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleLoadSampleCommission = () => {
    const aether = allProducts.find((p) => p.slug === 'aether-01-headphones');
    const solis = allProducts.find((p) => p.slug === 'solis-cantilever-lamp');
    if (aether) {
      addToCart({
        product: aether,
        color: aether.colors[0],
        option: aether.options?.[1] ?? aether.options?.[0],
        quantity: 1,
        openDrawer: false,
      });
    }
    if (solis) {
      addToCart({
        product: solis,
        color: solis.colors[1] ?? solis.colors[0],
        quantity: 1,
        openDrawer: false,
      });
    }
  };

  if (!isCartHydrated) {
    return <CartSkeleton />;
  }

  return (
    <>
      {/* 01 — DOSSIER BREADCRUMB & TELEMETRY BAR */}
      <div className="border-b border-border bg-background/90 pt-16 backdrop-blur-sm lg:pt-20">
        <Container
          size="wide"
          className="flex flex-wrap items-center justify-between gap-4 py-3.5"
        >
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em]"
          >
            <Link
              href="/"
              className="text-foreground-muted transition-colors hover:text-foreground"
            >
              Home
            </Link>
            <ChevronRight
              className="h-3 w-3 shrink-0 text-foreground-subtle"
              aria-hidden="true"
            />
            <Link
              href="/shop"
              className="text-foreground-muted transition-colors hover:text-foreground"
            >
              Shop
            </Link>
            <ChevronRight
              className="h-3 w-3 shrink-0 text-foreground-subtle"
              aria-hidden="true"
            />
            <span aria-current="page" className="font-medium text-foreground">
              Bag
            </span>
          </nav>

          <div className="hidden items-center gap-4 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-subtle md:flex">
            <span>NOIRÉ // BAG</span>
            <span className="text-border-strong">·</span>
            <span>
              ACTIVE UNITS: [{String(cartCount).padStart(2, '0')}]
            </span>
            <span className="text-border-strong">·</span>
            <span>SECURE CHECKOUT</span>
          </div>
        </Container>
      </div>

      {/* 02 — EDITORIAL HEADER & COMPLIMENTARY COURIER PROGRESS */}
      <Section spacing="md" borderBottom>
        <Container size="wide">
          <div className="mb-8 flex flex-col justify-between gap-6 border-b border-border pb-8 lg:flex-row lg:items-end">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Eyebrow index="01" tone="accent">
                  COMMISSION MANIFEST
                </Eyebrow>
                <span className="border border-border bg-surface px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-muted">
                  {cart.length} {cart.length === 1 ? 'LINE' : 'LINES'} {'//'}{' '}
                  {cartCount} {cartCount === 1 ? 'UNIT' : 'UNITS'}
                </span>
              </div>
              <h1 className="font-display text-display-md tracking-tight text-foreground">
                Your Bag
              </h1>
              <p className="max-w-2xl font-sans text-body-md leading-relaxed text-foreground-muted">
                Review your configurations and finishes, then continue to checkout.
                Pay in cash on delivery or by bank transfer.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/shop"
                className="inline-flex h-10 items-center gap-2 border border-border bg-surface px-4 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground transition-colors hover:border-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Continue Shopping</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(true)}
                className="inline-flex h-10 items-center gap-2 border border-border bg-surface-muted px-4 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground-muted transition-colors hover:border-foreground hover:text-foreground"
              >
                <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Bag Drawer [{String(cartCount).padStart(2, '0')}]</span>
              </button>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearCart()}
                  className="inline-flex h-10 items-center gap-1.5 border border-border px-3.5 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground-subtle transition-colors hover:border-danger hover:text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Clear Manifest</span>
                </button>
              )}
            </div>
          </div>

          {/* Free delivery threshold */}
          <div className="mb-10 border border-border bg-surface p-4 sm:p-5">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Truck
                  className={cn(
                    'h-4 w-4 shrink-0',
                    amountUntilFreeShipping === 0 && cartSubtotal > 0
                      ? 'text-success'
                      : 'text-accent'
                  )}
                  aria-hidden="true"
                />
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-foreground">
                  {cartSubtotal === 0 ? (
                    <>
                      FREE DELIVERY ON ORDERS ABOVE{' '}
                      {formatPrice(FREE_SHIPPING_THRESHOLD)}
                    </>
                  ) : amountUntilFreeShipping === 0 ? (
                    <>
                      FREE DELIVERY UNLOCKED
                    </>
                  ) : (
                    <>
                      ADD{' '}
                      <span className="font-semibold text-accent">
                        {formatPrice(amountUntilFreeShipping)}
                      </span>{' '}
                      MORE FOR FREE DELIVERY
                    </>
                  )}
                </span>
              </div>

              <span className="font-mono text-[11px] tabular-nums tracking-[0.14em] text-foreground-muted">
                {formatPrice(Math.min(cartSubtotal, FREE_SHIPPING_THRESHOLD))} /{' '}
                {formatPrice(FREE_SHIPPING_THRESHOLD)} ({freeShippingProgress}%)
              </span>
            </div>

            <div
              role="progressbar"
              aria-valuenow={freeShippingProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Free delivery progress"
              className="h-1.5 w-full overflow-hidden bg-surface-muted"
            >
              <div
                className={cn(
                  'h-full transition-all duration-500 ease-noire-out',
                  amountUntilFreeShipping === 0 && cartSubtotal > 0
                    ? 'bg-success'
                    : 'bg-foreground'
                )}
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* 03 — EMPTY BAG EXPERIENCE vs 04 — POPULATED 12-COLUMN ALLOCATION WORKSPACE */}
          {cart.length === 0 ? (
            <div className="space-y-14">
              <EmptyState
                code="BAG // 00 ITEMS"
                title="Your bag is empty"
                description="Explore the full collection of audio, lighting and desk hardware, or add something from your saved items below."
                icon={<ShoppingBag className="h-5 w-5" />}
                primaryAction={
                  <Link
                    href="/shop"
                    className="inline-flex h-11 items-center gap-2 border border-foreground bg-foreground px-6 font-mono text-xs uppercase tracking-[0.14em] text-background transition-opacity hover:opacity-90"
                  >
                    <span>Explore Complete Archive</span>
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                }
                secondaryAction={
                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => setIsSearchOpen(true)}
                    >
                      Search Catalog
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      onClick={handleLoadSampleCommission}
                      leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                    >
                      Load Sample Studio Commission
                    </Button>
                  </div>
                }
              />

              {/* Saved in Archive Strip when Bag is Empty */}
              {savedForLaterProducts.length > 0 && (
                <div className="border border-border bg-surface p-6 sm:p-8">
                  <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
                    <div>
                      <Eyebrow index="ARCHIVE" tone="accent">
                        SAVED FOR LATER
                      </Eyebrow>
                      <h2 className="mt-1 font-display text-h3 text-foreground">
                        Saved in Your Wishlist Archive (
                        {savedForLaterProducts.length})
                      </h2>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-subtle">
                      ONE-CLICK TRANSFER TO ACTIVE BAG
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {savedForLaterProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex gap-4 border border-border bg-background p-4 transition-colors hover:border-border-strong"
                      >
                        <Link
                          href={`/product/${product.slug}`}
                          className="h-24 w-20 shrink-0 overflow-hidden border border-border bg-surface-muted"
                        >
                          <img
                            src={product.primaryImage}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div>
                            <TechnicalCode>{product.modelNumber}</TechnicalCode>
                            <Link
                              href={`/product/${product.slug}`}
                              className="block truncate font-display text-sm font-medium text-foreground hover:text-accent"
                            >
                              {product.name}
                            </Link>
                            <p className="mt-0.5 font-mono text-xs tabular-nums text-foreground-muted">
                              {formatPrice(product.price)}
                            </p>
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                addToCart({
                                  product,
                                  color: product.colors[0],
                                  option: product.options?.[0],
                                  quantity: 1,
                                  openDrawer: false,
                                })
                              }
                              className="inline-flex h-8 items-center gap-1.5 border border-foreground bg-foreground px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-background transition-opacity hover:opacity-90"
                            >
                              <Plus className="h-3 w-3" aria-hidden="true" />
                              <span>Move to Bag</span>
                            </button>
                            <Link
                              href={`/product/${product.slug}`}
                              className="inline-flex h-8 items-center border border-border px-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-muted transition-colors hover:border-foreground hover:text-foreground"
                            >
                              Dossier
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12">
              {/* LEFT COLUMN (7/12 on lg, 8/12 on xl): SERIALIZED LINE-ITEM MANIFEST */}
              <div className="space-y-8 lg:col-span-7 xl:col-span-8">
                {/* Desktop Ledger Column Headers */}
                <div className="hidden grid-cols-12 border-b border-border pb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-subtle sm:grid">
                  <div className="col-span-7">
                    01 // INSTRUMENT &amp; CONFIGURATION
                  </div>
                  <div className="col-span-3 text-center">
                    02 // QUANTITY
                  </div>
                  <div className="col-span-2 text-end">
                    03 // LINE VALUATION
                  </div>
                </div>

                {/* Line Items */}
                <div className="space-y-4">
                  <AnimatePresence initial={false}>
                    {cart.map((item, idx) => {
                      const catalogProduct = allProducts.find(
                        (p) => p.id === item.productId
                      );
                      const lineTotal = item.price * item.quantity;
                      const lineCompareTotal = item.compareAtPrice
                        ? item.compareAtPrice * item.quantity
                        : undefined;

                      return (
                        <motion.article
                          key={item.id}
                          layout={!prefersReducedMotion}
                          initial={
                            prefersReducedMotion
                              ? { opacity: 1 }
                              : { opacity: 0, y: 12 }
                          }
                          animate={{ opacity: 1, y: 0 }}
                          exit={
                            prefersReducedMotion
                              ? { opacity: 0 }
                              : { opacity: 0, y: -10 }
                          }
                          transition={{
                            duration: 0.28,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className="group border border-border bg-surface p-5 transition-colors hover:border-border-strong sm:p-6"
                        >
                          {/* Top Serial Strip */}
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                            <div className="flex items-center gap-2.5">
                              <span className="bg-surface-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground">
                                LINE {String(idx + 1).padStart(2, '0')}
                              </span>
                              <TechnicalCode>{item.modelNumber}</TechnicalCode>
                              <span className="hidden text-border-strong sm:inline">
                                ·
                              </span>
                              <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-muted sm:inline">
                                {item.categoryName}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
                              <Truck
                                className="h-3.5 w-3.5 text-accent"
                                aria-hidden="true"
                              />
                              <span>{item.shippingEstimate}</span>
                            </div>
                          </div>

                          {/* Main Line Body */}
                          <div className="grid grid-cols-1 gap-6 sm:grid-cols-12 sm:items-center">
                            {/* Column 1: Thumbnail + Configuration Dossier (7 cols) */}
                            <div className="flex gap-4 sm:col-span-7 sm:gap-5">
                              <Link
                                href={`/product/${item.slug}`}
                                className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden border border-border bg-surface-muted sm:w-32"
                              >
                                <img
                                  src={item.image}
                                  alt={`${item.name} in ${item.selectedColor.name}`}
                                  className="h-full w-full object-cover transition-transform duration-500 ease-noire-out group-hover:scale-105"
                                />
                              </Link>

                              <div className="flex min-w-0 flex-1 flex-col justify-between">
                                <div className="space-y-2">
                                  <Link
                                    href={`/product/${item.slug}`}
                                    className="block font-display text-lg font-medium leading-snug text-foreground transition-colors hover:text-accent sm:text-xl"
                                  >
                                    {item.name}
                                  </Link>

                                  {/* Selected Finish + Selected Option Specifications */}
                                  <div className="space-y-1.5 border-s-2 border-border-strong/60 ps-3">
                                    <div className="flex items-center gap-2 text-caption text-foreground">
                                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
                                        FINISH:
                                      </span>
                                      <span
                                        className="h-3 w-3 rounded-full border border-border-strong/50"
                                        style={{
                                          backgroundColor:
                                            item.selectedColor.hex,
                                        }}
                                        aria-hidden="true"
                                      />
                                      <span className="font-medium">
                                        {item.selectedColor.name}
                                      </span>
                                    </div>

                                    {item.selectedOption ? (
                                      <div className="flex flex-wrap items-center gap-1.5 text-caption text-foreground">
                                        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
                                          OPTION:
                                        </span>
                                        <span className="font-medium">
                                          {item.selectedOption.label}
                                        </span>
                                        {item.selectedOption.priceDelta > 0 && (
                                          <span className="border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-[10px] text-accent">
                                            +
                                            {formatPrice(
                                              item.selectedOption.priceDelta
                                            )}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5 text-caption text-foreground-muted">
                                        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
                                          SPEC:
                                        </span>
                                        <span>Standard Factory Calibration</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Line Action Controls (Save for Later / Inspect / Remove) */}
                                <div className="mt-4 flex flex-wrap items-center gap-3 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => moveToWishlist(item.id)}
                                    className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-muted transition-colors hover:text-foreground"
                                  >
                                    <Heart
                                      className="h-3.5 w-3.5 text-accent"
                                      aria-hidden="true"
                                    />
                                    <span>Save for Later</span>
                                  </button>

                                  {catalogProduct && (
                                    <>
                                      <span className="text-border-strong">
                                        ·
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setQuickViewProduct(catalogProduct)
                                        }
                                        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-muted transition-colors hover:text-foreground"
                                      >
                                        <Eye
                                          className="h-3.5 w-3.5"
                                          aria-hidden="true"
                                        />
                                        <span>Quick Inspect</span>
                                      </button>
                                    </>
                                  )}

                                  <span className="text-border-strong">·</span>
                                  <button
                                    type="button"
                                    onClick={() => removeFromCart(item.id)}
                                    aria-label={`Remove ${item.name} from bag`}
                                    className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle transition-colors hover:text-danger"
                                  >
                                    <Trash2
                                      className="h-3.5 w-3.5"
                                      aria-hidden="true"
                                    />
                                    <span>Remove</span>
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Column 2: Quantity Controls (3 cols) */}
                            <div className="flex items-center justify-between border-t border-border pt-4 sm:col-span-3 sm:flex-col sm:justify-center sm: gap-1.5 sm:border-t-0 sm:pt-0">
                              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle sm:hidden">
                                QUANTITY
                              </span>
                              <QuantitySelector
                                size="sm"
                                value={item.quantity}
                                max={item.maxQuantity}
                                onChange={(q) => updateCartQuantity(item.id, q)}
                              />
                              <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle sm:inline">
                                MAX {item.maxQuantity} UNITS
                              </span>
                            </div>

                            {/* Column 3: Per-Line Price & Total (2 cols) */}
                            <div className="flex items-baseline justify-between sm:col-span-2 sm:flex-col sm:items-end sm:justify-center">
                              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle sm:hidden">
                                LINE TOTAL
                              </span>
                              <div className="text-end">
                                <PriceDisplay
                                  price={lineTotal}
                                  compareAtPrice={lineCompareTotal}
                                  size="md"
                                />
                                <p className="mt-0.5 font-mono text-[10px] tabular-nums text-foreground-subtle">
                                  {item.quantity > 1
                                    ? `${formatPrice(item.price)} × ${item.quantity}`
                                    : `${formatPrice(item.price)} / unit`}
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.article>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Saved for Later / Wishlist Archive Strip */}
                {savedForLaterProducts.length > 0 && (
                  <div className="border border-border bg-surface p-5 sm:p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <Heart
                          className="h-4 w-4 text-accent"
                          aria-hidden="true"
                        />
                        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-foreground">
                          Saved in Archive ({savedForLaterProducts.length})
                        </h2>
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
                        AVAILABLE TO ADD BACK
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {savedForLaterProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-3.5 border border-border bg-background p-3.5 transition-colors hover:border-border-strong"
                        >
                          <Link
                            href={`/product/${product.slug}`}
                            className="h-16 w-14 shrink-0 overflow-hidden border border-border bg-surface-muted"
                          >
                            <img
                              src={product.primaryImage}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          </Link>
                          <div className="min-w-0 flex-1">
                            <TechnicalCode>{product.modelNumber}</TechnicalCode>
                            <Link
                              href={`/product/${product.slug}`}
                              className="block truncate font-display text-sm font-medium text-foreground hover:text-accent"
                            >
                              {product.name}
                            </Link>
                            <div className="mt-1.5 flex items-center justify-between gap-2">
                              <span className="font-mono text-xs tabular-nums text-foreground-muted">
                                {formatPrice(product.price)}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  addToCart({
                                    product,
                                    color: product.colors[0],
                                    option: product.options?.[0],
                                    quantity: 1,
                                    openDrawer: false,
                                  })
                                }
                                className="inline-flex h-7 items-center gap-1 border border-foreground bg-foreground px-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-background transition-opacity hover:opacity-90"
                              >
                                <Plus
                                  className="h-3 w-3"
                                  aria-hidden="true"
                                />
                                <span>Allocate</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN (5/12 on lg, 4/12 on xl): STICKY ALLOCATION SUMMARY DOSSIER */}
              <aside className="lg:col-span-5 lg:sticky lg:top-28 xl:col-span-4">
                <div
                  ref={summaryRef}
                  className="border border-border bg-surface p-6 shadow-architectural sm:p-8"
                >
                  {/* Summary Header */}
                  <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
                        02 // FINANCIAL LEDGER
                      </span>
                      <h2 className="mt-1 font-display text-h3 text-foreground">
                        Order Summary
                      </h2>
                    </div>
                    <span className="border border-border bg-surface-muted px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground">
                      {cartCount} {cartCount === 1 ? 'UNIT' : 'UNITS'}
                    </span>
                  </div>

                  {/* Discount / Allocation Code Module */}
                  <div className="mb-6 border-b border-border pb-6">
                    <div className="mb-2.5 flex items-center justify-between">
                      <label
                        htmlFor="allocation-code-input"
                        className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground"
                      >
                        <Tag
                          className="h-3.5 w-3.5 text-accent"
                          aria-hidden="true"
                        />
                        <span>Discount Code</span>
                      </label>
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
                        OPTIONAL
                      </span>
                    </div>

                    <form onSubmit={handleApplyPromo} className="flex gap-2">
                      <input
                        id="allocation-code-input"
                        type="text"
                        value={promoInput}
                        onChange={(e) =>
                          setPromoInput(e.target.value.toUpperCase())
                        }
                        placeholder="E.G. EDITION04"
                        aria-label="Discount code"
                        className="h-10 flex-1 border border-border bg-background px-3 font-mono text-xs uppercase tracking-[0.12em] text-foreground placeholder:text-foreground-subtle focus:border-foreground focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={isApplyingPromo || !promoInput.trim()}
                        className="inline-flex h-10 shrink-0 items-center justify-center border border-foreground bg-foreground px-4 font-mono text-[11px] uppercase tracking-[0.14em] text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {isApplyingPromo ? 'Verifying...' : 'Apply'}
                      </button>
                    </form>

                    {/* Active Applied Discount Badge */}
                    {appliedDiscount && (
                      <div className="mt-3 flex items-start justify-between gap-2 border border-accent/40 bg-surface-muted p-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-foreground">
                            <CheckCircle2
                              className="h-3.5 w-3.5 text-success"
                              aria-hidden="true"
                            />
                            <span>{appliedDiscount.code} ACTIVE</span>
                          </div>
                          <p className="text-caption text-foreground-muted">
                            {appliedDiscount.description}
                          </p>
                          {discountBelowMinimum && (
                            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-warning">
                              Requires minimum subtotal of{' '}
                              {formatPrice(appliedDiscount.minOrderAmount ?? 0)}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            removeDiscountCode();
                            setPromoFeedback(null);
                          }}
                          aria-label={`Remove discount code ${appliedDiscount.code}`}
                          className="p-1 text-foreground-subtle transition-colors hover:text-danger"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Validation Feedback */}
                    {promoFeedback && !appliedDiscount && (
                      <div
                        role="status"
                        className={cn(
                          'mt-2.5 flex items-center gap-2 font-mono text-[11px]',
                          promoFeedback.type === 'error'
                            ? 'text-danger'
                            : 'text-success'
                        )}
                      >
                        <AlertCircle
                          className="h-3.5 w-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{promoFeedback.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Line-by-Line Cost Breakdown */}
                  <dl className="space-y-3.5 border-b border-border pb-6 font-sans text-body-sm">
                    <div className="flex items-center justify-between">
                      <dt className="text-foreground-muted">
                        Subtotal ({cartCount}{' '}
                        {cartCount === 1 ? 'unit' : 'units'})
                      </dt>
                      <dd className="font-mono text-sm tabular-nums text-foreground">
                        {formatPrice(cartSubtotal)}
                      </dd>
                    </div>

                    {appliedDiscount && discountAmount > 0 && (
                      <div className="flex items-center justify-between text-accent">
                        <dt className="font-mono text-xs uppercase tracking-[0.12em]">
                          Discount ({appliedDiscount.code})
                        </dt>
                        <dd className="font-mono text-sm tabular-nums">
                          -{formatPrice(discountAmount)}
                        </dd>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <dt className="text-foreground-muted">
                        Delivery
                      </dt>
                      <dd className="font-mono text-xs uppercase tracking-[0.12em] text-foreground">
                        {shippingEstimateCost === 0 ? (
                          <span className="text-success">COMPLIMENTARY</span>
                        ) : (
                          formatPrice(shippingEstimateCost)
                        )}
                      </dd>
                    </div>

                    {/* Tax Placeholder Architecture Ready for Backend Integration */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <dt className="flex items-center gap-1.5 text-foreground-muted">
                          <span>Tax</span>
                          <button
                            type="button"
                            onClick={() =>
                              setShowTaxTelemetryNote((prev) => !prev)
                            }
                            aria-expanded={showTaxTelemetryNote}
                            aria-label="About taxes and duties"
                            className="text-foreground-subtle transition-colors hover:text-foreground"
                          >
                            <Info className="h-3.5 w-3.5" />
                          </button>
                        </dt>
                        <dd className="font-mono text-[11px] uppercase tracking-[0.12em] text-foreground-subtle">
                          INCLUDED
                        </dd>
                      </div>

                      {showTaxTelemetryNote && (
                        <p className="border-s-2 border-border bg-surface-muted p-2.5 font-mono text-[10px] leading-relaxed text-foreground-muted">
                          Prices include applicable taxes. Import duties, where they apply, are settled by the recipient on delivery.
                        </p>
                      )}
                    </div>
                  </dl>

                  {/* Order Total */}
                  <div className="my-6 flex items-baseline justify-between">
                    <div>
                      <span className="block font-mono text-xs uppercase tracking-[0.14em] text-foreground">
                        Total
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
                        USD // PAY ON DELIVERY OR BY TRANSFER
                      </span>
                    </div>
                    <PriceDisplay price={cartTotal} size="xl" />
                  </div>

                  {/* Primary & Secondary CTAs */}
                  <div className="space-y-3">
                    <Link
                      href="/checkout"
                      className="flex h-13 w-full items-center justify-between border border-foreground bg-foreground px-6 font-mono text-xs uppercase tracking-[0.16em] text-background transition-opacity hover:opacity-90"
                    >
                      <span>Proceed to Checkout</span>
                      <span className="flex items-center gap-2">
                        <span className="tabular-nums">
                          {formatPrice(cartTotal)}
                        </span>
                        <ArrowUpRight
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      </span>
                    </Link>

                    <Link
                      href="/shop"
                      className="flex h-11 w-full items-center justify-center border border-border bg-background font-mono text-xs uppercase tracking-[0.14em] text-foreground transition-colors hover:border-foreground"
                    >
                      Continue Shopping
                    </Link>
                  </div>

                  {/* Commission Assurance Ledger */}
                  <div className="mt-6 space-y-3 border-t border-border pt-5">
                    <div className="flex items-start gap-2.5 text-caption text-foreground-muted">
                      <ShieldCheck
                        className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                        aria-hidden="true"
                      />
                      <span>
                        <strong className="font-medium text-foreground">
                          Warranty:
                        </strong>{' '}
                        Every product is covered by the manufacturer warranty stated on its page.
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5 text-caption text-foreground-muted">
                      <RotateCcw
                        className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                        aria-hidden="true"
                      />
                      <span>
                        <strong className="font-medium text-foreground">
                          Returns:
                        </strong>{' '}
                        Unused items in original packaging can be returned within 14 days of delivery.
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5 text-caption text-foreground-muted">
                      <Lock
                        className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                        aria-hidden="true"
                      />
                      <span>
                        <strong className="font-medium text-foreground">
                          Payment:
                        </strong>{' '}
                        No card details are collected online. Pay the courier on delivery or by bank transfer after our team confirms your order.
                      </span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </Container>
      </Section>

      {/* 05 — COMPLEMENTARY STUDIO ARCHITECTURE & RECENTLY VIEWED */}
      <Section spacing="lg" tone="muted">
        <Container size="wide" className="space-y-16">
          {/* Complementary Instruments */}
          {complementaryProducts.length > 0 && (
            <div>
              <div className="mb-8 flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end">
                <div className="space-y-2">
                  <Eyebrow index="03" tone="accent">
                    COMPLEMENTARY ARCHITECTURE
                  </Eyebrow>
                  <h2 className="font-display text-h2 tracking-tight text-foreground">
                    Engineered to Pair With Your Commission
                  </h2>
                </div>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-foreground transition-colors hover:text-accent"
                >
                  <span>View All Instruments</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {complementaryProducts.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    indexLabel={`0${idx + 1} // COMPANION`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recently Viewed Instruments */}
          {recentlyViewedProducts.length > 0 && (
            <div className="border-t border-border pt-12">
              <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div className="space-y-2">
                  <Eyebrow index="04" tone="muted">
                    SESSION ARCHIVE // RECENTLY INSPECTED
                  </Eyebrow>
                  <h3 className="font-display text-h3 tracking-tight text-foreground">
                    Recently Viewed Instruments
                  </h3>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-subtle">
                  PERSISTED IN LOCAL DOSSIER
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {recentlyViewedProducts.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="minimal"
                    indexLabel={`REC // 0${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </Container>
      </Section>

      {/* 06 — MOBILE STICKY BOTTOM CHECKOUT BAR */}
      <AnimatePresence>
        {showStickyMobileCheckout && cart.length > 0 && (
          <motion.div
            initial={
              prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 60 }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={
              prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 60 }
            }
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 start-0 end-0 z-sticky border-t border-border bg-background/95 px-4 py-3 pb-safe backdrop-blur-md shadow-architectural-lg lg:hidden"
          >
            <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
              <div>
                <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-muted">
                  {cartCount} {cartCount === 1 ? 'UNIT' : 'UNITS'} {'//'}{' '}
                  ESTIMATED TOTAL
                </span>
                <PriceDisplay price={cartTotal} size="md" />
              </div>

              <Link
                href="/checkout"
                className="inline-flex h-11 items-center gap-2 border border-foreground bg-foreground px-5 font-mono text-xs uppercase tracking-[0.14em] text-background"
              >
                <span>Checkout</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
