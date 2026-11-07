import React from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';
import { Container } from '@/components/layout';
import type { Product } from '@/types';

interface ProductBreadcrumbsProps {
  product: Product;
}

export function ProductBreadcrumbs({ product }: ProductBreadcrumbsProps) {
  const t = useTranslations('productDetail.breadcrumbs');
  return (
    <div className="border-b border-border bg-background pt-16 sm:pt-20">
      <Container size="wide">
        <div className="flex flex-wrap items-center justify-between gap-3 py-3.5">
          <nav
            aria-label={t('label')}
            className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em]"
          >
            <Link
              href="/"
              className="text-foreground-muted transition-colors hover:text-foreground"
            >
              {t('home')}
            </Link>
            <ChevronRight
              className="h-3 w-3 shrink-0 text-foreground-subtle"
              aria-hidden="true"
            />
            <Link
              href="/shop"
              className="text-foreground-muted transition-colors hover:text-foreground"
            >
              {t('shop')}
            </Link>
            <ChevronRight
              className="h-3 w-3 shrink-0 text-foreground-subtle"
              aria-hidden="true"
            />
            <Link
              href={`/shop?category=${product.category}`}
              className="text-foreground-muted transition-colors hover:text-foreground"
            >
              {product.categoryName}
            </Link>
            <ChevronRight
              className="h-3 w-3 shrink-0 text-foreground-subtle"
              aria-hidden="true"
            />
            <span
              aria-current="page"
              className="max-w-[200px] truncate font-medium text-foreground sm:max-w-none"
            >
              {product.name}
            </span>
          </nav>

          <div className="hidden items-center gap-4 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-subtle md:flex">
            <span>{t('sku', { sku: product.sku })}</span>
            <span>•</span>
            <span>{t('origin', { origin: product.designedIn })}</span>
            <span>•</span>
            <span>{t('edition', { year: product.releaseYear })}</span>
          </div>
        </div>
      </Container>
    </div>
  );
}
