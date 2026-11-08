'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Container, Section } from '@/components/layout';
import { ErrorState } from '@/components/ui';

export default function ProductDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');
  return (
    <div className="min-h-screen bg-background pt-24 text-foreground">
      <Section spacing="lg">
        <Container size="narrow">
          <ErrorState
            code={t('product.code')}
            title={t('product.title')}
            description={
              error.message || t('product.description')
            }
            onRetry={reset}
            retryLabel={t('product.retry')}
            secondaryAction={
              <Link
                href="/shop"
                className="inline-flex h-9 items-center justify-center border border-border bg-surface px-4 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground transition-colors hover:border-foreground"
              >
                {t('returnShop')}
              </Link>
            }
          />
        </Container>
      </Section>
    </div>
  );
}
