'use client';

import React, { useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, History } from 'lucide-react';
import { Container, Section } from '@/components/layout';
import { Reveal } from '@/components/motion';
import { Eyebrow, TechnicalCode } from '@/components/ui';
import { ProductCard } from '@/components/product';
import { useCommerce } from '@/lib/context/commerce-context';
import type { Product } from '@/types';

interface ProductRecommendationsProps {
  currentProduct: Product;
  relatedProducts: Product[];
  allProducts: Product[];
}

export function ProductRecommendations({
  currentProduct,
  relatedProducts,
  allProducts,
}: ProductRecommendationsProps) {
  const t = useTranslations('productDetail.related');
  const { recentlyViewedIds } = useCommerce();

  // Deduplicated, chronologically ordered recently viewed products excluding current product
  const recentlyViewedProducts = useMemo(() => {
    const seen = new Set<string>([currentProduct.id]);
    const list: Product[] = [];

    recentlyViewedIds.forEach((id) => {
      if (seen.has(id)) return;
      const found = allProducts.find(
        (p) => p.id === id && p.status === 'active'
      );
      if (found) {
        seen.add(found.id);
        list.push(found);
      }
    });

    return list.slice(0, 3);
  }, [recentlyViewedIds, currentProduct.id, allProducts]);

  const leadRelated = relatedProducts[0];
  const secondaryRelated = relatedProducts.slice(1, 3);

  return (
    <>
      {/* 14 — RELATED / COMPLEMENTARY INSTRUMENTS (Asymmetrical Visual Rhythm) */}
      {relatedProducts.length > 0 && (
        <Section
          id="related-instruments"
          spacing="lg"
          tone="default"
          borderBottom
          aria-labelledby="pdp-related-heading"
        >
          <Container size="wide">
            <Reveal className="mb-12 flex flex-col justify-between gap-6 border-b border-border pb-8 lg:flex-row lg:items-end">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Eyebrow index="06" tone="accent">
                    {t('eyebrow')}
                  </Eyebrow>
                  <TechnicalCode>
                    {t('code', { category: currentProduct.categoryName.toUpperCase() })}
                  </TechnicalCode>
                </div>
                <h2
                  id="pdp-related-heading"
                  className="font-display text-h1 tracking-tighter text-foreground"
                >
                  {t('title')}{' '}
                  <span className="font-normal italic text-foreground-muted">
                    {t('titleAccent')}
                  </span>
                </h2>
              </div>

              <Link
                href={`/shop?category=${currentProduct.category}`}
                className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-foreground underline underline-offset-8 transition-colors hover:text-accent"
              >
                <span>{t('exploreAll', { category: currentProduct.categoryName })}</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Reveal>

            {/* Varied Visual Rhythm: 01 Large-Split Companion + 02/03 Asymmetrical Pair */}
            <div className="space-y-10">
              {leadRelated && (
                <Reveal>
                  <ProductCard
                    product={leadRelated}
                    indexLabel={t('primary')}
                    variant="large-split"
                  />
                </Reveal>
              )}

              {secondaryRelated.length > 0 && (
                <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
                  {secondaryRelated[0] && (
                    <Reveal className="lg:col-span-7">
                      <ProductCard
                        product={secondaryRelated[0]}
                        indexLabel={t('secondary', { index: 2 })}
                        aspect="landscape"
                      />
                    </Reveal>
                  )}

                  {secondaryRelated[1] && (
                    <Reveal delay={0.08} className="lg:col-span-5">
                      <ProductCard
                        product={secondaryRelated[1]}
                        indexLabel={t('secondary', { index: 3 })}
                        aspect="portrait"
                      />
                    </Reveal>
                  )}
                </div>
              )}
            </div>
          </Container>
        </Section>
      )}

      {/* 15 — RECENTLY VIEWED INSTRUMENTS (Persisted via localStorage) */}
      {recentlyViewedProducts.length > 0 && (
        <Section
          id="recently-viewed"
          spacing="md"
          tone="muted"
          borderBottom
          aria-labelledby="pdp-recent-heading"
        >
          <Container size="wide">
            <Reveal className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
              <div className="flex items-center gap-3">
                <History
                  className="h-4 w-4 text-accent"
                  aria-hidden="true"
                />
                <h2
                  id="pdp-recent-heading"
                  className="font-mono text-xs uppercase tracking-[0.16em] text-foreground"
                >
                  {t('recentTitle')}
                </h2>
              </div>

              <TechnicalCode>
                {t('recentCount', { count: String(recentlyViewedProducts.length).padStart(2, '0') })}
              </TechnicalCode>
            </Reveal>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recentlyViewedProducts.map((item, idx) => (
                <Reveal key={item.id} delay={idx * 0.05}>
                  <ProductCard
                    product={item}
                    indexLabel={t('recentIndex', { index: idx + 1 })}
                    variant="minimal"
                    aspect="portrait"
                  />
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}
