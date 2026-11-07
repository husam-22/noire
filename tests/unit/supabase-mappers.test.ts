import { describe, expect, it } from 'vitest';
import { MOCK_CATEGORIES, MOCK_COLLECTIONS, MOCK_PRODUCTS, SEED_SHIPPING_METHODS } from '@/lib/data';

import {
  categoryIdForSlug,
  categoryToRow,
  collectionToRow,
  mapCategory,
  mapCollection,
  mapProduct,
  mapShippingMethod,
  orderStatusFromDb,
  orderStatusToDb,
  productToRow,
  shippingMethodToRow,
} from '@/lib/services/supabase/mappers';
import type { Views } from '@/types/supabase';

/** Simulates what the `catalog_products` view returns for a seeded fixture. */
function viewRowFor(product: (typeof MOCK_PRODUCTS)[number]): Views<'catalog_products'> {
  const row = productToRow(product);
  const category = MOCK_CATEGORIES.find((c) => c.slug === product.category)!;
  return {
    ...(row as Required<typeof row>),
    low_stock_threshold: 5,
    category_slug: product.category,
    category_name: category.name,
    collection_ids: product.collectionIds,
    related_product_ids: product.relatedProductIds,
  } as Views<'catalog_products'>;
}

describe('supabase mappers — products', () => {
  it('round-trips every fixture product through productToRow → mapProduct', () => {
    for (const product of MOCK_PRODUCTS) {
      const mapped = mapProduct(viewRowFor(product));
      // Fields the DB owns differently are normalised; everything else must survive untouched.
      const expected = { ...product, categoryName: undefined };
      const actual = { ...mapped, categoryName: undefined };
      expect(actual).toMatchObject({
        ...expected,
        options: product.options ?? [],
        isSpotlight: product.isSpotlight ?? false,
        isNewArrival: product.isNewArrival ?? false,
      });
      expect(mapped.categoryName).toBe(MOCK_CATEGORIES.find((c) => c.slug === product.category)!.name);
    }
  });

  it('applies locale translations field-by-field with fallback', () => {
    const product = MOCK_PRODUCTS[0];
    const mapped = mapProduct(viewRowFor(product), {
      product_id: product.id,
      locale: 'ar',
      name: 'سماعات أثير',
      subtitle: null,
      short_description: '',
      editorial_description: null,
      highlights: [],
      materials: ['تيتانيوم'],
      specifications: null,
      story_blocks: null,
      faqs: null,
      shipping_estimate: null,
      seo_title: null,
      seo_description: null,
    });
    expect(mapped.name).toBe('سماعات أثير');
    expect(mapped.subtitle).toBe(product.subtitle); // null → fallback
    expect(mapped.shortDescription).toBe(product.shortDescription); // '' → fallback
    expect(mapped.highlights).toEqual(product.highlights); // [] → fallback
    expect(mapped.materials).toEqual(['تيتانيوم']);
    expect(mapped.specifications).toEqual(product.specifications);
  });

  it('maps fixture category slugs to the seeded category ids', () => {
    for (const category of MOCK_CATEGORIES) {
      expect(categoryIdForSlug(category.slug)).toBe(category.id);
    }
  });
});

describe('supabase mappers — categories & collections', () => {
  it('round-trips categories and derives productCount from the view', () => {
    for (const category of MOCK_CATEGORIES) {
      const row = { ...categoryToRow(category), product_count: 3 } as Views<'catalog_categories'>;
      const mapped = mapCategory(row);
      expect(mapped).toMatchObject({ ...category, productCount: 3 });
    }
  });

  it('round-trips collections with product ids coming from the join table', () => {
    for (const collection of MOCK_COLLECTIONS) {
      const row = { ...collectionToRow(collection), product_ids: collection.productIds } as Views<'catalog_collections'>;
      expect(mapCollection(row)).toMatchObject(collection);
    }
  });

  it('prefers Arabic translations when present', () => {
    const category = MOCK_CATEGORIES[0];
    const row = { ...categoryToRow(category), product_count: 0 } as Views<'catalog_categories'>;
    const mapped = mapCategory(row, {
      category_id: category.id,
      locale: 'ar',
      name: 'صوتيات',
      short_name: null,
      description: null,
      editorial_statement: null,
    });
    expect(mapped.name).toBe('صوتيات');
    expect(mapped.shortName).toBe(category.shortName);
  });
});

describe('supabase mappers — shipping & enums', () => {
  it('round-trips shipping methods', () => {
    for (const method of SEED_SHIPPING_METHODS) {
      const row = { ...shippingMethodToRow(method), countries: null } as Parameters<typeof mapShippingMethod>[0];
      expect(mapShippingMethod(row)).toMatchObject(method);
    }
  });

  it('translates the legacy "Craft & Calibration" order status', () => {
    expect(orderStatusToDb('Craft & Calibration')).toBe('craft_calibration');
    expect(orderStatusFromDb('craft_calibration')).toBe('Craft & Calibration');
    expect(orderStatusFromDb('shipped')).toBe('shipped');
  });
});
