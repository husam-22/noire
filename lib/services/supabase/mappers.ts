/**
 * NOIRÉ — Supabase row → domain contract mappers.
 *
 * Pure functions (no I/O) so they can be unit-tested and reused by the seed
 * script in reverse. Translations are applied here: a row from
 * `product_translations` for the active locale overrides the English base copy
 * field-by-field, falling back to the base value whenever a translation is null.
 */
import type {
  Category,
  Collection,
  Product,
  ProductColorVariant,
  ProductFAQ,
  ProductOptionVariant,
  ProductSpecification,
  ProductStoryBlock,
  Review,
  ShippingMethod,
} from '@/types';
import type { Json, Tables, TablesInsert, Views } from '@/types/supabase';

type ProductRow = Views<'catalog_products'>;
type ProductTranslationRow = Tables<'product_translations'>;
type CategoryRow = Views<'catalog_categories'>;
type CategoryTranslationRow = Tables<'category_translations'>;
type CollectionRow = Views<'catalog_collections'>;
type CollectionTranslationRow = Tables<'collection_translations'>;

function asArray<T>(value: Json | null | undefined): T[] {
  return Array.isArray(value) ? (value as unknown as T[]) : [];
}

function pick<T>(translated: T | null | undefined, base: T): T {
  if (translated === null || translated === undefined) return base;
  if (typeof translated === 'string' && translated.trim() === '') return base;
  if (Array.isArray(translated) && translated.length === 0) return base;
  return translated;
}

const ORDER_STATUS_TO_DOMAIN: Record<string, string> = {
  craft_calibration: 'Craft & Calibration',
};

/** Maps DB enum values that differ from the (legacy) TypeScript union. */
export function orderStatusFromDb(value: string): string {
  return ORDER_STATUS_TO_DOMAIN[value] ?? value;
}

export function orderStatusToDb(value: string): string {
  return value === 'Craft & Calibration' ? 'craft_calibration' : value;
}

export function mapProduct(row: ProductRow, translation?: ProductTranslationRow | null): Product {
  const t = translation ?? null;
  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    modelNumber: row.model_number,
    name: pick(t?.name, row.name),
    subtitle: pick(t?.subtitle, row.subtitle),
    shortDescription: pick(t?.short_description, row.short_description),
    editorialDescription: pick(t?.editorial_description, row.editorial_description),
    category: row.category_slug,
    categoryName: row.category_name,
    collectionIds: row.collection_ids ?? [],
    price: Number(row.price),
    compareAtPrice: row.compare_at_price === null ? undefined : Number(row.compare_at_price),
    currency: 'USD',
    stockStatus: row.stock_status,
    inventoryCount: row.inventory_count,
    badge: row.badge ?? undefined,
    badgeLabel: row.badge_label ?? undefined,
    featured: row.featured,
    isSpotlight: row.is_spotlight,
    isNewArrival: row.is_new_arrival,
    releaseYear: row.release_year ?? new Date(row.created_at).getFullYear(),
    designedIn: row.designed_in ?? '',
    primaryImage: row.primary_image,
    secondaryImage: row.secondary_image ?? row.primary_image,
    gallery: asArray<Product['gallery'][number]>(row.gallery),
    colors: asArray<ProductColorVariant>(row.colors),
    options: asArray<ProductOptionVariant>(row.options),
    optionGroupLabel: row.option_group_label ?? undefined,
    materials: pick(t?.materials, row.materials ?? []),
    highlights: pick(t?.highlights, row.highlights ?? []),
    specifications: pick(
      t?.specifications ? asArray<ProductSpecification>(t.specifications) : null,
      asArray<ProductSpecification>(row.specifications)
    ),
    storyBlocks: pick(
      t?.story_blocks ? asArray<ProductStoryBlock>(t.story_blocks) : null,
      asArray<ProductStoryBlock>(row.story_blocks)
    ),
    faqs: pick(t?.faqs ? asArray<ProductFAQ>(t.faqs) : null, asArray<ProductFAQ>(row.faqs)),
    shippingEstimate: pick(t?.shipping_estimate, row.shipping_estimate),
    warrantyYears: row.warranty_years,
    relatedProductIds: row.related_product_ids ?? [],
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    seoTitle: pick(t?.seo_title, row.seo_title ?? undefined),
    seoDescription: pick(t?.seo_description, row.seo_description ?? undefined),
    canonicalPath: row.canonical_path ?? undefined,
  };
}

export function mapCategory(row: CategoryRow, translation?: CategoryTranslationRow | null): Category {
  const t = translation ?? null;
  return {
    id: row.id,
    slug: row.slug,
    name: pick(t?.name, row.name),
    shortName: pick(t?.short_name, row.short_name),
    indexNumber: row.index_number,
    description: pick(t?.description, row.description),
    editorialStatement: pick(t?.editorial_statement, row.editorial_statement),
    heroImage: row.hero_image ?? '',
    thumbnailImage: row.thumbnail_image ?? '',
    productCount: Number(row.product_count ?? 0),
    featuredProductSlug: row.featured_product_slug ?? '',
  };
}

export function mapCollection(row: CollectionRow, translation?: CollectionTranslationRow | null): Collection {
  const t = translation ?? null;
  return {
    id: row.id,
    slug: row.slug,
    code: row.code,
    title: pick(t?.title, row.title),
    subtitle: pick(t?.subtitle, row.subtitle),
    description: pick(t?.description, row.description),
    editorialEssay: pick(t?.editorial_essay, row.editorial_essay),
    heroImage: row.hero_image ?? '',
    secondaryImage: row.secondary_image ?? '',
    season: pick(t?.season, row.season),
    productIds: row.product_ids ?? [],
    featured: row.featured,
  };
}

export function mapReview(row: Tables<'reviews'>): Review {
  return {
    id: row.id,
    productId: row.product_id,
    authorName: row.author_name,
    authorLocation: row.author_location,
    authorRole: row.author_role ?? undefined,
    rating: row.rating,
    title: row.title,
    body: row.body,
    verifiedPurchase: row.verified_purchase,
    variantPurchased: row.variant_purchased,
    createdAt: row.created_at,
    helpfulCount: row.helpful_count,
  };
}

export function mapShippingMethod(row: Tables<'shipping_methods'>): ShippingMethod {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    carrier: row.carrier,
    estimatedWindow: row.estimated_window,
    estimatedDispatch: row.estimated_dispatch,
    baseCost: Number(row.base_cost),
    freeAboveSubtotal: row.free_above_subtotal === null ? undefined : Number(row.free_above_subtotal),
    description: row.description,
  };
}

/* ------------------------------------------------------------------------- */
/* Reverse mappers — used by the seed script to load fixtures into Postgres.  */
/* ------------------------------------------------------------------------- */

export function productToRow(product: Product): TablesInsert<'products'> {
  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    model_number: product.modelNumber,
    name: product.name,
    subtitle: product.subtitle,
    short_description: product.shortDescription,
    editorial_description: product.editorialDescription,
    category_id: categoryIdForSlug(product.category),
    price: product.price,
    compare_at_price: product.compareAtPrice ?? null,
    currency: product.currency,
    stock_status: product.stockStatus,
    inventory_count: product.inventoryCount,
    badge: product.badge ?? null,
    badge_label: product.badgeLabel ?? null,
    featured: product.featured,
    is_spotlight: product.isSpotlight ?? false,
    is_new_arrival: product.isNewArrival ?? false,
    release_year: product.releaseYear,
    designed_in: product.designedIn,
    primary_image: product.primaryImage,
    secondary_image: product.secondaryImage,
    gallery: product.gallery as unknown as Json,
    colors: product.colors as unknown as Json,
    options: (product.options ?? []) as unknown as Json,
    option_group_label: product.optionGroupLabel ?? null,
    materials: product.materials,
    highlights: product.highlights,
    specifications: product.specifications as unknown as Json,
    story_blocks: product.storyBlocks as unknown as Json,
    faqs: product.faqs as unknown as Json,
    shipping_estimate: product.shippingEstimate,
    warranty_years: product.warrantyYears,
    seo_title: product.seoTitle ?? null,
    seo_description: product.seoDescription ?? null,
    canonical_path: product.canonicalPath ?? null,
    status: product.status,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  };
}

/** Fixture category ids follow `cat-<short>`; the DB keeps the same ids. */
const CATEGORY_ID_BY_SLUG: Record<Product['category'], string> = {
  audio: 'cat-audio',
  'desk-architecture': 'cat-desk',
  lighting: 'cat-lighting',
  'tactile-input': 'cat-input',
  'travel-carry': 'cat-travel',
  'smart-instruments': 'cat-smart',
};

export function categoryIdForSlug(slug: Product['category']): string {
  return CATEGORY_ID_BY_SLUG[slug];
}

export function categoryToRow(category: Category): TablesInsert<'categories'> {
  return {
    id: category.id,
    slug: category.slug,
    index_number: category.indexNumber,
    name: category.name,
    short_name: category.shortName,
    description: category.description,
    editorial_statement: category.editorialStatement,
    hero_image: category.heroImage,
    thumbnail_image: category.thumbnailImage,
    featured_product_slug: category.featuredProductSlug,
    sort_order: Number(category.indexNumber) || 0,
  };
}

export function collectionToRow(collection: Collection, sortOrder = 0): TablesInsert<'collections'> {
  return {
    id: collection.id,
    slug: collection.slug,
    code: collection.code,
    title: collection.title,
    subtitle: collection.subtitle,
    description: collection.description,
    editorial_essay: collection.editorialEssay,
    hero_image: collection.heroImage,
    secondary_image: collection.secondaryImage,
    season: collection.season,
    featured: collection.featured,
    sort_order: sortOrder,
  };
}

export function shippingMethodToRow(method: ShippingMethod, sortOrder = 0): TablesInsert<'shipping_methods'> {
  return {
    id: method.id,
    code: method.code,
    name: method.name,
    carrier: method.carrier,
    estimated_window: method.estimatedWindow,
    estimated_dispatch: method.estimatedDispatch,
    base_cost: method.baseCost,
    free_above_subtotal: method.freeAboveSubtotal ?? null,
    description: method.description,
    active: true,
    sort_order: sortOrder,
  };
}
