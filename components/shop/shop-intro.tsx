'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  ChevronRight,
  RotateCcw,
  Layers,
  Check,
} from 'lucide-react';
import { Container } from '@/components/layout';
import { Eyebrow, TechnicalCode } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  isEssentialProduct,
  type ShopCategoryFilter,
} from './shop-filter-utils';
import type { Category, Collection, Product } from '@/types';

interface ShopIntroProps {
  categories: Category[];
  collections: Collection[];
  allProducts: Product[];
  activeCategory: ShopCategoryFilter;
  activeCollectionSlug: string;
  totalMatchingCount: number;
  onSelectCategory: (category: ShopCategoryFilter) => void;
  onSelectCollection: (collectionSlug: string) => void;
}

export function ShopIntro({
  categories,
  collections,
  allProducts,
  activeCategory,
  activeCollectionSlug,
  totalMatchingCount,
  onSelectCategory,
  onSelectCollection,
}: ShopIntroProps) {
  const t = useTranslations('shop.intro');
  const activeCategoryObj = categories.find((c) => c.slug === activeCategory);
  const activeCollectionObj = collections.find(
    (c) => c.slug === activeCollectionSlug || c.id === activeCollectionSlug
  );
  const flagshipCollection =
    collections.find((c) => c.id === 'col-monolith') || collections[0];

  const essentialsCount = allProducts.filter(
    (p) => p.status === 'active' && isEssentialProduct(p)
  ).length;

  // Dynamic heading and description based on active category or collection
  let eyebrowText = t('defaultEyebrow');
  let headingTitle = t('defaultTitle');
  let headingSubtitle = t('defaultSubtitle');
  let descriptionText = t('defaultDescription');

  if (activeCollectionObj) {
    eyebrowText = activeCollectionObj.code;
    headingTitle = activeCollectionObj.title;
    headingSubtitle = activeCollectionObj.subtitle;
    descriptionText = activeCollectionObj.description;
  } else if (activeCategory === 'essentials') {
    eyebrowText = t('essentialsEyebrow');
    headingTitle = t('essentialsTitle');
    headingSubtitle = t('essentialsSubtitle');
    descriptionText = t('essentialsDescription');
  } else if (activeCategoryObj) {
    eyebrowText = t('disciplineEyebrow', { index: activeCategoryObj.indexNumber, name: activeCategoryObj.shortName.toUpperCase() });
    headingTitle = activeCategoryObj.name;
    headingSubtitle = activeCategoryObj.editorialStatement;
    descriptionText = activeCategoryObj.description;
  }

  const isFlagshipActive =
    flagshipCollection &&
    (activeCollectionSlug === flagshipCollection.slug ||
      activeCollectionSlug === flagshipCollection.id);

  return (
    <section
      aria-labelledby="shop-archive-heading"
      className="border-b border-border bg-background pt-20 sm:pt-24 lg:pt-28"
    >
      <Container size="wide">
        {/* 1. Breadcrumb & Live Archive Telemetry Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3.5">
          <nav
            aria-label={t('breadcrumb')}
            className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em]"
          >
            <Link
              href="/"
              className="text-foreground-muted transition-colors hover:text-foreground"
            >
              {t('home')}
            </Link>
            <ChevronRight
              className="h-3 w-3 text-foreground-subtle"
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={() => {
                onSelectCategory('all');
                onSelectCollection('');
              }}
              className={cn(
                'uppercase transition-colors',
                activeCategory === 'all' && !activeCollectionSlug
                  ? 'font-medium text-foreground'
                  : 'text-foreground-muted hover:text-foreground'
              )}
            >
              {t('shopArchive')}
            </button>

            {activeCategory !== 'all' && (
              <>
                <ChevronRight
                  className="h-3 w-3 text-foreground-subtle"
                  aria-hidden="true"
                />
                <span className="font-medium text-accent">
                  {activeCategory === 'essentials'
                    ? t('essentials')
                    : activeCategoryObj?.name || activeCategory}
                </span>
              </>
            )}

            {activeCollectionObj && (
              <>
                <ChevronRight
                  className="h-3 w-3 text-foreground-subtle"
                  aria-hidden="true"
                />
                <span className="font-medium text-accent">
                  {activeCollectionObj.title}
                </span>
              </>
            )}
          </nav>

          <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-muted">
            <span>
              {t.rich('showing', {
                shown: String(totalMatchingCount).padStart(2, '0'),
                total: String(allProducts.length).padStart(2, '0'),
                strong: (chunks) => <strong className="font-medium text-foreground">{chunks}</strong>,
              })}
            </span>
            <span className="hidden text-foreground-subtle sm:inline">
              {t('studios')}
            </span>
          </div>
        </div>

        {/* 2. Compact Asymmetrical Shop Introduction + Featured Collection Visual */}
        <div className="grid grid-cols-1 items-center gap-8 py-8 lg:grid-cols-12 lg:gap-10 lg:py-10">
          {/* Left 8 Columns: Prominent Heading & Concise Introduction */}
          <div className="space-y-4 lg:col-span-8">
            <div className="flex flex-wrap items-center gap-3">
              <Eyebrow tone="accent">{eyebrowText}</Eyebrow>
              <TechnicalCode>
                [{t('activeObjects', { count: String(totalMatchingCount).padStart(2, '0') })}]
              </TechnicalCode>
            </div>

            <h1
              id="shop-archive-heading"
              className="font-display text-h1 tracking-tighter text-foreground"
            >
              {headingTitle}{' '}
              <span className="block font-normal italic text-foreground-muted sm:inline">
                — {headingSubtitle}
              </span>
            </h1>

            <p className="max-w-2xl text-body leading-relaxed text-foreground-muted">
              {descriptionText}
            </p>
          </div>

          {/* Right 4 Columns: Compact Featured Collection Visual Card */}
          {flagshipCollection && (
            <div className="lg:col-span-4">
              <div
                className={cn(
                  'group relative grid grid-cols-12 overflow-hidden border transition-colors duration-300',
                  isFlagshipActive
                    ? 'border-foreground bg-surface-inverse text-foreground-inverse'
                    : 'border-border bg-surface hover:border-foreground/50'
                )}
              >
                <div className="relative col-span-5 min-h-[124px] overflow-hidden border-e border-border bg-surface-muted">
                  <img
                    src={flagshipCollection.heroImage}
                    alt={flagshipCollection.title}
                    className="h-full w-full object-cover transition-transform duration-500 ease-noire-out group-hover:scale-105"
                  />
                  <span className="absolute bottom-2 start-2 border border-border bg-background/90 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground">
                    {t('edition04')}
                  </span>
                </div>

                <div className="col-span-7 flex flex-col justify-between p-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1 font-mono text-[9px] uppercase tracking-[0.14em] text-accent">
                      <span className="inline-flex items-center gap-1">
                        <Layers className="h-3 w-3" aria-hidden="true" />
                        <span>{t('featuredEdition')}</span>
                      </span>
                      <span>{t('pcs', { count: flagshipCollection.productIds.length })}</span>
                    </div>

                    <h2
                      className={cn(
                        'font-display text-sm font-medium tracking-tight',
                        isFlagshipActive
                          ? 'text-foreground-inverse'
                          : 'text-foreground'
                      )}
                    >
                      {flagshipCollection.title}
                    </h2>

                    <p
                      className={cn(
                        'line-clamp-2 text-[11px] leading-snug',
                        isFlagshipActive
                          ? 'text-foreground-subtle'
                          : 'text-foreground-muted'
                      )}
                    >
                      {flagshipCollection.subtitle}
                    </p>
                  </div>

                  <div className="mt-3 pt-2">
                    <button
                      type="button"
                      aria-pressed={isFlagshipActive}
                      onClick={() =>
                        onSelectCollection(
                          isFlagshipActive ? '' : flagshipCollection.slug
                        )
                      }
                      className={cn(
                        'inline-flex w-full items-center justify-between border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors',
                        isFlagshipActive
                          ? 'border-accent bg-accent text-accent-foreground'
                          : 'border-border bg-background text-foreground hover:border-foreground'
                      )}
                    >
                      <span>
                        {isFlagshipActive
                          ? t('viewingEdition')
                          : t('filterEdition')}
                      </span>
                      {isFlagshipActive ? (
                        <Check className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <span>→</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Category Navigation Bar */}
        <div className="border-t border-border py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav
              aria-label={t('categoriesAria')}
              className="flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:pb-0 no-scrollbar"
            >
              {/* All Instruments Button */}
              <button
                type="button"
                aria-pressed={activeCategory === 'all'}
                onClick={() => onSelectCategory('all')}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 border px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors duration-200',
                  activeCategory === 'all'
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-surface text-foreground-muted hover:border-foreground/50 hover:text-foreground'
                )}
              >
                <span>{t('allInstruments')}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.5 text-[10px] tabular-nums',
                    activeCategory === 'all'
                      ? 'bg-background/20 text-background'
                      : 'bg-surface-muted text-foreground-subtle'
                  )}
                >
                  {String(allProducts.length).padStart(2, '0')}
                </span>
              </button>

              {/* Catalog categories */}
              {categories.map((cat) => {
                const isActive = activeCategory === cat.slug;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() =>
                      onSelectCategory(isActive ? 'all' : cat.slug)
                    }
                    className={cn(
                      'inline-flex shrink-0 items-center gap-2 border px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors duration-200',
                      isActive
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-surface text-foreground-muted hover:border-foreground/50 hover:text-foreground'
                    )}
                  >
                    <span
                      className={cn(
                        'text-[10px]',
                        isActive ? 'text-accent' : 'text-foreground-subtle'
                      )}
                    >
                      {cat.indexNumber}
                    </span>
                    <span>{cat.shortName}</span>
                    <span
                      className={cn(
                        'px-1.5 py-0.5 text-[10px] tabular-nums',
                        isActive
                          ? 'bg-background/20 text-background'
                          : 'bg-surface-muted text-foreground-subtle'
                      )}
                    >
                      {String(cat.productCount).padStart(2, '0')}
                    </span>
                  </button>
                );
              })}

              {/* Essentials Category Curation Pill */}
              <button
                type="button"
                aria-pressed={activeCategory === 'essentials'}
                onClick={() =>
                  onSelectCategory(
                    activeCategory === 'essentials' ? 'all' : 'essentials'
                  )
                }
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 border px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors duration-200',
                  activeCategory === 'essentials'
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-surface text-foreground-muted hover:border-foreground/50 hover:text-foreground'
                )}
              >
                <span
                  className={cn(
                    'text-[10px]',
                    activeCategory === 'essentials'
                      ? 'text-accent'
                      : 'text-foreground-subtle'
                  )}
                >
                  07
                </span>
                <span>{t('essentials')}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.5 text-[10px] tabular-nums',
                    activeCategory === 'essentials'
                      ? 'bg-background/20 text-background'
                      : 'bg-surface-muted text-foreground-subtle'
                  )}
                >
                  {String(essentialsCount).padStart(2, '0')}
                </span>
              </button>
            </nav>

            {/* Explicit Reset Category Button when a Category is Selected */}
            {activeCategory !== 'all' && (
              <button
                type="button"
                onClick={() => onSelectCategory('all')}
                className="inline-flex shrink-0 items-center gap-1.5 border border-border bg-surface-muted px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground transition-colors hover:border-foreground"
              >
                <RotateCcw className="h-3 w-3 text-accent" aria-hidden="true" />
                <span>{t('resetCategory')}</span>
              </button>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
