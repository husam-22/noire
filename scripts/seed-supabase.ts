/**
 * NOIRÉ — Supabase seed.
 *
 * Loads the fixture catalog (products, categories, collections, journal,
 * shipping methods, demo discounts) plus the Arabic catalog translations from
 * `messages/ar.json` into a Supabase project. Idempotent: every write is an
 * upsert keyed on the fixture id, so it is safe to re-run after editing fixtures.
 *
 * Usage:
 *   cp .env.example .env.local   # fill NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *   npm run db:seed
 *
 * Optional: SEED_ADMIN_EMAIL=you@example.com promotes that (already signed-up)
 * user to the `admin` role.
 */
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database, TablesInsert } from '../types/supabase';
import { MOCK_CATEGORIES, MOCK_COLLECTIONS, MOCK_JOURNAL_ARTICLES, MOCK_PRODUCTS, MOCK_DISCOUNTS } from '../lib/data';
import { DEFAULT_SHIPPING_METHODS } from '../lib/mock-api';
import {
  categoryToRow,
  collectionToRow,
  productToRow,
  shippingMethodToRow,
} from '../lib/services/supabase/mappers';
import arMessages from '../messages/ar.json';

loadEnv({ path: '.env.local' });
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('✖ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (see .env.example).');
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function assertOk<T>(label: string, result: { error: { message: string } | null; data?: T }): T | undefined {
  if (result.error) {
    throw new Error(`${label} failed: ${result.error.message}`);
  }
  console.log(`✔ ${label}`);
  return result.data;
}

type ArCatalog = {
  categories?: Record<string, { name?: string; shortName?: string; description?: string; editorialStatement?: string }>;
  collections?: Record<string, { title?: string; subtitle?: string; description?: string; season?: string }>;
};

async function main() {
  console.log(`→ Seeding ${url}`);

  // 1. Categories
  assertOk(
    'categories',
    await supabase.from('categories').upsert(MOCK_CATEGORIES.map(categoryToRow), { onConflict: 'id' })
  );

  // 2. Collections
  assertOk(
    'collections',
    await supabase
      .from('collections')
      .upsert(MOCK_COLLECTIONS.map((c, i) => collectionToRow(c, i)), { onConflict: 'id' })
  );

  // 3. Products (relations after, because of FK order)
  assertOk('products', await supabase.from('products').upsert(MOCK_PRODUCTS.map(productToRow), { onConflict: 'id' }));

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
  assertOk(
    'product_collections',
    await supabase.from('product_collections').upsert(productCollections, { onConflict: 'product_id,collection_id' })
  );

  const relations: TablesInsert<'product_relations'>[] = MOCK_PRODUCTS.flatMap((p) =>
    p.relatedProductIds
      .filter((id) => id !== p.id)
      .map((related, i) => ({ product_id: p.id, related_product_id: related, sort_order: i }))
  );
  assertOk(
    'product_relations',
    await supabase.from('product_relations').upsert(relations, { onConflict: 'product_id,related_product_id' })
  );

  // 4. Arabic catalog translations (from messages/ar.json → catalog.*)
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
  assertOk(
    'category_translations (ar)',
    await supabase.from('category_translations').upsert(categoryTranslations, { onConflict: 'category_id,locale' })
  );

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
  assertOk(
    'collection_translations (ar)',
    await supabase
      .from('collection_translations')
      .upsert(collectionTranslations, { onConflict: 'collection_id,locale' })
  );

  // 5. Journal
  assertOk(
    'journal_articles',
    await supabase.from('journal_articles').upsert(
      MOCK_JOURNAL_ARTICLES.map((a) => ({
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
      })),
      { onConflict: 'id' }
    )
  );

  // 6. Shipping methods + demo discounts
  assertOk(
    'shipping_methods',
    await supabase
      .from('shipping_methods')
      .upsert(DEFAULT_SHIPPING_METHODS.map((m, i) => shippingMethodToRow(m, i)), { onConflict: 'id' })
  );

  assertOk(
    'discounts',
    await supabase.from('discounts').upsert(
      MOCK_DISCOUNTS.map((d) => ({
        code: d.code,
        description: d.description,
        type: d.type,
        value: d.value,
        min_order_amount: d.minOrderAmount ?? null,
        usage_limit: d.usageLimit ?? null,
        status: d.status,
        starts_at: d.startsAt,
        expires_at: d.expiresAt ?? null,
      })),
      { onConflict: 'code' }
    )
  );

  // 7. Default settings
  assertOk(
    'settings',
    await supabase.from('settings').upsert(
      [
        { key: 'store.currency', value: 'USD' },
        { key: 'store.free_shipping_threshold', value: 500 },
        { key: 'store.tax.enabled', value: false },
        { key: 'checkout.payment_provider', value: 'demo' },
      ],
      { onConflict: 'key' }
    )
  );

  // 8. Optional admin promotion
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('email', adminEmail)
      .select('id');
    if (error) throw error;
    if (!data?.length) {
      console.warn(`⚠ SEED_ADMIN_EMAIL=${adminEmail} has no profile yet — sign up once, then re-run the seed.`);
    } else {
      console.log(`✔ promoted ${adminEmail} to admin`);
    }
  }

  console.log('✓ Seed complete.');
}

main().catch((error) => {
  console.error('✖ Seed failed:', error);
  process.exit(1);
});
