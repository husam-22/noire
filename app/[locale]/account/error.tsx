'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/layout';
import { ErrorState } from '@/components/ui';

export default function AccountError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');
  return (
    <main id="main-content" className="min-h-screen bg-background py-12 pt-28 text-foreground sm:py-16">
      <Container size="wide">
        <ErrorState
          code={t('account.code')}
          title={t('account.title')}
          description={t('account.description')}
          retryLabel={t('account.retry')}
          onRetry={reset}
          secondaryAction={
            <Link href="/" className="inline-flex min-h-11 items-center border-b border-foreground px-1 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground-muted transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
              {t('returnHome')}
            </Link>
          }
        />
      </Container>
    </main>
  );
}
