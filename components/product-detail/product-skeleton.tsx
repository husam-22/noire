import React from 'react';
import { useTranslations } from 'next-intl';
import { Container } from '@/components/layout';
import { Skeleton } from '@/components/ui';

export function ProductDetailSkeleton() {
  const t = useTranslations('productDetail');
  return (
    <div
      aria-busy="true"
      aria-label={t('loading')}
      className="min-h-screen bg-background pt-20 text-foreground"
    >
      {/* Breadcrumb Skeleton */}
      <div className="border-b border-border py-3.5">
        <Container size="wide" className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-64" />
          <Skeleton className="hidden h-3.5 w-48 md:block" />
        </Container>
      </div>

      {/* Asymmetrical 7/5 Hero Skeleton */}
      <Container size="wide" className="py-10 sm:py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-4 lg:col-span-7">
            <Skeleton className="aspect-[16/13] w-full border border-border" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="aspect-[4/3] w-full" />
              ))}
            </div>
          </div>

          <div className="space-y-6 border border-border bg-surface p-6 sm:p-8 lg:col-span-5">
            <div className="space-y-3 border-b border-border pb-6">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-10 w-4/5" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-16 w-full" />
            </div>

            <div className="flex items-center justify-between border-b border-border pb-6">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-5 w-40" />
            </div>

            <div className="space-y-4 border-b border-border pb-6">
              <Skeleton className="h-4 w-28" />
              <div className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between gap-4">
                <Skeleton className="h-11 w-32" />
                <Skeleton className="h-11 w-40" />
              </div>
              <Skeleton className="h-13 w-full" />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
