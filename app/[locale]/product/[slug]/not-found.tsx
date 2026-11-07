import React from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Compass, ArrowUpRight } from 'lucide-react';
import { getCategories, getCollections, getFeaturedProducts, getSpotlightProduct } from '@/lib/services/localized';
import { Container, Section } from '@/components/layout';
import { EmptyState, Eyebrow } from '@/components/ui';
import { GlobalHeader, GlobalFooter } from '@/components/navigation';
import { ProductCard, QuickViewModal } from '@/components/product';

export default async function ProductNotFound() {
  const [t, categories, collections, featuredProducts, spotlightProduct] = await Promise.all([
    getTranslations('productNotFound'),
    getCategories().catch(() => []),
    getCollections().catch(() => []),
    getFeaturedProducts(3).catch(() => []),
    getSpotlightProduct().catch(() => null),
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <GlobalHeader
        categories={categories}
        collections={collections}
        featuredProducts={featuredProducts}
        spotlightProduct={spotlightProduct}
        allowTransparentTop={false}
      />

      <main id="main-content" className="pt-20 sm:pt-24">
        <Section spacing="md" borderBottom>
          <Container size="wide">
            <EmptyState
              code={t('code')}
              title={t('title')}
              description={t('description')}
              icon={<Compass className="h-5 w-5" />}
              primaryAction={
                <Link
                  href="/shop"
                  className="inline-flex h-11 items-center gap-2 border border-foreground bg-foreground px-6 font-mono text-xs uppercase tracking-[0.14em] text-background transition-opacity hover:opacity-90"
                >
                  <span>{t('primaryAction')}</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              }
              secondaryAction={
                <Link
                  href="/"
                  className="inline-flex h-11 items-center border border-border bg-surface px-6 font-mono text-xs uppercase tracking-[0.14em] text-foreground transition-colors hover:border-foreground"
                >
                  {t('secondaryAction')}
                </Link>
              }
            />
          </Container>
        </Section>

        {/* Suggested Active Instruments */}
        <Section spacing="md" tone="muted">
          <Container size="wide">
            <div className="mb-8 space-y-2">
              <Eyebrow index="01" tone="accent">
                {t('featuredEyebrow')}
              </Eyebrow>
              <h2 className="font-display text-h2 tracking-tight text-foreground">
                {t('featuredTitle')}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {featuredProducts.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  indexLabel={t('featuredIndex', { index: idx + 1 })}
                />
              ))}
            </div>
          </Container>
        </Section>
      </main>

      <GlobalFooter categories={categories} collections={collections} />
      <QuickViewModal />
    </div>
  );
}
