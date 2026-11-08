import { useTranslations } from 'next-intl';
import { Container } from '@/components/layout';
import { Skeleton } from '@/components/ui';

export function AccountContentSkeleton() {
  const t = useTranslations('account');
  return (
    <div role="status" aria-label={t('loading')} aria-busy="true" className="space-y-7">
      <div className="flex items-end justify-between border-b border-border pb-4">
        <div className="space-y-3">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-8 w-56" />
        </div>
        <Skeleton className="h-7 w-28" />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        {[0, 1, 2, 3, 4].map((item) => (
          <div key={item} className="border border-border bg-surface p-4">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="mt-3 h-5 w-3/4" />
            <Skeleton className="mt-3 h-3 w-1/2" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="space-y-4 border border-border bg-surface p-5 xl:col-span-7">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-7 w-64 max-w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-11 w-48" />
        </div>
        <div className="space-y-4 border border-border bg-surface p-5 xl:col-span-5">
          <Skeleton className="h-4 w-40" />
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="aspect-square w-full" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AccountOrderSkeleton() {
  const t = useTranslations('orderConfirmation');
  return (
    <div role="status" aria-label={t('loading')} aria-busy="true" className="space-y-5">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-10 w-80 max-w-full" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Skeleton className="h-[440px] w-full lg:col-span-7" />
        <Skeleton className="h-[440px] w-full lg:col-span-5" />
      </div>
    </div>
  );
}

export default function AccountRouteSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <Container size="wide" className="pb-8 pt-24 sm:pb-10">
          <Skeleton className="mb-7 h-3.5 w-48" />
          <div className="grid grid-cols-1 items-end gap-7 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              <Skeleton className="h-3 w-52" />
              <Skeleton className="h-12 w-3/4 sm:h-14" />
              <Skeleton className="h-5 w-full max-w-2xl" />
            </div>
            <div className="grid grid-cols-2 gap-3 lg:col-span-5">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-11 w-full sm:col-span-2" />
            </div>
          </div>
        </Container>
      </header>
      <main id="main-content" className="py-8 sm:py-10">
        <Container size="wide">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-3">
              <Skeleton className="h-12 w-full" />
            </div>
            <div className="lg:col-span-9">
              <AccountContentSkeleton />
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
