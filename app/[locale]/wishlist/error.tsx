'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ErrorState } from '@/components/ui';

export default function WishlistError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');
  return (
    <main id="main-content" className="min-h-screen bg-background px-4 pb-16 pt-28 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-container">
        <ErrorState
          code={t('wishlist.code')}
          title={t('wishlist.title')}
          description={t('wishlist.description')}
          retryLabel={t('wishlist.retry')}
          onRetry={reset}
          secondaryAction={
            <Link
              href="/"
              className="inline-flex min-h-11 items-center border-b border-border px-1 font-mono text-[10px] uppercase tracking-[0.13em] text-foreground-muted transition-colors hover:border-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              {t('returnHome')}
            </Link>
          }
        />
      </div>
    </main>
  );
}
