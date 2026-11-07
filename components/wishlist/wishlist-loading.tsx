import { useTranslations } from 'next-intl';
import { Container } from '@/components/layout';
import { Skeleton } from '@/components/ui';

export function WishlistContentSkeleton() {
  const t = useTranslations('wishlist');
  return (
    <div role="status" aria-label={t('loading')} aria-busy="true" className="space-y-5">
      <div className="flex items-end justify-between border-b border-border pb-3">
        <div className="space-y-2">
          <Skeleton className="h-2.5 w-28" />
          <Skeleton className="h-8 w-56" />
        </div>
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12 lg:gap-5">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={`${index === 0 ? 'lg:col-span-7' : 'lg:col-span-5'} border border-border bg-surface p-3 sm:p-4`}
          >
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WishlistLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border">
        <Container size="wide">
          <div className="pb-7 pt-24 sm:pb-9">
            <Skeleton className="mb-7 h-3.5 w-48" />
            <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12 lg:gap-8">
              <div className="space-y-4 lg:col-span-7">
                <Skeleton className="h-3.5 w-56" />
                <Skeleton className="h-12 w-3/4 sm:h-14" />
                <Skeleton className="h-5 w-full max-w-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3 lg:col-span-5">
                <Skeleton className="h-[4.5rem] w-full" />
                <Skeleton className="h-[4.5rem] w-full" />
              </div>
            </div>
          </div>
        </Container>
      </div>
      <main id="main-content" className="py-8 sm:py-10 lg:py-12">
        <Container size="wide">
          <WishlistContentSkeleton />
        </Container>
      </main>
    </div>
  );
}
