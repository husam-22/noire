import type {
  Product,
  CategorySlug,
  StockStatus,
  SortOption,
  Collection,
} from '@/types';

export type ShopCategoryFilter = CategorySlug | 'all' | 'essentials';

export type ShopViewMode = 'editorial' | 'grid-3' | 'grid-2';

export interface ShopFilterState {
  category: ShopCategoryFilter;
  collection: string; // collection slug or ''
  query: string;
  minPrice: number | null;
  maxPrice: number | null;
  stockStatus: StockStatus[];
  colors: string[];
  sort: SortOption;
  view: ShopViewMode;
  page: number;
  limit: number;
}

export const DEFAULT_SHOP_FILTERS: ShopFilterState = {
  category: 'all',
  collection: '',
  query: '',
  minPrice: null,
  maxPrice: null,
  stockStatus: [],
  colors: [],
  sort: 'featured',
  view: 'editorial',
  page: 1,
  limit: 8,
};

export const CATALOG_PRICE_BOUNDS = {
  min: 100,
  max: 1700,
} as const;

export const PRICE_PRESETS: Array<{
  id: string;
  label: string;
  min: number | null;
  max: number | null;
}> = [
  { id: 'all', label: 'All Price Tiers', min: null, max: null },
  { id: 'under-350', label: 'Under $350', min: null, max: 350 },
  { id: '350-700', label: '$350 – $700', min: 350, max: 700 },
  { id: 'over-700', label: '$700 & Above', min: 700, max: null },
];

export const FINISH_FAMILIES: Array<{
  id: string;
  label: string;
  hex: string;
  matchTerms: string[];
}> = [
  {
    id: 'Obsidian',
    label: 'Obsidian Carbon',
    hex: '#161615',
    matchTerms: ['obsidian'],
  },
  {
    id: 'Titanium',
    label: 'Raw & Satin Titanium',
    hex: '#ABA79E',
    matchTerms: ['titanium', 'natural billet'],
  },
  {
    id: 'Bronze',
    label: 'Warm Bronze',
    hex: '#8C735B',
    matchTerms: ['bronze', 'aged brass'],
  },
  {
    id: 'Brass',
    label: 'Machined Brass & Stone',
    hex: '#9E825C',
    matchTerms: ['raw brass', 'machined brass', 'alabaster'],
  },
  {
    id: 'Walnut',
    label: 'Walnut & Smoked Oak',
    hex: '#594233',
    matchTerms: ['walnut', 'oak'],
  },
  {
    id: 'Stainless',
    label: '316L Surgical Steel',
    hex: '#B5B2AA',
    matchTerms: ['stainless'],
  },
];

export const STOCK_STATUS_OPTIONS: Array<{
  value: StockStatus;
  label: string;
  code: string;
}> = [
  {
    value: 'in_stock',
    label: 'In Stock',
    code: 'IMM',
  },
  {
    value: 'low_stock',
    label: 'Limited Batch Allocation',
    code: 'LTD',
  },
  {
    value: 'pre_order',
    label: 'Pre-Order Allocation',
    code: 'PRE',
  },
];

export const SORT_OPTIONS: Array<{
  value: SortOption;
  label: string;
}> = [
  { value: 'featured', label: 'Featured Archive Order' },
  { value: 'newest', label: 'Newest Releases' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A — Z' },
];

/**
 * Normalizes incoming category query parameters, supporting both canonical slugs
 * ('audio', 'desk-architecture', 'lighting', 'tactile-input', 'travel-carry', 'smart-instruments')
 * and shorthand aliases ('desk', 'travel', 'input', 'instruments', 'essentials').
 */
export function normalizeCategoryParam(
  raw: string | null | undefined
): ShopCategoryFilter {
  if (!raw) return 'all';
  const cleaned = raw.toLowerCase().trim();
  switch (cleaned) {
    case 'audio':
      return 'audio';
    case 'desk':
    case 'desk-architecture':
      return 'desk-architecture';
    case 'lighting':
      return 'lighting';
    case 'input':
    case 'tactile':
    case 'tactile-input':
      return 'tactile-input';
    case 'travel':
    case 'carry':
    case 'travel-carry':
      return 'travel-carry';
    case 'smart':
    case 'instruments':
    case 'smart-instruments':
      return 'smart-instruments';
    case 'essentials':
      return 'essentials';
    default:
      return 'all';
  }
}

/**
 * Checks whether a product belongs to the "Essentials" curation
 * (Everyday studio, desk, and field essentials under $400).
 */
export function isEssentialProduct(product: Product): boolean {
  return (
    product.price <= 400 ||
    product.category === 'travel-carry' ||
    product.category === 'desk-architecture' ||
    product.id === 'prod-06' ||
    product.id === 'prod-10'
  );
}

/**
 * Checks whether a product matches any of the selected finish families.
 */
export function productMatchesColors(
  product: Product,
  selectedColorIds: string[]
): boolean {
  if (selectedColorIds.length === 0) return true;

  return selectedColorIds.some((familyId) => {
    const family = FINISH_FAMILIES.find(
      (f) => f.id.toLowerCase() === familyId.toLowerCase()
    );
    const terms = family
      ? family.matchTerms
      : [familyId.toLowerCase()];

    return product.colors.some((c) => {
      const target = `${c.name} ${c.finish}`.toLowerCase();
      return terms.some((term) => target.includes(term));
    });
  });
}

/**
 * Pure filtering and sorting engine used for instant facet counts,
 * staged mobile drawer previews, and client/service synchronization.
 */
export function filterAndSortProducts(
  products: Product[],
  filters: Omit<ShopFilterState, 'page' | 'limit' | 'view'>,
  collections: Collection[] = []
): Product[] {
  let result = products.filter((p) => p.status === 'active');

  // 1. Category filter
  if (filters.category && filters.category !== 'all') {
    if (filters.category === 'essentials') {
      result = result.filter(isEssentialProduct);
    } else {
      result = result.filter((p) => p.category === filters.category);
    }
  }

  // 2. Collection filter
  if (filters.collection) {
    const targetCol = collections.find(
      (c) => c.slug === filters.collection || c.id === filters.collection
    );
    if (targetCol) {
      result = result.filter(
        (p) =>
          p.collectionIds.includes(targetCol.id) ||
          targetCol.productIds.includes(p.id)
      );
    }
  }

  // 3. Search query filter (matches name, modelNumber, sku, descriptions, category, materials, highlights, specifications)
  if (filters.query && filters.query.trim().length > 0) {
    const q = filters.query.toLowerCase().trim();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.modelNumber.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.editorialDescription.toLowerCase().includes(q) ||
        p.materials.some((m) => m.toLowerCase().includes(q)) ||
        p.highlights.some((h) => h.toLowerCase().includes(q)) ||
        p.specifications.some(
          (s) =>
            s.label.toLowerCase().includes(q) ||
            s.value.toLowerCase().includes(q)
        )
    );
  }

  // 4. Minimum & Maximum Price filter
  if (typeof filters.minPrice === 'number' && !Number.isNaN(filters.minPrice)) {
    result = result.filter((p) => p.price >= filters.minPrice!);
  }
  if (typeof filters.maxPrice === 'number' && !Number.isNaN(filters.maxPrice)) {
    result = result.filter((p) => p.price <= filters.maxPrice!);
  }

  // 5. Availability / Stock Status filter
  if (filters.stockStatus.length > 0) {
    result = result.filter((p) =>
      filters.stockStatus.includes(p.stockStatus)
    );
  }

  // 6. Finish / Color filter
  if (filters.colors.length > 0) {
    result = result.filter((p) => productMatchesColors(p, filters.colors));
  }

  // 7. Sorting
  result.sort((a, b) => {
    switch (filters.sort) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'newest':
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'featured':
      default:
        if (Number(b.featured) !== Number(a.featured)) {
          return Number(b.featured) - Number(a.featured);
        }
        return a.id.localeCompare(b.id);
    }
  });

  return result;
}

/**
 * Counts how many active filters are currently applied (excluding sort, view, and page).
 */
export function countActiveFilters(filters: ShopFilterState): number {
  let count = 0;
  if (filters.category !== 'all') count += 1;
  if (filters.collection) count += 1;
  if (filters.query.trim().length > 0) count += 1;
  if (filters.minPrice !== null || filters.maxPrice !== null) count += 1;
  count += filters.stockStatus.length;
  count += filters.colors.length;
  return count;
}
