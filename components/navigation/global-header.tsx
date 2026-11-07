'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from '@/i18n/navigation';
import { usePathname } from '@/i18n/navigation';
import {
  Search,
  User,
  Heart,
  ShoppingBag,
  Menu,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Container } from '@/components/layout';
import { LanguageSwitcher } from './language-switcher';
import {
  Button,
  Drawer,
  PriceDisplay,
  QuantitySelector,
  EmptyState,
  TechnicalCode,
} from '@/components/ui';
import { useCommerce } from '@/lib/context/commerce-context';
import { MegaMenu, type MegaMenuType } from './mega-menu';
import { MobileNavDrawer } from './mobile-nav-drawer';
import { SearchOverlay } from '@/components/search';
import { cn, formatPrice } from '@/lib/utils';
import type { Category, Collection, Product } from '@/types';

export interface GlobalHeaderProps {
  categories: Category[];
  collections: Collection[];
  featuredProducts: Product[];
  spotlightProduct: Product | null;
  /**
   * When true, the header starts in transparent mode (Warm Ivory over dark cinema hero)
   * and transitions smoothly to solid Alabaster/Surface upon scrolling or Mega Menu activation.
   */
  allowTransparentTop?: boolean;
}

export function GlobalHeader({
  categories,
  collections,
  featuredProducts,
  spotlightProduct,
  allowTransparentTop = true,
}: GlobalHeaderProps) {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const tBag = useTranslations('bag');
  const {
    cart,
    cartCount,
    cartSubtotal,
    discountAmount,
    appliedDiscount,
    shippingEstimateCost,
    cartTotal,
    freeShippingProgress,
    amountUntilFreeShipping,
    removeFromCart,
    updateCartQuantity,
    moveToWishlist,
    wishlistCount,
    isSearchOpen,
    setIsSearchOpen,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
  } = useCommerce();

  const [isScrolled, setIsScrolled] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<MegaMenuType>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const activeMegaMenuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const focusFirstMegaMenuItemRef = useRef(false);

  // Monitor scroll position for transparent -> solid header transition
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close Mega Menu on Escape key or route change
  useEffect(() => {
    setActiveMegaMenu(null);
    setIsMobileMenuOpen(false);
    activeMegaMenuTriggerRef.current = null;
    focusFirstMegaMenuItemRef.current = false;
  }, [pathname]);

  useEffect(() => {
    if (!activeMegaMenu) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const focusWasInMenu =
          document.activeElement instanceof HTMLElement &&
          Boolean(document.activeElement.closest('[data-mega-menu-panel="true"]'));
        const trigger = activeMegaMenuTriggerRef.current;
        setActiveMegaMenu(null);
        if (focusWasInMenu && trigger) {
          window.requestAnimationFrame(() => trigger.focus({ preventScroll: true }));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMegaMenu]);

  useEffect(() => {
    if (!activeMegaMenu || !focusFirstMegaMenuItemRef.current) return;
    focusFirstMegaMenuItemRef.current = false;
    const frame = window.requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(
          '[data-mega-menu-panel="true"] [role="menuitem"]'
        )
        ?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeMegaMenu]);

  const closeMegaMenu = useCallback(() => setActiveMegaMenu(null), []);

  // Transparent mode is active only when at top of page, allowed by page, and no overlay is open
  const isTransparent =
    allowTransparentTop &&
    !isScrolled &&
    activeMegaMenu === null &&
    !isMobileMenuOpen &&
    !isSearchOpen;

  const handleMegaTriggerKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    menu: 'shop' | 'collections'
  ) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      activeMegaMenuTriggerRef.current = event.currentTarget;
      if (activeMegaMenu === menu) {
        window.requestAnimationFrame(() => {
          document
            .querySelector<HTMLElement>(
              '[data-mega-menu-panel="true"] [role="menuitem"]'
            )
            ?.focus({ preventScroll: true });
        });
      } else {
        focusFirstMegaMenuItemRef.current = true;
        setActiveMegaMenu(menu);
      }
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activeMegaMenuTriggerRef.current = event.currentTarget;
      focusFirstMegaMenuItemRef.current = false;
      setActiveMegaMenu((previous) => (previous === menu ? null : menu));
    }
  };

  const handleMegaTriggerClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    menu: 'shop' | 'collections'
  ) => {
    activeMegaMenuTriggerRef.current = event.currentTarget;
    focusFirstMegaMenuItemRef.current = false;
    setActiveMegaMenu((previous) => (previous === menu ? null : menu));
  };

  return (
    <>
      <header
        style={{ top: 'var(--announcement-h, 0px)' }}
        className={cn(
          'fixed start-0 end-0 top-0 z-header transition-all duration-400 ease-noire-out',
          isTransparent
            ? 'surface-obsidian border-b border-white/15 bg-transparent text-foreground'
            : 'border-b border-border bg-background/95 text-foreground backdrop-blur-md shadow-architectural'
        )}
      >
        <Container className="flex h-16 items-center justify-between gap-2 sm:gap-4 lg:h-20">
          {/* 1. Left: Mobile Menu Trigger + Desktop Primary Navigation */}
          <div className="flex items-center gap-3 sm:gap-6 lg:gap-9">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label={t('openMenu')}
              aria-expanded={isMobileMenuOpen}
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xs border transition-colors lg:hidden',
                isTransparent
                  ? 'border-white/20 text-foreground hover:bg-white/10'
                  : 'border-border text-foreground hover:border-foreground'
              )}
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>

            {/* Brand Wordmark */}
            <Link
              href="/"
              onClick={closeMegaMenu}
              className="group flex items-baseline gap-2.5 focus:outline-none"
            >
              <span className="font-display text-base font-semibold tracking-[0.24em] sm:text-xl sm:tracking-[0.26em]">
                NOIRÉ
              </span>
              <span
                className={cn(
                  'hidden font-mono text-[9px] uppercase tracking-[0.14em] transition-colors xl:inline-block',
                  isTransparent ? 'text-white/55' : 'text-foreground-subtle'
                )}
              >
                ZURICH · TOKYO
              </span>
            </Link>

            {/* Desktop Primary Navigation Links */}
            <nav
              aria-label={t('primaryNavigation')}
              className="hidden items-center gap-7 lg:flex xl:gap-8"
            >
              {/* Shop (Mega Menu Trigger) */}
              <div
                onMouseEnter={(event) => {
                  activeMegaMenuTriggerRef.current =
                    event.currentTarget.querySelector('button');
                  setActiveMegaMenu('shop');
                }}
                className="relative py-2"
              >
                <button
                  type="button"
                  aria-expanded={activeMegaMenu === 'shop'}
                  aria-haspopup="true"
                  onClick={(event) => handleMegaTriggerClick(event, 'shop')}
                  onKeyDown={(e) => handleMegaTriggerKeyDown(e, 'shop')}
                  className={cn(
                    'noire-link inline-flex items-center gap-1.5 font-sans text-nav uppercase transition-colors',
                    pathname.startsWith('/shop') || activeMegaMenu === 'shop'
                      ? 'text-foreground'
                      : 'text-foreground-muted hover:text-foreground'
                  )}
                >
                  <span>{t('shop')}</span>
                  <ChevronDown
                    className={cn(
                      'h-3 w-3 transition-transform duration-250 ease-noire-out',
                      activeMegaMenu === 'shop' && 'rotate-180'
                    )}
                    aria-hidden="true"
                  />
                </button>
              </div>

              {/* Collections (Mega Menu Trigger) */}
              <div
                onMouseEnter={(event) => {
                  activeMegaMenuTriggerRef.current =
                    event.currentTarget.querySelector('button');
                  setActiveMegaMenu('collections');
                }}
                className="relative py-2"
              >
                <button
                  type="button"
                  aria-expanded={activeMegaMenu === 'collections'}
                  aria-haspopup="true"
                  onClick={(event) =>
                    handleMegaTriggerClick(event, 'collections')
                  }
                  onKeyDown={(e) =>
                    handleMegaTriggerKeyDown(e, 'collections')
                  }
                  className={cn(
                    'noire-link inline-flex items-center gap-1.5 font-sans text-nav uppercase transition-colors',
                    pathname.startsWith('/collections') ||
                      activeMegaMenu === 'collections'
                      ? 'text-foreground'
                      : 'text-foreground-muted hover:text-foreground'
                  )}
                >
                  <span>{t('collections')}</span>
                  <ChevronDown
                    className={cn(
                      'h-3 w-3 transition-transform duration-250 ease-noire-out',
                      activeMegaMenu === 'collections' && 'rotate-180'
                    )}
                    aria-hidden="true"
                  />
                </button>
              </div>


            </nav>
          </div>

          {/* 2. Right: Search, Account, Wishlist, Bag */}
          <div
            onMouseEnter={closeMegaMenu}
            className="flex shrink-0 items-center gap-1.5 sm:gap-3 lg:gap-5"
          >
            {/* Search Trigger */}
            <button
              type="button"
              onClick={() => {
                closeMegaMenu();
                setIsSearchOpen(true);
              }}
              aria-label={t('openSearch')}
              className={cn(
                'group inline-flex h-10 items-center gap-2.5 rounded-xs border px-2.5 transition-colors sm:px-3.5',
                isTransparent
                  ? 'border-white/20 bg-white/5 text-foreground hover:border-white/45 hover:bg-white/10'
                  : 'border-border bg-surface text-foreground hover:border-foreground'
              )}
            >
              <Search className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden font-sans text-nav uppercase sm:inline-block">
                {t('search')}
              </span>
              <kbd
                className={cn(
                  'hidden border px-1.5 py-0.5 font-mono text-[9px] lg:inline-block',
                  isTransparent
                    ? 'border-white/20 text-white/70'
                    : 'border-border bg-surface-muted text-foreground-subtle'
                )}
              >
                ⌘K
              </kbd>
            </button>

            {/* Language Switcher */}
            <LanguageSwitcher transparent={isTransparent} />

            {/* Account Link */}
            <Link
              href="/account"
              aria-label={t('account')}
              className="hidden h-10 items-center gap-1.5 px-2 font-sans text-nav uppercase text-foreground-muted transition-colors hover:text-foreground md:inline-flex"
            >
              <User className="h-4 w-4" aria-hidden="true" />
              <span className="hidden xl:inline">{t('account')}</span>
            </Link>

            {/* Wishlist Link */}
            <Link
              href="/wishlist"
              aria-label={t('wishlistAria', { count: wishlistCount })}
              className="inline-flex h-10 items-center gap-1 px-1.5 font-sans text-nav uppercase text-foreground-muted transition-colors hover:text-foreground sm:gap-1.5 sm:px-2"
            >
              <Heart className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden xl:inline">{t('wishlist')}</span>
              <span className="hidden font-mono text-[11px] tabular-nums text-foreground-subtle sm:inline">
                [{String(wishlistCount).padStart(2, '0')}]
              </span>
            </Link>

            {/* Bag Trigger */}
            <button
              type="button"
              onClick={() => {
                closeMegaMenu();
                setIsCartDrawerOpen(true);
              }}
              aria-label={tBag('openAria', { count: cartCount })}
              className={cn(
                'inline-flex h-10 items-center gap-1.5 rounded-xs border px-2.5 font-sans text-nav uppercase transition-colors sm:gap-2 sm:px-4',
                isTransparent
                  ? 'border-white/30 bg-white/10 text-foreground hover:bg-white hover:text-[#111110]'
                  : cartCount > 0
                  ? 'border-foreground bg-foreground text-background hover:opacity-90'
                  : 'border-border-strong/70 bg-transparent text-foreground hover:bg-foreground hover:text-background'
              )}
            >
              <ShoppingBag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">{t('bag')}</span>
              <span className="font-mono text-[11px] tabular-nums">
                [{String(cartCount).padStart(2, '0')}]
              </span>
            </button>
          </div>
        </Container>

        {/* Visual Mega Menu (Desktop) */}
        <div className="hidden lg:block">
          <MegaMenu
            activeMenu={activeMegaMenu}
            onClose={closeMegaMenu}
            categories={categories}
            collections={collections}
            spotlightProduct={spotlightProduct}
          />
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        categories={categories}
        collections={collections}
      />

      {/* Full-Screen / Large Search Experience */}
      <SearchOverlay
        initialCategories={categories}
        initialFeaturedProducts={featuredProducts}
      />

      {/* Global Allocation Bag Drawer */}
      <Drawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        subtitle={tBag('drawerSubtitle', { count: cartCount })}
        title={tBag('drawerTitle')}
        footer={
          cart.length > 0 ? (
            <div className="space-y-4">
              {/* Free Shipping Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em]">
                  <span className="text-foreground-muted">
                    {amountUntilFreeShipping === 0
                      ? tBag('thresholdMet')
                      : tBag('thresholdAway', { amount: formatPrice(amountUntilFreeShipping) })}
                  </span>
                  <span className="tabular-nums text-foreground">
                    {freeShippingProgress}%
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden bg-surface-muted">
                  <div
                    className="h-full bg-foreground transition-all duration-400 ease-noire-out"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 border-t border-border pt-3">
                <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.12em]">
                  <span className="text-foreground-muted">{tBag('subtotal')}</span>
                  <span className="tabular-nums text-foreground">
                    {formatPrice(cartSubtotal)}
                  </span>
                </div>

                {appliedDiscount && discountAmount > 0 && (
                  <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.12em] text-accent">
                    <span>{tBag('privilege', { code: appliedDiscount.code })}</span>
                    <span className="tabular-nums">
                      -{formatPrice(discountAmount)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.12em]">
                  <span className="text-foreground-muted">{tBag('courierEstimate')}</span>
                  <span className="tabular-nums text-foreground">
                    {shippingEstimateCost === 0
                      ? tBag('complimentary')
                      : formatPrice(shippingEstimateCost)}
                  </span>
                </div>

                <div className="flex items-baseline justify-between border-t border-border pt-2.5">
                  <span className="font-mono text-xs uppercase tracking-[0.12em] text-foreground">
                    {tBag('estimatedTotal')}
                  </span>
                  <PriceDisplay price={cartTotal} size="lg" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <Link
                  href="/cart"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="flex h-11 items-center justify-center border border-border bg-surface font-mono text-xs uppercase tracking-[0.12em] text-foreground transition-colors hover:border-foreground"
                >
                  {tBag('openDossier')}
                </Link>
                <Link
                  href="/checkout"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="flex h-11 items-center justify-center border border-foreground bg-foreground font-mono text-xs uppercase tracking-[0.12em] text-background transition-opacity hover:opacity-90"
                >
                  {tBag('proceedToCheckout')}
                </Link>
              </div>
            </div>
          ) : undefined
        }
      >
        {cart.length === 0 ? (
          <EmptyState
            code={tBag('emptyCode')}
            title={tBag('emptyTitle')}
            description={tBag('emptyDescription')}
            primaryAction={
              <Link
                href="/shop"
                onClick={() => setIsCartDrawerOpen(false)}
                className="inline-flex h-10 items-center justify-center border border-foreground bg-foreground px-5 font-mono text-xs uppercase tracking-[0.12em] text-background transition-opacity hover:opacity-90"
              >
                {tBag('exploreArchive')}
              </Link>
            }
            secondaryAction={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsCartDrawerOpen(false);
                  setIsSearchOpen(true);
                }}
              >
                {tBag('searchCatalog')}
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {cart.map((item, idx) => (
              <div key={item.id} className="flex gap-4 py-4 first:pt-0">
                <Link
                  href={`/product/${item.slug}`}
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="group relative h-24 w-20 shrink-0 overflow-hidden border border-border bg-surface-muted"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-500 ease-noire-out group-hover:scale-105"
                  />
                  <span className="absolute start-1 top-1 bg-background/90 px-1 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-foreground-muted">
                    0{idx + 1}
                  </span>
                </Link>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <TechnicalCode>{item.modelNumber}</TechnicalCode>
                      <Link
                        href={`/product/${item.slug}`}
                        onClick={() => setIsCartDrawerOpen(false)}
                        className="block truncate font-display text-sm font-medium text-foreground transition-colors hover:text-accent"
                      >
                        {item.name}
                      </Link>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      aria-label={tBag('removeAria', { name: item.name })}
                      className="text-foreground-subtle transition-colors hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-caption text-foreground-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-border-strong/40"
                        style={{ backgroundColor: item.selectedColor.hex }}
                        aria-hidden="true"
                      />
                      <span>{item.selectedColor.name}</span>
                    </span>
                    {item.selectedOption && (
                      <>
                        <span className="text-border-strong">·</span>
                        <span>{item.selectedOption.label}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3">
                      <QuantitySelector
                        size="sm"
                        value={item.quantity}
                        max={item.maxQuantity}
                        onChange={(q) => updateCartQuantity(item.id, q)}
                      />
                      <button
                        type="button"
                        onClick={() => moveToWishlist(item.id)}
                        className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle underline-offset-4 transition-colors hover:text-foreground hover:underline"
                      >
                        {tBag('saveForLater')}
                      </button>
                    </div>
                    <div className="text-end">
                      <PriceDisplay
                        price={item.price * item.quantity}
                        compareAtPrice={
                          item.compareAtPrice
                            ? item.compareAtPrice * item.quantity
                            : undefined
                        }
                        size="sm"
                      />
                      {item.quantity > 1 && (
                        <p className="font-mono text-[10px] tabular-nums text-foreground-subtle">
                          {formatPrice(item.price)} / ea
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </>
  );
}
