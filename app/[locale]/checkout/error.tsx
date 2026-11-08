'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/layout';
import { ErrorState } from '@/components/ui';

export default function CheckoutError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');
  return (
    <main id="main-content" className="bg-background py-12 text-foreground sm:py-16">
      <Container size="wide">
        <ErrorState
          code={t('checkout.code')}
          title={t('checkout.title')}
          description={t('checkout.description')}
          onRetry={reset}
          retryLabel={t('checkout.retry')}
          secondaryAction={
            <Link
              href="/cart"
              className="inline-flex min-h-11 items-center border-b border-foreground font-mono text-[10px] uppercase tracking-[0.12em]"
            >
              {t('checkout.back')}
            </Link>
          }
          className="min-h-[320px]"
        />
      </Container>
    </main>
  );
}
