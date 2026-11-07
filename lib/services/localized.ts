/**
 * NOIRÉ — Locale-aware catalog reads for Server Components.
 *
 * Mirrors the `@/lib/services` surface but returns category / collection / product
 * copy translated for the active request locale. Mutations and non-catalog reads are
 * re-exported untouched.
 *
 * Data source is selected per request via `NOIRE_DATA_SOURCE`:
 *   • `mock`     → in-memory fixtures + `messages/<locale>.json → catalog.*` overrides
 *   • `supabase` → Postgres rows + `*_translations` tables (see supabase/migrations)
 */
import { getLocale } from 'next-intl/server';
import * as base from '@/lib/mock-api';
import { getCatalogLocalizer } from '@/lib/i18n/catalog';
import { getDataSource } from '@/lib/env';
import { isAppLocale, type AppLocale } from '@/i18n/routing';
import type { Product, ProductFilterParams, Review } from '@/types';

export * from '@/lib/mock-api';

async function loadSupabaseCatalog() {
  return import('@/lib/services/supabase/catalog');
}

async function requestLocale(): Promise<AppLocale> {
  const locale = await getLocale();
  return isAppLocale(locale) ? locale : 'en';
}

function isSupabaseSource(): boolean {
  return getDataSource() === 'supabase';
}

export async function getProducts(
  params: ProductFilterParams = {},
  delayMs?: number
): ReturnType<typeof base.getProducts> {
  if (isSupabaseSource()) {
    const [db, locale] = await Promise.all([loadSupabaseCatalog(), requestLocale()]);
    return db.getProducts(params, locale);
  }
  const [response, localize] = await Promise.all([base.getProducts(params, delayMs), getCatalogLocalizer()]);
  return { ...response, items: localize.products(response.items) };
}

export async function getProductBySlug(slugOrId: string, delayMs?: number): Promise<Product | null> {
  if (isSupabaseSource()) {
    const [db, locale] = await Promise.all([loadSupabaseCatalog(), requestLocale()]);
    return db.getProductBySlug(slugOrId, locale);
  }
  const [product, localize] = await Promise.all([base.getProductBySlug(slugOrId, delayMs), getCatalogLocalizer()]);
  return product ? localize.product(product) : product;
}

export async function getFeaturedProducts(limit?: number, delayMs?: number): Promise<Product[]> {
  if (isSupabaseSource()) {
    const [db, locale] = await Promise.all([loadSupabaseCatalog(), requestLocale()]);
    return db.getFeaturedProducts(limit, locale);
  }
  const [items, localize] = await Promise.all([base.getFeaturedProducts(limit, delayMs), getCatalogLocalizer()]);
  return localize.products(items);
}

export async function getSpotlightProduct(delayMs?: number): Promise<Product> {
  if (isSupabaseSource()) {
    const [db, locale] = await Promise.all([loadSupabaseCatalog(), requestLocale()]);
    return db.getSpotlightProduct(locale);
  }
  const [product, localize] = await Promise.all([base.getSpotlightProduct(delayMs), getCatalogLocalizer()]);
  return localize.product(product);
}

export async function getRelatedProducts(productId: string, limit?: number, delayMs?: number): Promise<Product[]> {
  if (isSupabaseSource()) {
    const [db, locale] = await Promise.all([loadSupabaseCatalog(), requestLocale()]);
    return db.getRelatedProducts(productId, limit, locale);
  }
  const [items, localize] = await Promise.all([
    base.getRelatedProducts(productId, limit, delayMs),
    getCatalogLocalizer(),
  ]);
  return localize.products(items);
}

export async function getCategories(delayMs?: number): ReturnType<typeof base.getCategories> {
  if (isSupabaseSource()) {
    const [db, locale] = await Promise.all([loadSupabaseCatalog(), requestLocale()]);
    return db.getCategories(locale);
  }
  const [items, localize] = await Promise.all([base.getCategories(delayMs), getCatalogLocalizer()]);
  return localize.categories(items);
}

export async function getCollections(delayMs?: number): ReturnType<typeof base.getCollections> {
  if (isSupabaseSource()) {
    const [db, locale] = await Promise.all([loadSupabaseCatalog(), requestLocale()]);
    return db.getCollections(locale);
  }
  const [items, localize] = await Promise.all([base.getCollections(delayMs), getCatalogLocalizer()]);
  return localize.collections(items);
}

export async function getCollectionBySlug(
  slugOrId: string,
  delayMs?: number
): ReturnType<typeof base.getCollectionBySlug> {
  if (isSupabaseSource()) {
    const [db, locale] = await Promise.all([loadSupabaseCatalog(), requestLocale()]);
    return db.getCollectionBySlug(slugOrId, locale);
  }
  const [collection, localize] = await Promise.all([base.getCollectionBySlug(slugOrId, delayMs), getCatalogLocalizer()]);
  return collection
    ? {
        ...collection,
        collection: localize.collection(collection.collection),
        products: localize.products(collection.products),
      }
    : collection;
}

export async function getReviewsByProductId(productId: string, delayMs?: number): Promise<Review[]> {
  if (isSupabaseSource()) {
    const db = await loadSupabaseCatalog();
    return db.getReviewsByProductId(productId);
  }
  return base.getReviewsByProductId(productId, delayMs);
}
