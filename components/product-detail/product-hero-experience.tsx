'use client';

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Heart,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Check,
  ShieldCheck,
  Truck,
  Wrench,
  Globe,
} from 'lucide-react';
import { Container } from '@/components/layout';
import {
  ProductBadge,
  StockStatusIndicator,
  PriceDisplay,
  ColorSwatchGroup,
  QuantitySelector,
  Button,
  Modal,
  TechnicalCode,
} from '@/components/ui';
import { useCommerce } from '@/lib/context/commerce-context';
import { NOIRE_MOTION_TOKENS } from '@/lib/design-system/tokens';
import { useStableReducedMotion } from '@/lib/hooks/use-stable-reduced-motion';
import { cn, formatPrice } from '@/lib/utils';
import type {
  Product,
  ProductColorVariant,
  ProductOptionVariant,
  Collection,
} from '@/types';

interface GallerySlide {
  id: string;
  url: string;
  alt: string;
  caption: string;
}

interface ProductHeroExperienceProps {
  product: Product;
  collections: Collection[];
}

export function ProductHeroExperience({
  product,
  collections,
}: ProductHeroExperienceProps) {
  const t = useTranslations('productDetail.hero');
  const {
    addToCart,
    toggleWishlist,
    isInWishlist,
    recordProductView,
  } = useCommerce();
  const prefersReducedMotion = useStableReducedMotion();

  // Record product in Recently Viewed on mount
  useEffect(() => {
    recordProductView(product.id);
  }, [product.id, recordProductView]);

  // Selected finish/color & option configuration state
  const [selectedColor, setSelectedColor] = useState<ProductColorVariant>(
    product.colors[0]
  );
  const [selectedOption, setSelectedOption] =
    useState<ProductOptionVariant | null>(product.options?.[0] ?? null);
  const [quantity, setQuantity] = useState<number>(1);

  // Gallery state
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState<boolean>(false);
  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(true);

  // Subtle desktop optical hover zoom state
  const [isZoomActive, setIsZoomActive] = useState<boolean>(false);
  const [zoomOrigin, setZoomOrigin] = useState<{ x: number; y: number }>({
    x: 50,
    y: 50,
  });

  // Touch swipe state for mobile gallery
  const touchStartXRef = useRef<number | null>(null);

  // Add-to-bag state
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [justAdded, setJustAdded] = useState<boolean>(false);

  // Sticky mobile purchase bar visibility observer
  const primaryCtaRef = useRef<HTMLDivElement>(null);
  const [showStickyMobileBar, setShowStickyMobileBar] =
    useState<boolean>(false);

  useEffect(() => {
    const target = primaryCtaRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky mobile bar when primary CTA has scrolled above or out of viewport
        setShowStickyMobileBar(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // Build deduplicated gallery slides reflecting the selected color finish first
  const slides: GallerySlide[] = useMemo(() => {
    const list: GallerySlide[] = [];
    const seenUrls = new Set<string>();

    const addSlide = (url: string | undefined, alt: string, caption: string) => {
      if (!url || seenUrls.has(url)) return;
      seenUrls.add(url);
      list.push({
        id: `slide-${list.length + 1}`,
        url,
        alt,
        caption,
      });
    };

    // 1. Selected Color Variant primary & secondary images
    if (selectedColor?.image) {
      const matchingGalleryItem = product.gallery.find(
        (g) => g.url === selectedColor.image
      );
      addSlide(
        selectedColor.image,
        matchingGalleryItem?.alt ||
          t('slideFinishAlt', { name: product.name, color: selectedColor.name, finish: selectedColor.finish }),
        matchingGalleryItem?.caption ||
          t('slideFinishCaption', { color: selectedColor.name, finish: selectedColor.finish })
      );
    }

    if (selectedColor?.secondaryImage) {
      const matchingGalleryItem = product.gallery.find(
        (g) => g.url === selectedColor.secondaryImage
      );
      addSlide(
        selectedColor.secondaryImage,
        matchingGalleryItem?.alt ||
          t('slideAltViewAlt', { name: product.name, color: selectedColor.name }),
        matchingGalleryItem?.caption ||
          t('slideAltViewCaption', { color: selectedColor.name })
      );
    }

    // 2. Remaining gallery images from product.gallery
    product.gallery.forEach((item, idx) => {
      addSlide(
        item.url,
        item.alt || t('slideGalleryAlt', { name: product.name, index: idx + 1 }),
        item.caption || t('slideGalleryCaption', { name: product.name, index: idx + 1 })
      );
    });

    // 3. Fallback to product.primaryImage & secondaryImage
    addSlide(
      product.primaryImage,
      t('slidePrimaryAlt', { name: product.name }),
      t('slideFigure', { name: product.name, index: 1 })
    );
    addSlide(
      product.secondaryImage,
      t('slideSecondaryAlt', { name: product.name }),
      t('slideFigure', { name: product.name, index: 2 })
    );

    return list;
  }, [product, selectedColor, t]);

  const safeSlideIndex = Math.min(activeSlideIndex, Math.max(0, slides.length - 1));
  const currentSlide = slides[safeSlideIndex] || slides[0];

  const handleSelectColor = useCallback((color: ProductColorVariant) => {
    setSelectedColor(color);
    setActiveSlideIndex(0);
  }, []);

  const handlePrevSlide = useCallback(() => {
    setActiveSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const handleNextSlide = useCallback(() => {
    setActiveSlideIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  // Keyboard navigation when fullscreen modal is open
  useEffect(() => {
    if (!isFullscreenOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrevSlide();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleNextSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenOpen, handlePrevSlide, handleNextSlide]);

  const handleStageKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      handlePrevSlide();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      handleNextSlide();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsFullscreenOpen(true);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const deltaX = endX - touchStartXRef.current;
    if (Math.abs(deltaX) > 42) {
      if (deltaX > 0) {
        handlePrevSlide();
      } else {
        handleNextSlide();
      }
    }
    touchStartXRef.current = null;
  };

  const handleMouseMoveZoom = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
  };

  // Price & availability calculation
  const optionDelta = selectedOption?.priceDelta ?? 0;
  const activeUnitPrice = product.price + optionDelta;
  const activeCompareAtPrice = product.compareAtPrice
    ? product.compareAtPrice + optionDelta
    : undefined;
  const activeSku = `${product.sku}-${selectedColor.skuSuffix}`;

  const isUnavailable =
    product.stockStatus === 'out_of_stock' ||
    !selectedColor.inStock ||
    (selectedOption !== null && !selectedOption.inStock);

  const savedInWishlist = isInWishlist(product.id);

  // Determine context-aware CTA label
  const getPrimaryCtaLabel = () => {
    if (isUnavailable) return t('ctaUnavailable');
    if (justAdded) return t('ctaAdded');
    const price = formatPrice(activeUnitPrice * quantity);
    if (product.stockStatus === 'pre_order') {
      return t('ctaPreOrder', { price });
    }
    if (product.stockStatus === 'low_stock') {
      return t('ctaLowStock', { price });
    }
    return t('cta', { price });
  };

  const handlePurchaseAction = async () => {
    if (isUnavailable || isAdding) return;
    setIsAdding(true);

    await new Promise((resolve) => setTimeout(resolve, 220));

    addToCart({
      product,
      color: selectedColor,
      option: selectedOption ?? undefined,
      quantity,
    });

    setIsAdding(false);
    setJustAdded(true);
    window.setTimeout(() => {
      setJustAdded(false);
    }, 2200);
  };

  // Thumbnail tabs use roving focus so only the active perspective adds a tab stop.
  const galleryTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const handleGalleryTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (slides.length <= 1) return;

    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') {
      nextIndex = (index + 1) % slides.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + slides.length) % slides.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = slides.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      setActiveSlideIndex(nextIndex);
      galleryTabRefs.current[nextIndex]?.focus();
    }
  };

  // Option keyboard navigation
  const optionButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const handleOptionKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    const opts = product.options || [];
    if (opts.length <= 1) return;

    let nextIdx: number | null = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      nextIdx = (idx + 1) % opts.length;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIdx = (idx - 1 + opts.length) % opts.length;
    }

    if (nextIdx !== null && opts[nextIdx]?.inStock) {
      setSelectedOption(opts[nextIdx]);
      optionButtonRefs.current[nextIdx]?.focus();
    }
  };

  const primaryCollection = collections[0];

  return (
    <section
      aria-labelledby="pdp-product-title"
      className="border-b border-border bg-background py-8 sm:py-12 lg:py-16"
    >
      <Container size="wide">
        {/* Asymmetrical 12-Column Editorial Product Hero */}
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12">
          {/* LEFT 7 COLUMNS: Serious Product Inspection Gallery */}
          <div className="space-y-6 lg:col-span-7">
            {/* Primary Framed Gallery Stage */}
            <div className="border border-border bg-surface">
              {/* Top Stage Telemetry Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-muted sm:px-6">
                <div className="flex items-center gap-2.5">
                  <span className="text-foreground">
                    FIG {String(safeSlideIndex + 1).padStart(2, '0')} /{' '}
                    {String(slides.length).padStart(2, '0')}
                  </span>
                  <span>•</span>
                  <span className="truncate text-accent">
                    {selectedColor.name}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFullscreenOpen(true)}
                  aria-label={t('fullscreenAria')}
                  className="inline-flex items-center gap-1.5 text-foreground-muted transition-colors hover:text-foreground"
                >
                  <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t('fullscreen')}</span>
                </button>
              </div>

              {/* Interactive Main Image Stage */}
              <div
                id="pdp-gallery-stage"
                role="tabpanel"
                aria-roledescription="carousel"
                aria-label={`${product.name} image gallery`}
                aria-labelledby={`pdp-gallery-tab-${product.id}-slide-${safeSlideIndex + 1}`}
                tabIndex={0}
                onKeyDown={handleStageKeyDown}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseEnter={() => setIsZoomActive(true)}
                onMouseLeave={() => setIsZoomActive(false)}
                onMouseMove={handleMouseMoveZoom}
                className="group relative aspect-[4/4] w-full overflow-hidden bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground sm:aspect-[16/13]"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide.url}
                    initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
                    transition={{
                      duration: prefersReducedMotion
                        ? 0
                        : NOIRE_MOTION_TOKENS.duration.fast,
                    }}
                    className="h-full w-full"
                  >
                    <img
                      src={currentSlide.url}
                      alt={currentSlide.alt}
                      onLoad={() => setIsImageLoaded(true)}
                      style={
                        isZoomActive && !prefersReducedMotion
                          ? {
                              transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                            }
                          : undefined
                      }
                      className={cn(
                        'h-full w-full object-cover transition-transform duration-500 ease-noire-out',
                        isZoomActive && !prefersReducedMotion && 'lg:scale-[1.07]',
                        !isImageLoaded && 'opacity-80'
                      )}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Top Left Badge */}
                <div className="pointer-events-none absolute start-4 top-4 sm:start-6 sm:top-6">
                  <ProductBadge
                    type={product.badge}
                    label={product.badgeLabel}
                  />
                </div>

                {/* Previous / Next Stage Controls */}
                {slides.length > 1 && (
                  <div className="pointer-events-none absolute inset-x-3 top-1/2 flex -translate-y-1/2 items-center justify-between sm:inset-x-5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevSlide();
                      }}
                      aria-label={t('prevImage')}
                      className="pointer-events-auto flex h-10 w-10 items-center justify-center border border-border bg-background/90 text-foreground backdrop-blur-sm transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextSlide();
                      }}
                      aria-label={t('nextImage')}
                      className="pointer-events-auto flex h-10 w-10 items-center justify-center border border-border bg-background/90 text-foreground backdrop-blur-sm transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                )}

                {/* Subtle Bottom Zoom / Swipe Hint */}
                <div className="pointer-events-none absolute bottom-3 end-3 hidden border border-border bg-background/85 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-foreground-muted backdrop-blur-sm lg:block">
                  {t('hint')}
                </div>
              </div>

              {/* Active Slide Caption Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface px-4 py-3 font-mono text-[11px] text-foreground-muted sm:px-6">
                <span>{currentSlide.caption}</span>
                <span className="text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
                  SKU // {activeSku}
                </span>
              </div>
            </div>

            {/* Thumbnail Strip Navigation */}
            {slides.length > 1 && (
              <div
                role="tablist"
                aria-label={t('thumbnailsAria')}
                aria-orientation="horizontal"
                className="grid grid-cols-4 gap-2.5 sm:gap-4"
              >
                {slides.map((slide, idx) => {
                  const isCurrent = idx === safeSlideIndex;
                  return (
                    <button
                      key={slide.id}
                      ref={(element) => {
                        galleryTabRefs.current[idx] = element;
                      }}
                      type="button"
                      role="tab"
                      id={`pdp-gallery-tab-${product.id}-${slide.id}`}
                      aria-controls="pdp-gallery-stage"
                      aria-selected={isCurrent}
                      tabIndex={isCurrent ? 0 : -1}
                      aria-label={t('viewPerspective', { index: idx + 1, alt: slide.alt })}
                      onKeyDown={(event) => handleGalleryTabKeyDown(event, idx)}
                      onClick={() => setActiveSlideIndex(idx)}
                      className={cn(
                        'group relative aspect-[4/3] overflow-hidden border bg-surface-muted transition-all duration-250',
                        isCurrent
                          ? 'border-foreground ring-1 ring-foreground'
                          : 'border-border opacity-70 hover:border-foreground/50 hover:opacity-100'
                      )}
                    >
                      <img
                        src={slide.url}
                        alt={slide.alt}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span
                        className={cn(
                          'absolute start-2 top-2 border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em]',
                          isCurrent
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border bg-background/90 text-foreground'
                        )}
                      >
                        0{idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Desktop Secondary Editorial Detail Diptych (Provides Visual Dominance & Asymmetry) */}
            {slides.length >= 2 && (
              <div className="hidden grid-cols-2 gap-6 pt-2 lg:grid">
                {slides.slice(1, 3).map((detailSlide, idx) => (
                  <div
                    key={detailSlide.id}
                    onClick={() => {
                      setActiveSlideIndex(idx + 1);
                      setIsFullscreenOpen(true);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveSlideIndex(idx + 1);
                        setIsFullscreenOpen(true);
                      }
                    }}
                    aria-label={t('inspectPlate', { index: idx + 2, alt: detailSlide.alt })}
                    className="group cursor-pointer border border-border bg-surface p-3 transition-colors hover:border-foreground/60"
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-muted">
                      <img
                        src={detailSlide.url}
                        alt={detailSlide.alt}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 ease-noire-out group-hover:scale-105"
                      />
                      <span className="absolute end-2.5 top-2.5 border border-border bg-background/90 p-1.5 text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                        <Maximize2 className="h-3 w-3" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-baseline justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-muted">
                      <span>{t('plate', { index: idx + 2 })}</span>
                      <span className="truncate text-foreground-subtle">
                        {detailSlide.caption}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT 5 COLUMNS: Sticky Product Identity, Configuration & Purchase Dossier */}
          <div className="space-y-7 border border-border bg-surface p-6 sm:p-8 lg:col-span-5 lg:sticky lg:top-24 lg:p-9">
            {/* 01. Product Identity Header */}
            <div className="space-y-4 border-b border-border pb-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/shop?category=${product.category}`}
                    className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent transition-opacity hover:opacity-80"
                  >
                    {product.categoryName}
                  </Link>
                  {primaryCollection && (
                    <>
                      <span className="text-foreground-subtle">/</span>
                      <Link
                        href={`/shop?collection=${primaryCollection.slug}`}
                        className="border border-border bg-surface-muted px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground-muted transition-colors hover:border-foreground hover:text-foreground"
                      >
                        {primaryCollection.title}
                      </Link>
                    </>
                  )}
                </div>

              </div>

              <div className="space-y-2">
                <TechnicalCode className="block text-foreground-muted">
                  {t('skuLine', { model: product.modelNumber, sku: activeSku })}
                </TechnicalCode>

                <h1
                  id="pdp-product-title"
                  className="font-display text-h1 tracking-tighter text-foreground"
                >
                  {product.name}
                </h1>

                <p className="font-display text-base italic text-foreground-muted">
                  {product.subtitle}
                </p>
              </div>

              <p className="text-small leading-relaxed text-foreground-muted">
                {product.shortDescription}
              </p>
            </div>

            {/* 02. Price & Live Stock Telemetry */}
            <div
              aria-live="polite"
              aria-atomic="true"
              className="space-y-3 border-b border-border pb-6"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-subtle">
                    {t('priceLabel')}
                  </span>
                  <PriceDisplay
                    price={activeUnitPrice}
                    compareAtPrice={activeCompareAtPrice}
                    size="xl"
                    showDiscountBadge
                    className="mt-1"
                  />
                </div>

                <StockStatusIndicator
                  status={
                    isUnavailable ? 'out_of_stock' : product.stockStatus
                  }
                  inventoryCount={product.inventoryCount}
                />
              </div>

              {optionDelta !== 0 && selectedOption && (
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent">
                  {t('includesDelta', { price: formatPrice(optionDelta), option: selectedOption.label.toUpperCase() })}
                </p>
              )}
            </div>

            {/* 03. Variant / Finish Configuration */}
            <div className="space-y-6 border-b border-border pb-6">
              {/* Finish / Color Selector */}
              <div className="space-y-2">
                <ColorSwatchGroup
                  colors={product.colors}
                  selectedColorId={selectedColor.id}
                  onSelect={handleSelectColor}
                  size="md"
                  showLabel
                />
              </div>

              {/* Configuration Options (when product.options exists) */}
              {product.options && product.options.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em]">
                    <span className="text-foreground-muted">
                      {product.optionGroupLabel || t('configuration')}
                    </span>
                    {selectedOption && (
                      <span className="text-foreground-subtle">
                        {selectedOption.priceDelta > 0
                          ? `+${formatPrice(selectedOption.priceDelta)}`
                          : t('standard')}
                      </span>
                    )}
                  </div>

                  <div
                    role="radiogroup"
                    aria-label={product.optionGroupLabel || t('configurationAria')}
                    className="space-y-2"
                  >
                    {product.options.map((opt, idx) => {
                      const isSelected = selectedOption?.id === opt.id;
                      return (
                        <button
                          key={opt.id}
                          ref={(el) => {
                            optionButtonRefs.current[idx] = el;
                          }}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={isSelected ? 0 : -1}
                          disabled={!opt.inStock}
                          onKeyDown={(e) => handleOptionKeyDown(e, idx)}
                          onClick={() => setSelectedOption(opt)}
                          className={cn(
                            'flex w-full items-center justify-between border px-4 py-3 text-start transition-colors duration-200',
                            isSelected
                              ? 'border-foreground bg-foreground text-background'
                              : 'border-border bg-background text-foreground hover:border-foreground/50',
                            !opt.inStock && 'cursor-not-allowed opacity-40'
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={cn(
                                'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                                isSelected
                                  ? 'border-background bg-background text-foreground'
                                  : 'border-border-strong/50'
                              )}
                            >
                              {isSelected && (
                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                              )}
                            </span>
                            <span className="truncate font-mono text-xs">
                              {opt.label}
                            </span>
                          </div>

                          <span
                            className={cn(
                              'ms-3 shrink-0 font-mono text-xs tabular-nums',
                              isSelected
                                ? 'text-background/90'
                                : 'text-foreground-muted'
                            )}
                          >
                            {opt.priceDelta > 0
                              ? `+${formatPrice(opt.priceDelta)}`
                              : t('included')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 04. Quantity + Primary Purchase CTA + Secondary Wishlist Action */}
            <div ref={primaryCtaRef} className="space-y-4 border-b border-border pb-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-muted">
                    {t('quantity')}
                  </span>
                  <QuantitySelector
                    value={quantity}
                    onChange={setQuantity}
                    min={1}
                    max={Math.max(1, Math.min(product.inventoryCount || 5, 10))}
                    disabled={isUnavailable}
                  />
                </div>

                {/* Secondary Wishlist Button */}
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  aria-label={
                    savedInWishlist
                      ? t('removeWishlist', { name: product.name })
                      : t('saveWishlist', { name: product.name })
                  }
                  className={cn(
                    'inline-flex h-11 items-center gap-2 border px-4 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors',
                    savedInWishlist
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-background text-foreground hover:border-foreground'
                  )}
                >
                  <Heart
                    className={cn('h-3.5 w-3.5', savedInWishlist && 'fill-current')}
                    aria-hidden="true"
                  />
                  <span>{savedInWishlist ? t('saved') : t('save')}</span>
                </button>
              </div>

              {/* Dominant Primary Purchase Button */}
              <Button
                type="button"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isUnavailable}
                isLoading={isAdding}
                leftIcon={
                  justAdded ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <ShoppingBag className="h-4 w-4" />
                  )
                }
                onClick={handlePurchaseAction}
              >
                {getPrimaryCtaLabel()}
              </Button>

              {/* Quick Anchor Links to Dossier Sections */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-subtle">
                <a
                  href="#specifications"
                  className="transition-colors hover:text-foreground"
                >
                  ↓ Technical Dossier ({product.specifications.length} Specs)
                </a>
                <a
                  href="#editorial-story"
                  className="transition-colors hover:text-foreground"
                >
                  ↓ Engineering Story
                </a>
              </div>
            </div>

            {/* 05. Shipping / Service / Support Confidence Ledger (Backed strictly by product data) */}
            <div className="space-y-3 font-mono text-[11px]">
              <div className="flex items-start gap-3">
                <Truck
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                  aria-hidden="true"
                />
                <div>
                  <span className="block uppercase tracking-[0.12em] text-foreground">
                    {t('shippingLabel')}
                  </span>
                  <span className="text-foreground-muted">
                    {product.shippingEstimate}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                  aria-hidden="true"
                />
                <div>
                  <span className="block uppercase tracking-[0.12em] text-foreground">
                    {t('warrantyLabel')}
                  </span>
                  <span className="text-foreground-muted">
                    {t('warrantyValue', { years: product.warrantyYears })}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Wrench
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                  aria-hidden="true"
                />
                <div>
                  <span className="block uppercase tracking-[0.12em] text-foreground">
                    {t('serviceLabel')}
                  </span>
                  <span className="text-foreground-muted">
                    {t('serviceValue')}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Globe
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                  aria-hidden="true"
                />
                <div>
                  <span className="block uppercase tracking-[0.12em] text-foreground">
                    {t('provenanceLabel')}
                  </span>
                  <span className="text-foreground-muted">
                    {t('provenanceValue', { origin: product.designedIn, year: product.releaseYear })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* FULLSCREEN IMAGE INSPECTION MODAL */}
      <Modal
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
        title={t('modalTitle', { name: product.name, color: selectedColor.name })}
        code={t('modalCode', {
          index: String(safeSlideIndex + 1).padStart(2, '0'),
          total: String(slides.length).padStart(2, '0'),
          model: product.modelNumber,
        })}
        size="full"
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-4">
            <p className="font-mono text-xs text-foreground-muted">
              {currentSlide.caption}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevSlide}
                disabled={slides.length <= 1}
              >
                {t('previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextSlide}
                disabled={slides.length <= 1}
              >
                {t('next')}
              </Button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="relative flex aspect-[16/11] w-full items-center justify-center overflow-hidden border border-border bg-surface-muted lg:col-span-9">
            <img
              src={currentSlide.url}
              alt={currentSlide.alt}
              className="max-h-[72vh] w-full object-contain"
            />
          </div>

          <div className="flex flex-col justify-between space-y-6 lg:col-span-3">
            <div className="space-y-4">
              <div className="border-b border-border pb-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
                  {t('perspectiveSelector')}
                </span>
                <p className="mt-1 text-caption text-foreground-muted">
                  {t('perspectiveHint')}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 lg:grid-cols-2">
                {slides.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveSlideIndex(idx)}
                    className={cn(
                      'relative aspect-square overflow-hidden border transition-all',
                      idx === safeSlideIndex
                        ? 'border-foreground ring-1 ring-foreground'
                        : 'border-border opacity-65 hover:opacity-100'
                    )}
                  >
                    <img
                      src={s.url}
                      alt={s.alt}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-subtle">
                {t('activeFinish', { color: selectedColor.name })}
              </span>
              <ColorSwatchGroup
                colors={product.colors}
                selectedColorId={selectedColor.id}
                onSelect={handleSelectColor}
                size="sm"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* INTENTIONAL STICKY MOBILE PURCHASE BAR (Appears when primary CTA scrolls out of view) */}
      <AnimatePresence>
        {showStickyMobileBar && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { y: '100%' }}
            animate={prefersReducedMotion ? { opacity: 1 } : { y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { y: '100%' }}
            transition={{
              duration: prefersReducedMotion
                ? 0.05
                : NOIRE_MOTION_TOKENS.duration.fast,
              ease: NOIRE_MOTION_TOKENS.easing.outExpo,
            }}
            role="region"
            aria-label={t('quickBarAria')}
            className="fixed bottom-0 start-0 end-0 z-header border-t border-border bg-background/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-elevated backdrop-blur-md lg:hidden"
          >
            <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full border border-border"
                    style={{ backgroundColor: selectedColor.hex }}
                  />
                  <p className="truncate font-display text-sm font-medium text-foreground">
                    {product.name}
                  </p>
                </div>
                <div className="flex items-baseline gap-2">
                  <PriceDisplay price={activeUnitPrice * quantity} size="sm" />
                  <span className="truncate font-mono text-[10px] uppercase text-foreground-muted">
                    · {selectedColor.name}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isUnavailable}
                isLoading={isAdding}
                onClick={handlePurchaseAction}
                className="shrink-0"
              >
                {isUnavailable
                  ? t('quickUnavailable')
                  : justAdded
                  ? t('quickAdded')
                  : product.stockStatus === 'pre_order'
                  ? t('quickReserve')
                  : t('quickAdd')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
