/**
 * NOIRÉ — Locale-aware catalog reads for Server Components.
 *
 * Every read goes to Supabase (Postgres rows + `*_translations` tables) using
 * the locale of the current request. Import from here in `app/**` pages; the
 * underlying adapters live in `lib/services/supabase/*`.
 */
import 'server-only';

import { getLocale } from 'next-intl/server';
import { isAppLocale, type AppLocale } from '@/i18n/routing';
import type { Product, ProductFilterParams, Review } from '@/types';
import * as catalog from '@/lib/services/supabase/catalog';

export { getJournalArticles, getJournalArticleBySlug } from '@/lib/services/supabase/journal';
export { getStorefrontContent } from '@/lib/services/supabase/content';
export { getOrderReceipt, quoteShippingMethods } from '@/lib/services/supabase/commerce';
export { searchCatalog } from '@/lib/services/supabase/search';
export type { StorefrontContent } from '@/lib/services/supabase/content';

async function requestLocale(): Promise<AppLocale> {
  const locale = await getLocale();
  return isAppLocale(locale) ? locale : 'en';
}

export async function getProducts(params: ProductFilterParams = {}): ReturnType<typeof catalog.getProducts> {
  return catalog.getProducts(params, await requestLocale());
}

export async function getProductBySlug(slugOrId: string): Promise<Product | null> {
  return catalog.getProductBySlug(slugOrId, await requestLocale());
}

export async function getFeaturedProducts(limit?: number): Promise<Product[]> {
  return catalog.getFeaturedProducts(limit, await requestLocale());
}

export async function getSpotlightProduct(): Promise<Product> {
  return catalog.getSpotlightProduct(await requestLocale());
}

export async function getRelatedProducts(productId: string, limit?: number): Promise<Product[]> {
  return catalog.getRelatedProducts(productId, limit, await requestLocale());
}

export async function getCategories(): ReturnType<typeof catalog.getCategories> {
  return catalog.getCategories(await requestLocale());
}

export async function getCollections(): ReturnType<typeof catalog.getCollections> {
  return catalog.getCollections(await requestLocale());
}

export async function getCollectionBySlug(slugOrId: string): ReturnType<typeof catalog.getCollectionBySlug> {
  return catalog.getCollectionBySlug(slugOrId, await requestLocale());
}

export async function getReviewsByProductId(productId: string): Promise<Review[]> {
  return catalog.getReviewsByProductId(productId);
}

export async function getShippingMethods(country?: string) {
  return catalog.getShippingMethods(country);
}

/** Full catalog (paged under the hood) for client-side lookups such as wishlist / cart hydration. */
export async function getCanonicalCatalog(): Promise<Product[]> {
  const locale = await requestLocale();
  const pageSize = 50;
  const first = await catalog.getProducts({ limit: pageSize, page: 1 }, locale);
  if (first.totalPages <= 1) return first.items;
  const rest = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, index) => catalog.getProducts({ limit: pageSize, page: index + 2 }, locale))
  );
  return [...first.items, ...rest.flatMap((page) => page.items)];
}
