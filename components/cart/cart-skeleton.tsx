import React from 'react';
import { useTranslations } from 'next-intl';
import { Container } from '@/components/layout';
import { Skeleton } from '@/components/ui';

export function CartSkeleton() {
  const t = useTranslations('cart');
  return (
    <div
      aria-busy="true"
      aria-label={t('loading')}
      className="min-h-screen bg-background pt-20 text-foreground"
    >
      {/* Telemetry Bar Skeleton */}
      <div className="border-b border-border py-3.5">
        <Container size="wide" className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-56" />
          <Skeleton className="hidden h-3.5 w-48 md:block" />
        </Container>
      </div>

      <Container size="wide" className="py-10 sm:py-14">
        <div className="mb-10 space-y-4 border-b border-border pb-8">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-12 w-72 sm:w-96" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-4 lg:col-span-7 xl:col-span-8">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-6 border border-border bg-surface p-5 sm:flex-row sm:p-6"
              >
                <Skeleton className="aspect-[4/5] w-28 shrink-0 sm:w-36" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-12 w-full" />
                  <div className="flex items-center justify-between pt-3">
                    <Skeleton className="h-9 w-28" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-5 xl:col-span-4">
            <div className="space-y-6 border border-border bg-surface p-6 sm:p-8">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-20 w-full" />
              <div className="space-y-3 border-t border-border pt-5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
