'use client';

import React, { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { NOIRE_MOTION_TOKENS } from '@/lib/design-system/tokens';
import { Container } from '@/components/layout';
import {
  Badge,
  ProductBadge,
  PriceDisplay,
  TechnicalCode,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Category, Collection, Product } from '@/types';

export type MegaMenuType = 'shop' | 'collections' | null;

export interface MegaMenuProps {
  activeMenu: MegaMenuType;
  onClose: () => void;
  categories: Category[];
  collections: Collection[];
  spotlightProduct: Product | null;
}

export function MegaMenu({
  activeMenu,
  onClose,
  categories,
  collections,
  spotlightProduct,
}: MegaMenuProps) {
  const t = useTranslations('megaMenu');
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [hoveredCategory, setHoveredCategory] = useState<Category>(
    categories[0]
  );

  const activeCategory = hoveredCategory ?? categories[0];
  const [activeMenuItemIndex, setActiveMenuItemIndex] = useState(0);

  useEffect(() => {
    setActiveMenuItemIndex(0);
  }, [activeMenu]);

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]')
    );
    if (items.length === 0) return;

    if (event.key === ' ') {
      const focusedItem = document.activeElement;
      if (focusedItem instanceof HTMLElement && items.includes(focusedItem)) {
        event.preventDefault();
        focusedItem.click();
      }
      return;
    }

    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    let nextIndex: number | null = null;
    if (event.key === 'ArrowDown') {
      nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
    } else if (event.key === 'ArrowUp') {
      nextIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = items.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      setActiveMenuItemIndex(nextIndex);
      items[nextIndex]?.focus();
    }
  };

  return (
    <AnimatePresence>
      {activeMenu && (
        <>
          {/* Subtle dim backdrop below header */}
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
            className="fixed inset-0 top-16 z-mega bg-black/40 backdrop-blur-[1px] lg:top-20"
            aria-hidden="true"
          />

          {/* Mega Menu Architectural Panel */}
          <motion.div
            role="region"
            data-mega-menu-panel="true"
            aria-label={
              activeMenu === 'shop' ? t('shopPanelAria') : t('collectionsPanelAria')
            }
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -8 }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -6 }
            }
            transition={{
              duration: prefersReducedMotion
                ? 0.05
                : NOIRE_MOTION_TOKENS.duration.normal,
              ease: NOIRE_MOTION_TOKENS.easing.outExpo,
            }}
            onMouseLeave={onClose}
            className="absolute start-0 end-0 top-full z-mega border-b border-border bg-background text-foreground shadow-elevated"
          >
            <Container className="py-8 lg:py-10">
              {activeMenu === 'shop' && (
                <div className="grid grid-cols-12 gap-8 lg:gap-10">
                  {/* Column 1–4: Interactive Department Directory */}
                  <div className="col-span-4 flex flex-col justify-between border-e border-border pe-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-border pb-3">
                        <TechnicalCode>
                          {t('departmentsCode')}
                        </TechnicalCode>
                        <TechnicalCode>[06]</TechnicalCode>
                      </div>

                      <ul
                        className="divide-y divide-border/60"
                        role="menu"
                        aria-label={t('shopByDepartment')}
                        onKeyDown={handleMenuKeyDown}
                      >
                        {categories.map((cat, index) => {
                          const isCurrent = cat.id === activeCategory?.id;
                          return (
                            <li key={cat.id} role="none">
                              <Link
                                role="menuitem"
                                tabIndex={activeMenuItemIndex === index ? 0 : -1}
                                href={`/shop?category=${cat.slug}`}
                                onMouseEnter={() => setHoveredCategory(cat)}
                                onFocus={() => {
                                  setHoveredCategory(cat);
                                  setActiveMenuItemIndex(index);
                                }}
                                onClick={onClose}
                                className={cn(
                                  'group flex items-center justify-between py-3 transition-colors',
                                  isCurrent
                                    ? 'text-foreground'
                                    : 'text-foreground-muted hover:text-foreground'
                                )}
                              >
                                <div className="flex items-baseline gap-3.5">
                                  <span
                                    className={cn(
                                      'font-mono text-[11px] transition-colors',
                                      isCurrent
                                        ? 'text-accent font-medium'
                                        : 'text-foreground-subtle'
                                    )}
                                  >
                                    {cat.indexNumber}
                                  </span>
                                  <span className="font-display text-base font-medium tracking-tight">
                                    {cat.name}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[11px] text-foreground-subtle">
                                    [{cat.productCount}]
                                  </span>
                                  <ArrowRight
                                    className={cn(
                                      'h-3.5 w-3.5 transition-all duration-250 ease-noire-out',
                                      isCurrent
                                        ? 'translate-x-0 opacity-100 text-accent'
                                        : '-translate-x-1 opacity-0 rtl:translate-x-1'
                                    )}
                                  />
                                </div>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {/* Bottom Quick Index Filters */}
                    <div className="mt-6 space-y-3 border-t border-border pt-5">
                      <TechnicalCode>{t('curationIndex')}</TechnicalCode>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: t('completeArchive'), href: '/shop' },
                          {
                            label: t('newReleases'),
                            href: '/shop?sort=newest',
                          },
                          {
                            label: t('edition04'),
                            href: '/shop?collection=edition-04-monolith',
                          },
                        ].map((link) => (
                          <Link
                            key={link.label}
                            href={link.href}
                            onClick={onClose}
                            className="border border-border bg-surface px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Column 5–8: Live Department Visual Preview */}
                  <div className="col-span-4 flex flex-col justify-between border-e border-border pe-8">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <TechnicalCode>
                        {t('departmentCode', { index: activeCategory?.indexNumber ?? '01' })}
                      </TechnicalCode>
                      <Badge variant="default">
                        {t('instrumentsCount', { count: activeCategory?.productCount ?? 0 })}
                      </Badge>
                    </div>

                    <AnimatePresence mode="wait">
                      {activeCategory && (
                        <motion.div
                          key={activeCategory.id}
                          initial={
                            prefersReducedMotion
                              ? { opacity: 1 }
                              : { opacity: 0, y: 6 }
                          }
                          animate={{ opacity: 1, y: 0 }}
                          exit={
                            prefersReducedMotion
                              ? { opacity: 1 }
                              : { opacity: 0, y: -4 }
                          }
                          transition={{
                            duration: prefersReducedMotion ? 0 : 0.22,
                            ease: NOIRE_MOTION_TOKENS.easing.outExpo,
                          }}
                          className="mt-4 flex flex-1 flex-col justify-between space-y-4"
                        >
                          <Link
                            href={`/shop?category=${activeCategory.slug}`}
                            onClick={onClose}
                            className="group relative block aspect-[16/10] w-full overflow-hidden border border-border bg-surface-muted"
                          >
                            <img
                              src={activeCategory.heroImage}
                              alt={activeCategory.name}
                              className="h-full w-full object-cover transition-transform duration-600 ease-noire-out group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-3 start-3.5 end-3.5 flex items-end justify-between text-white">
                              <div>
                                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/75">
                                  {activeCategory.indexNumber} {'//'}{' '}
                                  {activeCategory.shortName}
                                </span>
                                <p className="font-display text-lg font-medium">
                                  {activeCategory.name}
                                </p>
                              </div>
                              <ArrowUpRight className="h-4 w-4 shrink-0" />
                            </div>
                          </Link>

                          <div className="space-y-2">
                            <p className="font-display text-sm font-medium text-foreground">
                              “{activeCategory.editorialStatement}”
                            </p>
                            <p className="text-caption text-foreground-muted">
                              {activeCategory.description}
                            </p>
                          </div>

                          <div className="pt-1">
                            <Link
                              href={`/shop?category=${activeCategory.slug}`}
                              onClick={onClose}
                              className="inline-flex items-center gap-2 border-b border-foreground pb-1 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground transition-colors hover:border-accent hover:text-accent"
                            >
                              <span>
                                {t('exploreArchive', { name: activeCategory.shortName })}
                              </span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Column 9–12: Flagship Spotlight Instrument */}
                  {spotlightProduct && (
                  <div className="col-span-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <TechnicalCode>
                        {t('flagshipSpotlight')}
                      </TechnicalCode>
                      <ProductBadge
                        type={spotlightProduct.badge}
                        label={spotlightProduct.badgeLabel}
                      />
                    </div>

                    <div className="mt-4 flex flex-1 flex-col justify-between border border-border bg-surface p-5">
                      <div className="space-y-4">
                        <Link
                          href={`/product/${spotlightProduct.slug}`}
                          onClick={onClose}
                          className="group relative block aspect-[16/9] overflow-hidden border border-border bg-surface-muted"
                        >
                          <img
                            src={spotlightProduct.primaryImage}
                            alt={spotlightProduct.name}
                            className="h-full w-full object-cover transition-transform duration-600 ease-noire-out group-hover:scale-105"
                          />
                        </Link>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <TechnicalCode>
                              {spotlightProduct.modelNumber}
                            </TechnicalCode>
                            <PriceDisplay
                              price={spotlightProduct.price}
                              compareAtPrice={spotlightProduct.compareAtPrice}
                              size="sm"
                            />
                          </div>
                          <Link
                            href={`/product/${spotlightProduct.slug}`}
                            onClick={onClose}
                            className="block font-display text-lg font-medium text-foreground hover:text-accent"
                          >
                            {spotlightProduct.name}
                          </Link>
                          <p className="line-clamp-2 text-caption text-foreground-muted">
                            {spotlightProduct.shortDescription}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-border pt-3.5">
                        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
                          Designed in {spotlightProduct.designedIn}
                        </span>
                        <Link
                          href={`/product/${spotlightProduct.slug}`}
                          onClick={onClose}
                          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-foreground hover:text-accent"
                        >
                          <span>{t('inspectInstrument')}</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                  )}
                </div>
              )}

              {activeMenu === 'collections' && (
                <div className="grid grid-cols-12 gap-8 lg:gap-10">
                  {/* Column 1–4: Editorial Introduction */}
                  <div className="col-span-4 flex flex-col justify-between border-e border-border pe-8">
                    <div className="space-y-4">
                      <TechnicalCode>
                        {t('curatedEditionsCode')}
                      </TechnicalCode>
                      <h3 className="font-display text-h3 tracking-tight text-foreground">
                        {t('editionsTitle')}
                      </h3>
                      <p className="text-small text-foreground-muted">
                        {t('editionsBody')}
                      </p>
                    </div>

                    <div className="space-y-4 border-t border-border pt-5">
                      <div className="flex items-center justify-between font-mono text-[11px] text-foreground-subtle">
                        <span>{t('currentAllocation')}</span>
                        <span className="text-foreground">
                          {t('currentSeason')}
                        </span>
                      </div>
                      <Link
                        href="/shop"
                        onClick={onClose}
                        className="inline-flex items-center gap-2 border border-foreground bg-foreground px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-background transition-opacity hover:opacity-90"
                      >
                        <span>{t('viewAllEditions')}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Column 5–12: 4 Visual Collection Plates */}
                  <div
                    className="col-span-8 grid grid-cols-2 gap-5"
                    role="menu"
                    aria-label={t('collectionsListAria')}
                    onKeyDown={handleMenuKeyDown}
                  >
                    {collections.map((col, index) => (
                      <Link
                        key={col.id}
                        role="menuitem"
                        tabIndex={activeMenuItemIndex === index ? 0 : -1}
                        href={`/shop?collection=${col.slug}`}
                        onFocus={() => setActiveMenuItemIndex(index)}
                        onClick={onClose}
                        className="group flex gap-4 border border-border bg-surface p-4 transition-colors hover:border-foreground"
                      >
                        <div className="relative h-28 w-28 shrink-0 overflow-hidden border border-border bg-surface-muted">
                          <img
                            src={col.heroImage}
                            alt={col.title}
                            className="h-full w-full object-cover transition-transform duration-600 ease-noire-out group-hover:scale-105"
                          />
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-accent">
                                {col.code}
                              </span>
                              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-foreground-subtle transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
                            </div>
                            <h4 className="font-display text-base font-medium text-foreground">
                              {col.title}
                            </h4>
                            <p className="line-clamp-2 text-caption text-foreground-muted">
                              {col.subtitle}
                            </p>
                          </div>

                          <div className="flex items-center justify-between border-t border-border/70 pt-2 font-mono text-[10px] text-foreground-subtle">
                            <span>{col.season}</span>
                            <span>{t('models', { count: col.productIds.length })}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </Container>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
