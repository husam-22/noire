import React from 'react';
import { useTranslations } from 'next-intl';
import { Container } from '@/components/layout';
import { Skeleton } from '@/components/ui';

export function CheckoutSkeleton() {
  const t = useTranslations('checkout');
  return (
    <div
      aria-busy="true"
      aria-label={t('loading')}
      className="min-h-screen bg-background pt-20 text-foreground"
    >
      <div className="border-b border-border py-3.5">
        <Container size="wide" className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-64" />
          <Skeleton className="hidden h-3.5 w-48 md:block" />
        </Container>
      </div>

      <Container size="wide" className="py-10 sm:py-14">
        <div className="mb-10 space-y-3 border-b border-border pb-8">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-11 w-80 sm:w-96" />
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-8 lg:col-span-7 xl:col-span-8">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="space-y-5 border border-border bg-surface p-6 sm:p-8"
              >
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-7 w-64" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-11 w-full" />
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-5 xl:col-span-4">
            <div className="space-y-6 border border-border bg-surface p-6 sm:p-8">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <div className="space-y-3 border-t border-border pt-5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
