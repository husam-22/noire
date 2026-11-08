'use client';

import { useTranslations } from 'next-intl';
import { ErrorState } from '@/components/ui';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');
  return (
    <main id="main-content" className="min-w-0">
      <ErrorState
        code={t('admin.code')}
        title={t('admin.title')}
        description={error.message || t('admin.description')}
        onRetry={reset}
        retryLabel={t('retry')}
      />
    </main>
  );
}
