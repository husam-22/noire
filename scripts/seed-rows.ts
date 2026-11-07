/**
 * NOIRÉ — seed row builder (shared by `db:seed` and `db:seed:sql`).
 *
 * Turns the fixture catalog + Arabic catalog messages into plain row objects
 * keyed by table, in FK-safe order. Keeping this free of any Supabase client
 * lets the same data be loaded through supabase-js (service role) *or*
 * emitted as idempotent SQL for the dashboard SQL Editor / CLI.
 */
import type { TablesInsert } from '../types/supabase';
import { MOCK_CATEGORIES, MOCK_COLLECTIONS, MOCK_JOURNAL_ARTICLES, MOCK_PRODUCTS, MOCK_DISCOUNTS, SEED_SHIPPING_METHODS } from '../lib/data';

import {
  categoryToRow,
  collectionToRow,
  productToRow,
  shippingMethodToRow,
} from '../lib/services/supabase/mappers';
import arMessages from '../messages/ar.json';

type ArCatalog = {
  categories?: Record<string, { name?: string; shortName?: string; description?: string; editorialStatement?: string }>;
  collections?: Record<string, { title?: string; subtitle?: string; description?: string; season?: string }>;
};

export type SeedTable =
  | 'categories'
  | 'collections'
  | 'products'
  | 'product_collections'
  | 'product_relations'
  | 'category_translations'
  | 'collection_translations'
  | 'journal_articles'
  | 'shipping_methods'
  | 'discounts'
  | 'settings';

export interface SeedBatch<T extends SeedTable = SeedTable> {
  table: T;
  /** Column(s) that identify a row — used for `ON CONFLICT` / `onConflict`. */
  conflict: string;
  rows: TablesInsert<T>[];
}

export function buildSeedBatches(): SeedBatch[] {
  const productCollections: TablesInsert<'product_collections'>[] = [];
  const seen = new Set<string>();
  for (const product of MOCK_PRODUCTS) {
    product.collectionIds.forEach((collectionId, i) => {
      const key = `${product.id}:${collectionId}`;
      if (!seen.has(key)) {
        seen.add(key);
        productCollections.push({ product_id: product.id, collection_id: collectionId, sort_order: i });
      }
    });
  }
  for (const collection of MOCK_COLLECTIONS) {
    collection.productIds.forEach((productId, i) => {
      const key = `${productId}:${collection.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        productCollections.push({ product_id: productId, collection_id: collection.id, sort_order: i });
      }
    });
  }

  const relations: TablesInsert<'product_relations'>[] = MOCK_PRODUCTS.flatMap((p) =>
    p.relatedProductIds
      .filter((id) => id !== p.id)
      .map((related, i) => ({ product_id: p.id, related_product_id: related, sort_order: i }))
  );

  const ar = (arMessages as { catalog?: ArCatalog }).catalog ?? {};
  const categoryTranslations: TablesInsert<'category_translations'>[] = MOCK_CATEGORIES.flatMap((c) => {
    const t = ar.categories?.[c.slug];
    return t
      ? [
          {
            category_id: c.id,
            locale: 'ar' as const,
            name: t.name ?? null,
            short_name: t.shortName ?? null,
            description: t.description ?? null,
            editorial_statement: t.editorialStatement ?? null,
          },
        ]
      : [];
  });
  const collectionTranslations: TablesInsert<'collection_translations'>[] = MOCK_COLLECTIONS.flatMap((c) => {
    const t = ar.collections?.[c.slug];
    return t
      ? [
          {
            collection_id: c.id,
            locale: 'ar' as const,
            title: t.title ?? null,
            subtitle: t.subtitle ?? null,
            description: t.description ?? null,
            editorial_essay: null,
            season: t.season ?? null,
          },
        ]
      : [];
  });

  const journal: TablesInsert<'journal_articles'>[] = MOCK_JOURNAL_ARTICLES.map((a) => ({
    id: a.id,
    slug: a.slug,
    issue_number: a.issueNumber,
    category: a.category,
    title: a.title,
    subtitle: a.subtitle,
    excerpt: a.excerpt,
    cover_image: a.coverImage,
    author_name: a.author.name,
    author_role: a.author.role,
    published_at: a.publishedAt,
    reading_time_minutes: a.readingTimeMinutes,
    featured: a.featured,
    related_product_ids: a.relatedProductIds,
    content: a.content,
    status: 'active' as const,
  }));

  const discounts: TablesInsert<'discounts'>[] = MOCK_DISCOUNTS.map((d) => ({
    code: d.code,
    description: d.description,
    type: d.type,
    value: d.value,
    min_order_amount: d.minOrderAmount ?? null,
    usage_limit: d.usageLimit ?? null,
    status: d.status,
    starts_at: d.startsAt,
    expires_at: d.expiresAt ?? null,
  }));

  const settings: TablesInsert<'settings'>[] = [
    { key: 'store.name', value: 'NOIRÉ' },
    { key: 'store.currency', value: 'USD' },
    { key: 'store.free_shipping_threshold', value: 500 },
    { key: 'store.tax.enabled', value: false },
    { key: 'store.support_email', value: '' },
    { key: 'store.support_phone', value: '' },
    { key: 'checkout.payment_provider', value: 'manual' },
    { key: 'payments.cash_on_delivery_enabled', value: true },
    { key: 'payments.bank_transfer_enabled', value: true },
    { key: 'payments.bank_transfer_instructions', value: '' },
    { key: 'content.announcement', value: '' },
    { key: 'content.featured_collection_id', value: null },
  ];

  return [
    { table: 'categories', conflict: 'id', rows: MOCK_CATEGORIES.map(categoryToRow) },
    { table: 'collections', conflict: 'id', rows: MOCK_COLLECTIONS.map((c, i) => collectionToRow(c, i)) },
    { table: 'products', conflict: 'id', rows: MOCK_PRODUCTS.map(productToRow) },
    { table: 'product_collections', conflict: 'product_id,collection_id', rows: productCollections },
    { table: 'product_relations', conflict: 'product_id,related_product_id', rows: relations },
    { table: 'category_translations', conflict: 'category_id,locale', rows: categoryTranslations },
    { table: 'collection_translations', conflict: 'collection_id,locale', rows: collectionTranslations },
    { table: 'journal_articles', conflict: 'id', rows: journal },
    { table: 'shipping_methods', conflict: 'id', rows: SEED_SHIPPING_METHODS.map((m, i) => shippingMethodToRow(m, i)) },
    { table: 'discounts', conflict: 'code', rows: discounts },
    { table: 'settings', conflict: 'key', rows: settings },
  ];
}
