'use client';

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter, usePathname } from '@/i18n/navigation';
import { Container } from '@/components/layout';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { fetchProductsAction } from '@/lib/actions/commerce';
import { ShopIntro } from './shop-intro';
import { ShopToolbar } from './shop-toolbar';
import { ShopFilterSidebar } from './shop-filter-sidebar';
import { MobileFilterDrawer } from './mobile-filter-drawer';
import { ShopProductGrid } from './shop-product-grid';
import { ShopPagination } from './shop-pagination';
import {
  DEFAULT_SHOP_FILTERS,
  normalizeCategoryParam,
  filterAndSortProducts,
  type ShopFilterState,
  type ShopCategoryFilter,
  type ShopViewMode,
} from './shop-filter-utils';
import type {
  Category,
  Collection,
  Product,
  SortOption,
  StockStatus,
} from '@/types';

interface ShopExperienceProps {
  initialProducts: Product[];
  categories: Category[];
  collections: Collection[];
}

function parseFiltersFromSearchParams(
  searchParams: URLSearchParams
): ShopFilterState {
  const rawCategory = searchParams.get('category');
  const category = normalizeCategoryParam(rawCategory);

  const collection = searchParams.get('collection')?.trim() || '';
  const query =
    searchParams.get('query')?.trim() ||
    searchParams.get('q')?.trim() ||
    '';

  const minPriceParam = searchParams.get('minPrice');
  const maxPriceParam = searchParams.get('maxPrice');
  const minPrice =
    minPriceParam !== null &&
    minPriceParam !== '' &&
    !Number.isNaN(Number(minPriceParam))
      ? Number(minPriceParam)
      : null;
  const maxPrice =
    maxPriceParam !== null &&
    maxPriceParam !== '' &&
    !Number.isNaN(Number(maxPriceParam))
      ? Number(maxPriceParam)
      : null;

  const stockParam = searchParams.get('stock');
  const validStockValues: StockStatus[] = [
    'in_stock',
    'low_stock',
    'pre_order',
    'out_of_stock',
  ];
  const stockStatus = stockParam
    ? stockParam
        .split(',')
        .map((s) => s.trim() as StockStatus)
        .filter((s) => validStockValues.includes(s))
    : [];

  const colorsParam = searchParams.get('colors');
  const colors = colorsParam
    ? colorsParam
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)
    : [];

  const sortParam = searchParams.get('sort') as SortOption | null;
  const validSorts: SortOption[] = [
    'featured',
    'newest',
    'price-asc',
    'price-desc',
    'name-asc',
  ];
  const sort: SortOption =
    sortParam && validSorts.includes(sortParam) ? sortParam : 'featured';

  const viewParam = searchParams.get('view') as ShopViewMode | null;
  const validViews: ShopViewMode[] = ['editorial', 'grid-3', 'grid-2'];
  const view: ShopViewMode =
    viewParam && validViews.includes(viewParam) ? viewParam : 'editorial';

  const pageParam = Number(searchParams.get('page'));
  const page = !Number.isNaN(pageParam) && pageParam >= 1 ? pageParam : 1;

  const limitParam = Number(searchParams.get('limit'));
  const limit = limitParam === 12 ? 12 : 8;

  return {
    category,
    collection,
    query,
    minPrice,
    maxPrice,
    stockStatus,
    colors,
    sort,
    view,
    page,
    limit,
  };
}

function buildQueryStringFromFilters(filters: ShopFilterState): string {
  const params = new URLSearchParams();

  if (filters.category !== 'all') {
    params.set('category', filters.category);
  }
  if (filters.collection) {
    params.set('collection', filters.collection);
  }
  if (filters.query.trim()) {
    params.set('query', filters.query.trim());
  }
  if (filters.minPrice !== null) {
    params.set('minPrice', String(filters.minPrice));
  }
  if (filters.maxPrice !== null) {
    params.set('maxPrice', String(filters.maxPrice));
  }
  if (filters.stockStatus.length > 0) {
    params.set('stock', filters.stockStatus.join(','));
  }
  if (filters.colors.length > 0) {
    params.set('colors', filters.colors.join(','));
  }
  if (filters.sort !== 'featured') {
    params.set('sort', filters.sort);
  }
  if (filters.view !== 'editorial') {
    params.set('view', filters.view);
  }
  if (filters.page > 1) {
    params.set('page', String(filters.page));
  }
  if (filters.limit !== 8) {
    params.set('limit', String(filters.limit));
  }

  return params.toString();
}

export function ShopExperience({
  initialProducts,
  categories,
  collections,
}: ShopExperienceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [catalogProducts, setCatalogProducts] =
    useState<Product[]>(initialProducts);
  const [filters, setFilters] = useState<ShopFilterState>(() =>
    parseFiltersFromSearchParams(
      new URLSearchParams(searchParams?.toString() || '')
    )
  );
  const [searchInput, setSearchInput] = useState<string>(filters.query);
  const debouncedSearch = useDebounce(searchInput, 220);

  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isTransitionLoading, setIsTransitionLoading] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);

  const catalogTopRef = useRef<HTMLDivElement>(null);
  const lastCommittedQueryRef = useRef<string | null>(null);

  // Sync from external URL navigation (e.g., clicking a Mega Menu or Search Overlay link while on /shop)
  const searchParamsString = searchParams?.toString() || '';
  useEffect(() => {
    const params = new URLSearchParams(searchParamsString);

    // Optional diagnostic state query support (?state=error or ?state=empty)
    const stateParam = params.get('state');
    if (stateParam === 'error') {
      setServiceError(
        'Telemetry stream interrupted while querying the Zurich archive node.'
      );
    } else if (stateParam === 'empty-catalog') {
      setCatalogProducts([]);
      setServiceError(null);
    } else {
      setServiceError(null);
      if (catalogProducts.length === 0 && initialProducts.length > 0) {
        setCatalogProducts(initialProducts);
      }
    }

    if (lastCommittedQueryRef.current === searchParamsString) {
      return;
    }

    const parsed = parseFiltersFromSearchParams(params);
    setFilters(parsed);
    setSearchInput(parsed.query);
  }, [searchParamsString, initialProducts, catalogProducts.length]);

  // Helper to commit new filter state + sync URL + brief transition feedback
  const commitFilters = useCallback(
    (
      updater:
        | ShopFilterState
        | ((prev: ShopFilterState) => ShopFilterState),
      options?: { scrollToGrid?: boolean; showSkeleton?: boolean }
    ) => {
      setFilters((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        const qs = buildQueryStringFromFilters(next);
        const targetUrl = qs ? `${pathname}?${qs}` : pathname;

        lastCommittedQueryRef.current = qs;
        router.replace(targetUrl, { scroll: false });

        return next;
      });

      if (options?.showSkeleton) {
        setIsTransitionLoading(true);
        window.setTimeout(() => {
          setIsTransitionLoading(false);
        }, 140);
      }

      if (options?.scrollToGrid && catalogTopRef.current) {
        catalogTopRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    },
    [pathname, router]
  );

  // Apply debounced search input to filters
  useEffect(() => {
    if (debouncedSearch.trim() === filters.query.trim()) return;
    commitFilters((prev) => ({
      ...prev,
      query: debouncedSearch,
      page: 1,
    }));
  }, [debouncedSearch, filters.query, commitFilters]);

  // Retry / Re-synchronize with the async service layer
  const handleRetrySync = useCallback(async () => {
    setIsTransitionLoading(true);
    setServiceError(null);
    try {
      const response = await fetchProductsAction({ limit: 50 });
      if (!response.ok) throw new Error(response.error);
      setCatalogProducts(response.data.items);
      // Remove diagnostic state param if present
      const qs = buildQueryStringFromFilters(filters);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    } catch {
      setServiceError(
        'Unable to reach the NOIRÉ catalog service. Please check your connection and retry.'
      );
    } finally {
      setIsTransitionLoading(false);
    }
  }, [filters, pathname, router]);

  // Compute all matching & sorted products
  const allMatchingProducts = useMemo(() => {
    return filterAndSortProducts(catalogProducts, filters, collections);
  }, [catalogProducts, filters, collections]);

  // Compute pagination boundaries
  const totalMatching = allMatchingProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalMatching / filters.limit));
  const safePage = Math.min(Math.max(1, filters.page), totalPages);

  const startIndex = (safePage - 1) * filters.limit;
  const paginatedProducts = useMemo(
    () => allMatchingProducts.slice(startIndex, startIndex + filters.limit),
    [allMatchingProducts, startIndex, filters.limit]
  );

  const visibleStart = totalMatching === 0 ? 0 : startIndex + 1;
  const visibleEnd = Math.min(startIndex + filters.limit, totalMatching);

  // Handlers for individual filter controls
  const handleSelectCategory = useCallback(
    (category: ShopCategoryFilter) => {
      commitFilters(
        (prev) => ({
          ...prev,
          category,
          page: 1,
        }),
        { showSkeleton: true }
      );
    },
    [commitFilters]
  );

  const handleSelectCollection = useCallback(
    (collectionSlug: string) => {
      commitFilters(
        (prev) => ({
          ...prev,
          collection: collectionSlug,
          page: 1,
        }),
        { showSkeleton: true }
      );
    },
    [commitFilters]
  );

  const handlePriceRangeChange = useCallback(
    (min: number | null, max: number | null) => {
      commitFilters(
        (prev) => ({
          ...prev,
          minPrice: min,
          maxPrice: max,
          page: 1,
        }),
        { showSkeleton: true }
      );
    },
    [commitFilters]
  );

  const handleToggleStockStatus = useCallback(
    (status: StockStatus) => {
      commitFilters(
        (prev) => {
          const exists = prev.stockStatus.includes(status);
          return {
            ...prev,
            stockStatus: exists
              ? prev.stockStatus.filter((s) => s !== status)
              : [...prev.stockStatus, status],
            page: 1,
          };
        },
        { showSkeleton: true }
      );
    },
    [commitFilters]
  );

  const handleToggleColor = useCallback(
    (colorId: string) => {
      commitFilters(
        (prev) => {
          const exists = prev.colors.includes(colorId);
          return {
            ...prev,
            colors: exists
              ? prev.colors.filter((c) => c !== colorId)
              : [...prev.colors, colorId],
            page: 1,
          };
        },
        { showSkeleton: true }
      );
    },
    [commitFilters]
  );

  const handleSortChange = useCallback(
    (sort: SortOption) => {
      commitFilters((prev) => ({
        ...prev,
        sort,
        page: 1,
      }));
    },
    [commitFilters]
  );

  const handleViewChange = useCallback(
    (view: ShopViewMode) => {
      commitFilters((prev) => ({
        ...prev,
        view,
      }));
    },
    [commitFilters]
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      commitFilters(
        (prev) => ({
          ...prev,
          page: nextPage,
        }),
        { scrollToGrid: true }
      );
    },
    [commitFilters]
  );

  const handlePageSizeChange = useCallback(
    (nextLimit: number) => {
      commitFilters((prev) => ({
        ...prev,
        limit: nextLimit,
        page: 1,
      }));
    },
    [commitFilters]
  );

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    commitFilters((prev) => ({
      ...prev,
      query: '',
      page: 1,
    }));
  }, [commitFilters]);

  const handleClearAllFilters = useCallback(() => {
    setSearchInput('');
    commitFilters(
      (prev) => ({
        ...DEFAULT_SHOP_FILTERS,
        sort: prev.sort,
        view: prev.view,
        limit: prev.limit,
      }),
      { showSkeleton: true }
    );
  }, [commitFilters]);

  return (
    <div ref={catalogTopRef} className="min-h-screen bg-background">
      {/* A & B. Shop Introduction + Category Navigation */}
      <ShopIntro
        categories={categories}
        collections={collections}
        allProducts={catalogProducts}
        activeCategory={filters.category}
        activeCollectionSlug={filters.collection}
        totalMatchingCount={totalMatching}
        onSelectCategory={handleSelectCategory}
        onSelectCollection={handleSelectCollection}
      />

      {/* C, E & G. Sticky Shop Toolbar (Search, Active Filter Chips, View Controls, Sort) */}
      <ShopToolbar
        filters={filters}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onClearSearch={handleClearSearch}
        onSortChange={handleSortChange}
        onViewChange={handleViewChange}
        onOpenMobileFilters={() => setIsMobileFilterOpen(true)}
        isDesktopSidebarOpen={isDesktopSidebarOpen}
        onToggleDesktopSidebar={() =>
          setIsDesktopSidebarOpen((prev) => !prev)
        }
        totalMatching={totalMatching}
        visibleStart={visibleStart}
        visibleEnd={visibleEnd}
        categories={categories}
        collections={collections}
        onRemoveCategory={() => handleSelectCategory('all')}
        onRemoveCollection={() => handleSelectCollection('')}
        onRemovePriceRange={() => handlePriceRangeChange(null, null)}
        onRemoveStockStatus={handleToggleStockStatus}
        onRemoveColor={handleToggleColor}
        onClearAllFilters={handleClearAllFilters}
      />

      {/* D, F & I. Main Catalog Workspace (Desktop Filter Sidebar + Product Results + Pagination) */}
      <Container size="wide" className="py-10 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Desktop Filter Sidebar (3 Columns on lg/xl when open) */}
          {isDesktopSidebarOpen && (
            <div className="hidden lg:col-span-3 lg:sticky lg:top-36 lg:block lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto no-scrollbar">
              <ShopFilterSidebar
                filters={filters}
                categories={categories}
                collections={collections}
                allProducts={catalogProducts}
                onCategoryChange={handleSelectCategory}
                onCollectionChange={handleSelectCollection}
                onPriceRangeChange={handlePriceRangeChange}
                onToggleStockStatus={handleToggleStockStatus}
                onToggleColor={handleToggleColor}
                onClearAll={handleClearAllFilters}
              />
            </div>
          )}

          {/* Product Results Grid + Pagination */}
          <div
            className={
              isDesktopSidebarOpen ? 'lg:col-span-9' : 'lg:col-span-12'
            }
          >
            <ShopProductGrid
              products={paginatedProducts}
              totalCatalogCount={catalogProducts.length}
              viewMode={filters.view}
              currentPage={safePage}
              pageSize={filters.limit}
              isLoading={isTransitionLoading}
              errorMessage={serviceError}
              onRetry={handleRetrySync}
              onResetFilters={handleClearAllFilters}
              onClearSearch={handleClearSearch}
              hasSearchQuery={Boolean(filters.query.trim())}
              isSidebarOpen={isDesktopSidebarOpen}
            />

            {/* Pagination Bar */}
            {!isTransitionLoading && !serviceError && totalMatching > 0 && (
              <ShopPagination
                currentPage={safePage}
                totalPages={totalPages}
                totalItems={totalMatching}
                pageSize={filters.limit}
                visibleStart={visibleStart}
                visibleEnd={visibleEnd}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            )}
          </div>
        </div>
      </Container>

      {/* H. Mobile Staged Filter Drawer */}
      <MobileFilterDrawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        currentFilters={filters}
        onApplyFilters={(nextFilters) =>
          commitFilters(nextFilters, { showSkeleton: true })
        }
        categories={categories}
        collections={collections}
        allProducts={catalogProducts}
      />
    </div>
  );
}
