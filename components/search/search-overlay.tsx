'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Search,
  X,
  ArrowUpRight,
  ArrowRight,
  Clock,
  TrendingUp,
  CornerDownLeft,
  ShoppingBag,
  Heart,
  Sparkles,
} from 'lucide-react';
import { NOIRE_MOTION_TOKENS } from '@/lib/design-system/tokens';
import { useOverlayBehavior, useDebounce } from '@/lib/hooks';
import { searchCatalogAction } from '@/lib/actions/commerce';
import { useCommerce } from '@/lib/context/commerce-context';
import { Container } from '@/components/layout';
import {
  Button,
  Badge,
  ProductBadge,
  PriceDisplay,
  Skeleton,
  EmptyState,
  TechnicalCode,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import type {
  Product,
  Category,
  SearchSuggestionResult,
} from '@/types';

const RECENT_SEARCHES_KEY = 'noire_recent_searches_v1';

const DEFAULT_RECENT_SEARCHES = [
  'Aether 01 Planar',
  'Solis CRI 98+',
  'Kinetic-65 Brass',
];

const TRENDING_SEARCHES = [
  { label: 'NR-01 // Aether', query: 'Aether' },
  { label: 'Planar Magnetic', query: 'Planar' },
  { label: '6061-T6 Billet Speaker', query: 'Monolith' },
  { label: 'Cantilever Luminaire', query: 'Solis' },
  { label: 'Gasket Mechanical', query: 'Kinetic' },
  { label: 'Titanium IEM', query: 'Resonance' },
  { label: 'Solid-State 140W', query: 'Nomad' },
];

export interface SearchOverlayProps {
  initialCategories: Category[];
  initialFeaturedProducts: Product[];
}

export function SearchOverlay({
  initialCategories,
  initialFeaturedProducts,
}: SearchOverlayProps) {
  const t = useTranslations('search');
  const {
    isSearchOpen,
    setIsSearchOpen,
    addToCart,
    toggleWishlist,
    isInWishlist,
  } = useCommerce();

  const router = useRouter();
  const prefersReducedMotion = Boolean(useReducedMotion());
  const onClose = useCallback(() => setIsSearchOpen(false), [setIsSearchOpen]);
  const containerRef = useOverlayBehavior<HTMLDivElement>({
    isOpen: isSearchOpen,
    onClose,
  });

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 200);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchSuggestionResult | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(
    DEFAULT_RECENT_SEARCHES
  );
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  // Hydrate recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setRecentSearches(parsed);
      }
    } catch {
      // Ignore storage access issues
    }
  }, []);

  // Global Cmd+K / Ctrl+K keyboard shortcut to open search
  useEffect(() => {
    const handleGlobalShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      }
    };
    window.addEventListener('keydown', handleGlobalShortcut);
    return () => window.removeEventListener('keydown', handleGlobalShortcut);
  }, [isSearchOpen, setIsSearchOpen]);

  // Save a search term to recent history
  const saveRecentSearch = useCallback((term: string) => {
    const cleaned = term.trim();
    if (!cleaned) return;
    setRecentSearches((prev) => {
      const next = [
        cleaned,
        ...prev.filter((item) => item.toLowerCase() !== cleaned.toLowerCase()),
      ].slice(0, 5);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const removeRecentSearch = (term: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((item) => item !== term);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([]));
    } catch {
      // Ignore
    }
  };

  // Execute search when debouncedQuery changes
  useEffect(() => {
    if (!isSearchOpen) return;

    const trimmed = debouncedQuery.trim();
    if (!trimmed) {
      setResults(null);
      setIsLoading(false);
      setActiveIndex(-1);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    searchCatalogAction(trimmed)
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setIsLoading(false);
          return;
        }
        const res = result.data;
        setResults(res);
        setIsLoading(false);
        setActiveIndex(res.products.length > 0 ? 0 : -1);
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, isSearchOpen]);

  // Keyboard navigation inside search input (ArrowDown / ArrowUp / Enter)
  const displayedProducts =
    query.trim().length > 0
      ? results?.products ?? []
      : initialFeaturedProducts;

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (displayedProducts.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % displayedProducts.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) =>
        prev <= 0 ? displayedProducts.length - 1 : prev - 1
      );
    } else if (event.key === 'Enter') {
      if (query.trim().length > 0) {
        saveRecentSearch(query);
      }
      if (activeIndex >= 0 && displayedProducts[activeIndex]) {
        event.preventDefault();
        const selected = displayedProducts[activeIndex];
        onClose();
        router.push(`/product/${selected.slug}`);
      }
    }
  };

  const applyQuickQuery = (term: string) => {
    setQuery(term);
    saveRecentSearch(term);
  };

  const hasActiveQuery = query.trim().length > 0;
  const noMatchesFound =
    hasActiveQuery && !isLoading && results && results.totalMatches === 0;

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <div className="fixed inset-0 z-modal flex flex-col">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: prefersReducedMotion
                ? 0
                : NOIRE_MOTION_TOKENS.duration.fast,
            }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Search Experience Surface */}
          <motion.div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('overlayLabel')}
            tabIndex={-1}
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -18 }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -12 }
            }
            transition={{
              duration: prefersReducedMotion
                ? 0.05
                : NOIRE_MOTION_TOKENS.duration.normal,
              ease: NOIRE_MOTION_TOKENS.easing.outExpo,
            }}
            className="relative z-10 flex max-h-[92vh] w-full flex-col border-b border-border bg-background text-foreground shadow-modal focus:outline-none"
          >
            {/* Top Search Command Bar */}
            <div className="border-b border-border bg-surface">
              <Container className="py-4 sm:py-6">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <TechnicalCode>{t('code')}</TechnicalCode>
                    {hasActiveQuery && !isLoading && results && (
                      <Badge variant="obsidian">
                        {t('matches', { count: results.totalMatches })}
                      </Badge>
                    )}
                  </div>
                  <div className="hidden items-center gap-4 font-mono text-[11px] text-foreground-subtle sm:flex">
                    <span className="inline-flex items-center gap-1">
                      <kbd className="border border-border bg-background px-1.5 py-0.5 text-[10px]">
                        ↑↓
                      </kbd>{' '}
                      {t('navigate')}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <kbd className="border border-border bg-background px-1.5 py-0.5 text-[10px]">
                        ESC
                      </kbd>{' '}
                      {t('dismiss')}
                    </span>
                  </div>
                </div>

                <div className="relative flex items-center gap-3">
                  <Search
                    className="h-5 w-5 shrink-0 text-foreground-muted sm:h-6 sm:w-6"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    aria-label={t('inputLabel')}
                    placeholder={t('placeholder')}
                    className="h-12 w-full bg-transparent font-display text-lg font-medium tracking-tight text-foreground placeholder:text-foreground-subtle/70 focus:outline-none sm:h-14 sm:text-2xl"
                  />

                  {query.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      aria-label={t('clear')}
                      className="shrink-0 rounded-xs border border-border bg-background px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-muted transition-colors hover:border-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onClose}
                    aria-label={t('close')}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xs border border-border bg-background text-foreground-muted transition-colors hover:border-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </Container>
            </div>

            {/* Scrollable Search Body */}
            <div className="flex-1 overflow-y-auto py-6 sm:py-10">
              <Container>
                {/* 1. LOADING STATE */}
                {isLoading && (
                  <div
                    role="status"
                    aria-live="polite"
                    aria-label={t('searching')}
                    className="grid grid-cols-1 gap-8 lg:grid-cols-12"
                  >
                    <div className="space-y-4 lg:col-span-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-5/6" />
                      <Skeleton className="h-10 w-4/6" />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-8">
                      {[1, 2, 3, 4].map((n) => (
                        <div
                          key={n}
                          className="flex gap-4 border border-border bg-surface p-4"
                        >
                          <Skeleton className="h-24 w-24 shrink-0" />
                          <div className="flex-1 space-y-2.5">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. NO RESULTS STATE */}
                {noMatchesFound && (
                  <div className="space-y-8">
                    <EmptyState
                      code={t('noResultsCode')}
                      title={t('noResultsTitle', { query })}
                      description={t('noResultsDescription')}
                      primaryAction={
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setQuery('')}
                        >
                          {t('reset')}
                        </Button>
                      }
                      secondaryAction={
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => applyQuickQuery('Titanium')}
                        >
                          {t('exploreTitanium')}
                        </Button>
                      }
                    />

                    {/* Suggested Category Recovery */}
                    <div className="space-y-3">
                      <TechnicalCode>
                        {t('suggestedCategories')}
                      </TechnicalCode>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {initialCategories.map((cat) => (
                          <Link
                            key={cat.id}
                            href={`/shop?category=${cat.slug}`}
                            onClick={onClose}
                            className="group flex items-center justify-between border border-border bg-surface p-4 transition-colors hover:border-foreground"
                          >
                            <div>
                              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
                                {cat.indexNumber} {'//'} {cat.shortName}
                              </span>
                              <p className="font-display text-sm font-medium text-foreground">
                                {cat.name}
                              </p>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-foreground-subtle transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. IDLE / DISCOVERY STATE (When input is empty) */}
                {!hasActiveQuery && !isLoading && (
                  <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
                    {/* Left Column: Recent Searches, Trending & Categories */}
                    <div className="space-y-8 lg:col-span-4">
                      {/* Recent Searches (with designed Empty State when cleared) */}
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-2 font-mono text-label uppercase text-foreground-subtle">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            {t('recent')}
                          </span>
                          {recentSearches.length > 0 && (
                            <button
                              type="button"
                              onClick={clearRecentSearches}
                              className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle transition-colors hover:text-foreground"
                            >
                              {t('clearAll')}
                            </button>
                          )}
                        </div>

                        {recentSearches.length === 0 ? (
                          <div className="border border-dashed border-border bg-surface/50 p-4">
                            <p className="font-mono text-[11px] text-foreground-subtle">
                              {t('noRecent')}
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y divide-border border border-border bg-surface">
                            {recentSearches.map((item) => (
                              <div
                                key={item}
                                className="flex items-center justify-between px-3.5 py-2.5 text-small transition-colors hover:bg-surface-muted/60"
                              >
                                <button
                                  type="button"
                                  onClick={() => applyQuickQuery(item)}
                                  className="flex flex-1 items-center gap-2.5 text-start text-foreground"
                                >
                                  <CornerDownLeft
                                    className="h-3 w-3 text-foreground-subtle"
                                    aria-hidden="true"
                                  />
                                  <span>{item}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeRecentSearch(item)}
                                  aria-label={t('removeRecent', { item })}
                                  className="p-1 text-foreground-subtle hover:text-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Trending Searches */}
                      <div className="space-y-3.5">
                        <span className="inline-flex items-center gap-2 font-mono text-label uppercase text-foreground-subtle">
                          <TrendingUp className="h-3 w-3" aria-hidden="true" />
                          {t('trending')}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {TRENDING_SEARCHES.map((item) => (
                            <button
                              key={item.label}
                              type="button"
                              onClick={() => applyQuickQuery(item.query)}
                              className="rounded-xs border border-border bg-surface px-3 py-1.5 font-mono text-[11px] text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Suggested Categories */}
                      <div className="space-y-3.5">
                        <span className="font-mono text-label uppercase text-foreground-subtle">
                          {t('departments')}
                        </span>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                          {initialCategories.map((cat) => (
                            <Link
                              key={cat.id}
                              href={`/shop?category=${cat.slug}`}
                              onClick={onClose}
                              className="group flex items-center justify-between border border-border bg-surface px-3.5 py-2.5 transition-colors hover:border-foreground"
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-[10px] text-accent">
                                  {cat.indexNumber}
                                </span>
                                <span className="font-display text-sm font-medium text-foreground">
                                  {cat.name}
                                </span>
                              </div>
                              <span className="font-mono text-[11px] text-foreground-subtle group-hover:text-foreground">
                                [{cat.productCount}]
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Curated Product Previews */}
                    <div className="space-y-4 lg:col-span-8">
                      <div className="flex items-center justify-between border-b border-border pb-3">
                        <span className="inline-flex items-center gap-2 font-mono text-label uppercase text-foreground-subtle">
                          <Sparkles className="h-3 w-3 text-accent" />
                          {t('featured')}
                        </span>
                        <Link
                          href="/shop"
                          onClick={onClose}
                          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-foreground hover:text-accent"
                        >
                          <span>{t('viewAll')}</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {initialFeaturedProducts.map((product, idx) => {
                          const isHighlighted = idx === activeIndex;
                          const saved = isInWishlist(product.id);

                          return (
                            <div
                              key={product.id}
                              className={cn(
                                'group relative flex flex-col justify-between border bg-surface p-4 transition-all duration-250',
                                isHighlighted
                                  ? 'border-foreground ring-1 ring-foreground'
                                  : 'border-border hover:border-foreground/60'
                              )}
                            >
                              <div className="flex gap-4">
                                <Link
                                  href={`/product/${product.slug}`}
                                  onClick={onClose}
                                  className="relative h-24 w-24 shrink-0 overflow-hidden border border-border bg-surface-muted"
                                >
                                  <img
                                    src={product.primaryImage}
                                    alt={product.name}
                                    className="h-full w-full object-cover transition-transform duration-500 ease-noire-out group-hover:scale-105"
                                  />
                                </Link>

                                <div className="min-w-0 flex-1 space-y-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <TechnicalCode>
                                      {product.modelNumber}
                                    </TechnicalCode>
                                    {product.badge && (
                                      <ProductBadge
                                        type={product.badge}
                                        className="px-1.5 py-0.5 text-[9px]"
                                      />
                                    )}
                                  </div>
                                  <Link
                                    href={`/product/${product.slug}`}
                                    onClick={onClose}
                                    className="block truncate font-display text-base font-medium text-foreground group-hover:text-accent"
                                  >
                                    {product.name}
                                  </Link>
                                  <p className="line-clamp-1 text-caption text-foreground-muted">
                                    {product.subtitle}
                                  </p>
                                  <div className="pt-1">
                                    <PriceDisplay
                                      price={product.price}
                                      compareAtPrice={product.compareAtPrice}
                                      size="sm"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                                <div className="flex items-center gap-1.5">
                                  {product.colors.map((c) => (
                                    <span
                                      key={c.id}
                                      title={c.name}
                                      className="h-3 w-3 rounded-full border border-black/20 dark:border-white/20"
                                      style={{ backgroundColor: c.hex }}
                                    />
                                  ))}
                                  <span className="ms-1 font-mono text-[10px] text-foreground-subtle">
                                    {t('finishes', { count: product.colors.length })}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleWishlist(product)}
                                    aria-label={
                                      saved
                                        ? t('removeFromWishlist', { name: product.name })
                                        : t('saveToWishlist', { name: product.name })
                                    }
                                    className={cn(
                                      'flex h-7 w-7 items-center justify-center border transition-colors',
                                      saved
                                        ? 'border-foreground bg-foreground text-background'
                                        : 'border-border text-foreground-muted hover:border-foreground hover:text-foreground'
                                    )}
                                  >
                                    <Heart
                                      className={cn(
                                        'h-3 w-3',
                                        saved && 'fill-current'
                                      )}
                                    />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      addToCart({ product, quantity: 1 })
                                    }
                                    className="inline-flex h-7 items-center gap-1.5 border border-foreground bg-foreground px-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-background transition-opacity hover:opacity-90"
                                  >
                                    <ShoppingBag className="h-3 w-3" />
                                    <span>{t('addToBag')}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. LIVE SEARCH RESULTS STATE */}
                {hasActiveQuery && !isLoading && results && results.totalMatches > 0 && (
                  <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
                    {/* Left Sidebar: Matched Categories, Collections & Journal */}
                    <div className="space-y-8 lg:col-span-4">
                      {results.categories.length > 0 && (
                        <div className="space-y-3">
                          <TechnicalCode>
                            {t('matchedCategories', { count: results.categories.length })}
                          </TechnicalCode>
                          <div className="space-y-2">
                            {results.categories.map((cat) => (
                              <Link
                                key={cat.id}
                                href={`/shop?category=${cat.slug}`}
                                onClick={() => {
                                  saveRecentSearch(query);
                                  onClose();
                                }}
                                className="flex items-center justify-between border border-border bg-surface p-3.5 transition-colors hover:border-foreground"
                              >
                                <div>
                                  <span className="font-mono text-[10px] text-accent">
                                    {cat.indexNumber} {'//'} {cat.shortName}
                                  </span>
                                  <p className="font-display text-sm font-medium text-foreground">
                                    {cat.name}
                                  </p>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-foreground-subtle" />
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {results.collections.length > 0 && (
                        <div className="space-y-3">
                          <TechnicalCode>
                            {t('matchedCollections', { count: results.collections.length })}
                          </TechnicalCode>
                          <div className="space-y-2">
                            {results.collections.map((col) => (
                              <Link
                                key={col.id}
                                href={`/shop?collection=${col.slug}`}
                                onClick={() => {
                                  saveRecentSearch(query);
                                  onClose();
                                }}
                                className="block border border-border bg-surface p-3.5 transition-colors hover:border-foreground"
                              >
                                <span className="font-mono text-[10px] text-accent">
                                  {col.code}
                                </span>
                                <p className="font-display text-sm font-medium text-foreground">
                                  {col.title}
                                </p>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {results.articles.length > 0 && (
                        <div className="space-y-3">
                          <TechnicalCode>
                            {t('matchedArticles', { count: results.articles.length })}
                          </TechnicalCode>
                          <div className="space-y-2">
                            {results.articles.map((art) => (
                              <Link
                                key={art.id}
                                href={`/journal/${art.slug}`}
                                onClick={() => {
                                  saveRecentSearch(query);
                                  onClose();
                                }}
                                className="block border border-border bg-surface p-3.5 transition-colors hover:border-foreground"
                              >
                                <span className="font-mono text-[10px] text-foreground-subtle">
                                  {art.issueNumber}
                                </span>
                                <p className="mt-1 font-display text-sm font-medium text-foreground">
                                  {art.title}
                                </p>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Matched Instruments */}
                    <div className="space-y-4 lg:col-span-8">
                      <div className="flex items-center justify-between border-b border-border pb-3">
                        <TechnicalCode>
                          {t('matchedProducts', { count: results.products.length })}
                        </TechnicalCode>
                        <Link
                          href={`/shop?query=${encodeURIComponent(query)}`}
                          onClick={() => {
                            saveRecentSearch(query);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-foreground hover:text-accent"
                        >
                          <span>{t('openInShop')}</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>

                      {results.products.length === 0 ? (
                        <p className="py-8 text-small text-foreground-muted">
                          {t('noProductsHint')}
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {results.products.map((product, idx) => {
                            const isHighlighted = idx === activeIndex;
                            return (
                              <div
                                key={product.id}
                                className={cn(
                                  'group flex flex-col justify-between border bg-surface p-4 transition-all',
                                  isHighlighted
                                    ? 'border-foreground ring-1 ring-foreground'
                                    : 'border-border hover:border-foreground/60'
                                )}
                              >
                                <div className="flex gap-4">
                                  <Link
                                    href={`/product/${product.slug}`}
                                    onClick={() => {
                                      saveRecentSearch(query);
                                      onClose();
                                    }}
                                    className="h-24 w-24 shrink-0 overflow-hidden border border-border bg-surface-muted"
                                  >
                                    <img
                                      src={product.primaryImage}
                                      alt={product.name}
                                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                  </Link>
                                  <div className="min-w-0 flex-1 space-y-1">
                                    <TechnicalCode>
                                      {product.modelNumber}
                                    </TechnicalCode>
                                    <Link
                                      href={`/product/${product.slug}`}
                                      onClick={() => {
                                        saveRecentSearch(query);
                                        onClose();
                                      }}
                                      className="block truncate font-display text-base font-medium text-foreground group-hover:text-accent"
                                    >
                                      {product.name}
                                    </Link>
                                    <p className="line-clamp-1 text-caption text-foreground-muted">
                                      {product.subtitle}
                                    </p>
                                    <PriceDisplay
                                      price={product.price}
                                      compareAtPrice={product.compareAtPrice}
                                      size="sm"
                                    />
                                  </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                                  <span className="font-mono text-[10px] uppercase text-foreground-subtle">
                                    {product.categoryName}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      addToCart({ product, quantity: 1 })
                                    }
                                    className="inline-flex h-7 items-center gap-1.5 border border-foreground bg-foreground px-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-background hover:opacity-90"
                                  >
                                    <ShoppingBag className="h-3 w-3" />
                                    <span>{t('addToBag')}</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Container>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
