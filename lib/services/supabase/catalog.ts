import 'server-only';

import type {
  Category,
  Collection,
  PaginatedResponse,
  Product,
  ProductFilterParams,
  Review,
  ShippingMethod,
} from '@/types';
import type { Enums, Tables, Views } from '@/types/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { mapCategory, mapCollection, mapProduct, mapReview, mapShippingMethod } from './mappers';

type Locale = Enums<'locale_code'>;

/**
 * Supabase-backed catalog reads
 * so `lib/services/catalog.ts` can switch adapters per `NOIRE_DATA_SOURCE`.
 * Translations are joined here, so callers get locale-ready copy directly.
 */

function translationFor<T extends { locale: Locale }>(rows: T[] | null | undefined, locale: Locale): T | null {
  if (!rows || locale === 'en') return null; // English is the base copy
  return rows.find((row) => row.locale === locale) ?? null;
}

async function loadProductTranslations(productIds: string[], locale: Locale) {
  if (locale === 'en' || productIds.length === 0) return new Map<string, Tables<'product_translations'>>();
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('product_translations')
    .select('*')
    .eq('locale', locale)
    .in('product_id', productIds);
  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.product_id, row]));
}

async function hydrateProducts(rows: Views<'catalog_products'>[] | null, locale: Locale): Promise<Product[]> {
  const list = rows ?? [];
  const translations = await loadProductTranslations(
    list.map((row) => row.id),
    locale
  );
  return list.map((row) => mapProduct(row, translations.get(row.id)));
}

export async function getProducts(params: ProductFilterParams = {}, locale: Locale = 'en'): Promise<PaginatedResponse<Product>> {
  const { query, category, collection, minPrice, maxPrice, stockStatus, colors, sort = 'featured', page = 1, limit = 12 } = params;
  const supabase = createSupabaseServerClient();

  let request = supabase.from('catalog_products').select('*', { count: 'exact' }).eq('status', 'active');

  if (query && query.trim().length > 0) {
    // `websearch_to_tsquery` handles quoted phrases and `-exclusions`; `simple` config matches the generated column.
    request = request.textSearch('search_vector', query.trim(), { type: 'websearch', config: 'simple' });
  }
  if (category && category !== 'all') request = request.eq('category_slug', category);
  if (collection) request = request.contains('collection_ids', [collection]);
  if (typeof minPrice === 'number') request = request.gte('price', minPrice);
  if (typeof maxPrice === 'number') request = request.lte('price', maxPrice);
  if (stockStatus && stockStatus.length > 0) request = request.in('stock_status', stockStatus);
  if (colors && colors.length > 0) {
    // Any colour whose name contains one of the requested family names (case-insensitive, JSONB text search).
    request = request.or(colors.map((c) => `colors.cs.${JSON.stringify([{ name: c }])}`).join(','));
  }

  switch (sort) {
    case 'price-asc':
      request = request.order('price', { ascending: true });
      break;
    case 'price-desc':
      request = request.order('price', { ascending: false });
      break;
    case 'name-asc':
      request = request.order('name', { ascending: true });
      break;
    case 'newest':
      request = request.order('created_at', { ascending: false });
      break;
    default:
      request = request.order('featured', { ascending: false }).order('created_at', { ascending: false });
  }

  const safeLimit = Math.max(1, Math.min(limit, 50));
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * safeLimit;
  const { data, error, count } = await request.range(from, from + safeLimit - 1);
  if (error) throw error;

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  return {
    items: await hydrateProducts(data, locale),
    total,
    page: Math.min(safePage, totalPages),
    limit: safeLimit,
    totalPages,
    hasMore: safePage < totalPages,
  };
}

export async function getProductBySlug(slugOrId: string, locale: Locale = 'en'): Promise<Product | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('catalog_products')
    .select('*')
    .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [product] = await hydrateProducts([data], locale);
  return product ?? null;
}

export async function getFeaturedProducts(limit = 4, locale: Locale = 'en'): Promise<Product[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('catalog_products')
    .select('*')
    .eq('status', 'active')
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return hydrateProducts(data, locale);
}

export async function getSpotlightProduct(locale: Locale = 'en'): Promise<Product> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('catalog_products')
    .select('*')
    .eq('status', 'active')
    .order('is_spotlight', { ascending: false })
    .order('featured', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Catalog is empty: no active product available for the spotlight slot.');
  const [product] = await hydrateProducts([data], locale);
  return product;
}

export async function getRelatedProducts(productId: string, limit = 3, locale: Locale = 'en'): Promise<Product[]> {
  const supabase = createSupabaseServerClient();
  const { data: current } = await supabase
    .from('catalog_products')
    .select('related_product_ids')
    .eq('id', productId)
    .maybeSingle();

  const explicitIds = current?.related_product_ids ?? [];
  const explicit = explicitIds.length
    ? await supabase.from('catalog_products').select('*').in('id', explicitIds).eq('status', 'active')
    : { data: [] as Views<'catalog_products'>[], error: null };
  if (explicit.error) throw explicit.error;

  let rows = (explicit.data ?? []).slice(0, limit);
  if (rows.length < limit) {
    const exclude = [productId, ...rows.map((r) => r.id)];
    const { data: fallback, error } = await supabase
      .from('catalog_products')
      .select('*')
      .eq('status', 'active')
      .not('id', 'in', `(${exclude.join(',')})`)
      .order('featured', { ascending: false })
      .limit(limit - rows.length);
    if (error) throw error;
    rows = [...rows, ...(fallback ?? [])];
  }
  return hydrateProducts(rows, locale);
}

export async function getCategories(locale: Locale = 'en'): Promise<Category[]> {
  const supabase = createSupabaseServerClient();
  const [{ data, error }, translations] = await Promise.all([
    supabase.from('catalog_categories').select('*').order('sort_order'),
    locale === 'en'
      ? Promise.resolve<Tables<'category_translations'>[]>([])
      : supabase
          .from('category_translations')
          .select('*')
          .eq('locale', locale)
          .then((r) => r.data ?? []),
  ]);
  if (error) throw error;
  return (data ?? []).map((row) =>
    mapCategory(row, translationFor(translations.filter((t) => t.category_id === row.id), locale))
  );
}

export async function getCollections(locale: Locale = 'en'): Promise<Collection[]> {
  const supabase = createSupabaseServerClient();
  const [{ data, error }, translations] = await Promise.all([
    supabase.from('catalog_collections').select('*').order('sort_order'),
    locale === 'en'
      ? Promise.resolve<Tables<'collection_translations'>[]>([])
      : supabase
          .from('collection_translations')
          .select('*')
          .eq('locale', locale)
          .then((r) => r.data ?? []),
  ]);
  if (error) throw error;
  return (data ?? []).map((row) =>
    mapCollection(row, translationFor(translations.filter((t) => t.collection_id === row.id), locale))
  );
}

export async function getCollectionBySlug(
  slugOrId: string,
  locale: Locale = 'en'
): Promise<{ collection: Collection; products: Product[] } | null> {
  const collections = await getCollections(locale);
  const collection = collections.find((c) => c.slug === slugOrId || c.id === slugOrId);
  if (!collection) return null;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('catalog_products')
    .select('*')
    .eq('status', 'active')
    .contains('collection_ids', [collection.id]);
  if (error) throw error;
  return { collection, products: await hydrateProducts(data, locale) };
}

export async function getReviewsByProductId(productId: string): Promise<Review[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .eq('approved', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapReview);
}

export async function getShippingMethods(country?: string): Promise<ShippingMethod[]> {
  const supabase = createSupabaseServerClient();
  let request = supabase.from('shipping_methods').select('*').eq('active', true).order('sort_order');
  if (country) request = request.or(`countries.is.null,countries.cs.{${country}}`);
  const { data, error } = await request;
  if (error) throw error;
  return (data ?? []).map(mapShippingMethod);
}
