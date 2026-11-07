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
import type { Enums, Json, Tables, TablesInsert, Views } from '@/types/supabase';

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

export function orderStatusToDb(value: string): Enums<'order_status'> {
  return (value === 'Craft & Calibration' ? 'craft_calibration' : value) as Enums<'order_status'>;
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

/* ------------------------------------------------------------------------- */
/* Journal, discounts, addresses, orders, customers                           */
/* ------------------------------------------------------------------------- */

import type {
  Address,
  Customer,
  Discount,
  JournalArticle,
  Order,
  OrderItem,
  OrderTimelineEvent,
  PaymentSummary,
} from '@/types';

export function mapJournalArticle(row: Tables<'journal_articles'>): JournalArticle {
  return {
    id: row.id,
    slug: row.slug,
    issueNumber: row.issue_number,
    category: row.category as JournalArticle['category'],
    title: row.title,
    subtitle: row.subtitle,
    excerpt: row.excerpt,
    coverImage: row.cover_image ?? '',
    author: { name: row.author_name, role: row.author_role },
    publishedAt: row.published_at ?? row.created_at,
    readingTimeMinutes: row.reading_time_minutes,
    featured: row.featured,
    relatedProductIds: row.related_product_ids ?? [],
    content: row.content ?? [],
  };
}

export function journalArticleToRow(article: JournalArticle): TablesInsert<'journal_articles'> {
  return {
    id: article.id,
    slug: article.slug,
    issue_number: article.issueNumber,
    category: article.category,
    title: article.title,
    subtitle: article.subtitle,
    excerpt: article.excerpt,
    cover_image: article.coverImage || null,
    author_name: article.author.name,
    author_role: article.author.role,
    published_at: article.publishedAt,
    reading_time_minutes: article.readingTimeMinutes,
    featured: article.featured,
    related_product_ids: article.relatedProductIds,
    content: article.content,
    status: 'active',
  };
}

export function mapDiscount(row: Tables<'discounts'>): Discount {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    type: row.type,
    value: Number(row.value),
    minOrderAmount: row.min_order_amount === null ? undefined : Number(row.min_order_amount),
    usageCount: row.usage_count,
    usageLimit: row.usage_limit ?? undefined,
    status: row.status,
    startsAt: row.starts_at,
    expiresAt: row.expires_at ?? undefined,
  };
}

export function discountToRow(discount: Omit<Discount, 'id' | 'usageCount'> & { id?: string }): TablesInsert<'discounts'> {
  return {
    ...(discount.id ? { id: discount.id } : {}),
    code: discount.code.trim().toUpperCase(),
    description: discount.description,
    type: discount.type,
    value: discount.value,
    min_order_amount: discount.minOrderAmount ?? null,
    usage_limit: discount.usageLimit ?? null,
    status: discount.status,
    starts_at: discount.startsAt,
    expires_at: discount.expiresAt ?? null,
  };
}

export function mapAddress(row: Tables<'addresses'>): Address {
  return {
    id: row.id,
    label: row.label,
    firstName: row.first_name,
    lastName: row.last_name,
    company: row.company ?? undefined,
    line1: row.line1,
    line2: row.line2 ?? undefined,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country,
    phone: row.phone,
    isDefaultShipping: row.is_default_shipping,
    isDefaultBilling: row.is_default_billing,
  };
}

export function addressToRow(profileId: string, address: Omit<Address, 'id'> & { id?: string }): TablesInsert<'addresses'> {
  return {
    ...(address.id ? { id: address.id } : {}),
    profile_id: profileId,
    label: address.label || 'Primary',
    first_name: address.firstName,
    last_name: address.lastName,
    company: address.company || null,
    line1: address.line1,
    line2: address.line2 || null,
    city: address.city,
    state: address.state,
    postal_code: address.postalCode,
    country: address.country,
    phone: address.phone,
    is_default_shipping: address.isDefaultShipping,
    is_default_billing: address.isDefaultBilling,
  };
}

/** Address snapshots stored on orders are plain JSON copies of `Address`. */
function addressFromSnapshot(value: Json | null): Address {
  const v = (value && typeof value === 'object' && !Array.isArray(value) ? value : {}) as Record<string, Json | undefined>;
  const str = (k: string) => (typeof v[k] === 'string' ? (v[k] as string) : '');
  return {
    id: str('id'),
    label: str('label'),
    firstName: str('firstName'),
    lastName: str('lastName'),
    company: str('company') || undefined,
    line1: str('line1'),
    line2: str('line2') || undefined,
    city: str('city'),
    state: str('state'),
    postalCode: str('postalCode'),
    country: str('country'),
    phone: str('phone'),
    isDefaultShipping: v.isDefaultShipping === true,
    isDefaultBilling: v.isDefaultBilling === true,
  };
}

export function paymentMethodLabel(order: Pick<Tables<'orders'>, 'payment_method_type' | 'payment_brand' | 'payment_last4'>): string {
  switch (order.payment_method_type) {
    case 'cash_on_delivery':
      return 'Cash on delivery';
    case 'bank_transfer':
      return 'Bank transfer';
    case 'wire_transfer':
      return 'Wire transfer';
    case 'apple_pay':
      return order.payment_last4 ? `Apple Pay •••• ${order.payment_last4}` : 'Apple Pay';
    case 'card':
      return order.payment_last4 ? `${order.payment_brand ?? 'Card'} •••• ${order.payment_last4}` : order.payment_brand ?? 'Card';
    default:
      return 'Manual settlement';
  }
}

export function mapOrderItem(row: Tables<'order_items'>): OrderItem {
  const finish = row.selected_finish as { id?: string; name?: string; hex?: string } | null;
  const option = row.selected_option as { id?: string; label?: string; priceDelta?: number } | null;
  return {
    id: row.id,
    productId: row.product_id ?? '',
    productSlug: row.product_slug,
    productName: row.product_name,
    modelNumber: row.model_number,
    sku: row.sku,
    variantName: row.variant_name,
    selectedFinish: finish && finish.id ? { id: finish.id, name: finish.name ?? '', hex: finish.hex ?? '#000000' } : undefined,
    selectedOption: option && option.id ? { id: option.id, label: option.label ?? '', priceDelta: Number(option.priceDelta ?? 0) } : undefined,
    image: row.image ?? '',
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
    totalPrice: Number(row.total_price),
  };
}

export function mapOrderEvent(row: Tables<'order_events'>): OrderTimelineEvent {
  return {
    id: row.id,
    status: orderStatusFromDb(row.status),
    description: row.description,
    location: row.location ?? undefined,
    timestamp: row.created_at,
    completed: row.completed,
  };
}

export function mapOrder(
  row: Tables<'orders'>,
  items: Tables<'order_items'>[] = [],
  events: Tables<'order_events'>[] = []
): Order {
  const shippingMethod = row.shipping_method as unknown as Tables<'shipping_methods'> | null;
  const paymentSummary: PaymentSummary | undefined = row.payment_method_type
    ? {
        provider: row.payment_provider,
        methodType: row.payment_method_type,
        brand: row.payment_brand ?? '',
        last4: row.payment_last4 ?? '',
        cardholderName: row.payment_cardholder ?? '',
      }
    : undefined;
  const subtotal = Number(row.subtotal);
  const discountAmount = Number(row.discount_amount);
  const shippingCost = Number(row.shipping_cost);
  const taxAmount = Number(row.tax_amount);
  const total = Number(row.total);

  return {
    id: row.id,
    orderNumber: row.order_number,
    allocationReference: row.allocation_reference ?? undefined,
    customerId: row.profile_id ?? 'guest',
    customer: {
      firstName: row.customer_first_name,
      lastName: row.customer_last_name,
      email: row.customer_email,
      phone: row.customer_phone ?? '',
    },
    customerName: `${row.customer_first_name} ${row.customer_last_name}`.trim(),
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone ?? undefined,
    status: orderStatusFromDb(row.status) as Order['status'],
    paymentStatus: row.payment_status,
    paymentMethod: paymentMethodLabel(row),
    paymentSummary,
    shippingMethod: shippingMethod ? mapShippingMethod({ ...shippingMethod, countries: shippingMethod.countries ?? null }) : undefined,
    totals: { subtotal, discountAmount, shippingCost, taxAmount, total, currency: 'USD' },
    items: items.map(mapOrderItem),
    subtotal,
    shippingCost,
    taxAmount,
    discountAmount,
    discountCode: row.discount_code ?? undefined,
    total,
    currency: 'USD',
    shippingAddress: addressFromSnapshot(row.shipping_address),
    billingAddress: addressFromSnapshot(row.billing_address),
    carrier: row.carrier ?? undefined,
    trackingNumber: row.tracking_number ?? undefined,
    estimatedDispatch: row.estimated_dispatch ?? undefined,
    estimatedDelivery: row.estimated_delivery ?? undefined,
    timeline: events.map(mapOrderEvent),
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Shape returned by the `get_order_receipt` RPC. */
export interface OrderReceiptPayload {
  order: Tables<'orders'>;
  items: Tables<'order_items'>[];
  events: Tables<'order_events'>[];
}

export function mapOrderReceipt(payload: Json | null): Order | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const receipt = payload as unknown as OrderReceiptPayload;
  if (!receipt.order) return null;
  return mapOrder(receipt.order, receipt.items ?? [], receipt.events ?? []);
}

type ProfilePreferences = Partial<Customer['preferences'] & { disciplines: string[] }>;

export function profilePreferences(value: Json | null): Customer['preferences'] & { disciplines: string[] } {
  const v = (value && typeof value === 'object' && !Array.isArray(value) ? value : {}) as ProfilePreferences;
  const currency = v.preferredCurrency;
  return {
    newsletter: v.newsletter === true,
    privateReleases: v.privateReleases === true,
    smsUpdates: v.smsUpdates === true,
    preferredCurrency: currency === 'EUR' || currency === 'GBP' || currency === 'JPY' ? currency : 'USD',
    disciplines: Array.isArray(v.disciplines) ? v.disciplines.filter((d): d is string => typeof d === 'string') : [],
  };
}

export function mapCustomer(row: Views<'admin_customers'>, addresses: Tables<'addresses'>[] = []): Customer {
  const ordersCount = Number(row.orders_count ?? 0);
  const totalSpent = Number(row.total_spent ?? 0);
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: `${row.first_name} ${row.last_name}`.trim() || row.email,
    email: row.email,
    phone: row.phone ?? '',
    avatar: row.avatar_url ?? undefined,
    location: row.location ?? '',
    status: row.status,
    tier: row.tier,
    ordersCount,
    totalSpent,
    averageOrderValue: ordersCount > 0 ? Math.round((totalSpent / ordersCount) * 100) / 100 : 0,
    lastOrderDate: row.last_order_at ?? '',
    joinedAt: row.created_at,
    addresses: addresses.map(mapAddress),
    wishlistProductIds: [],
    notes: row.notes ?? undefined,
    preferences: profilePreferences(row.preferences),
  };
}
