'use client';

import { Link } from '@/i18n/navigation';
import { Container } from '@/components/layout';
import { ErrorState } from '@/components/ui';

export default function AccountOrderError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="min-h-screen bg-background pb-12 pt-28 text-foreground sm:pb-16">
      <Container size="wide">
        <ErrorState
          code="ERR // ORDER-DOSSIER-500"
          title="The order dossier could not be loaded."
          description="This order could not be loaded. Nothing has been changed — retry, or return to your account."
          retryLabel="Retry dossier"
          onRetry={reset}
          secondaryAction={
            <Link href="/account#order-archive" className="inline-flex min-h-11 items-center border-b border-foreground px-1 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground-muted transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
              Return to Order Archive
            </Link>
          }
        />
      </Container>
    </main>
  );
}
