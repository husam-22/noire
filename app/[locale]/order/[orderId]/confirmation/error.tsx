'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/layout';
import { ErrorState } from '@/components/ui';

export default function OrderConfirmationError({
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
          code={t('orderConfirmation.code')}
          title={t('orderConfirmation.title')}
          description={t('orderConfirmation.description')}
          onRetry={reset}
          retryLabel={t('orderConfirmation.retry')}
          secondaryAction={
            <Link href="/shop" className="inline-flex min-h-11 items-center border-b border-foreground font-mono text-[10px] uppercase tracking-[0.12em]">
              {t('orderConfirmation.back')}
            </Link>
          }
        />
      </Container>
    </main>
  );
}
