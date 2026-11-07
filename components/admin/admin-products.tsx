'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowUpDown, ArrowUpRight, Archive, Filter, RotateCcw, Search } from 'lucide-react';
import { Button, Drawer, EmptyState, Input, Modal, Select, TechnicalCode, useToast } from '@/components/ui';
import { AdminPageHeader, ProductStatusBadge } from '@/components/admin/admin-primitives';
import { setAdminProductStatus } from '@/lib/admin/actions';
import type { Category, Product, ProductStatus, StockStatus } from '@/types';
import { formatOrderDate } from '@/lib/account/order-utils';
import { formatPrice } from '@/lib/utils';

const PRODUCT_STATUSES: ProductStatus[] = ['active', 'draft', 'archived'];
const STOCK_STATUSES: StockStatus[] = ['in_stock', 'low_stock', 'pre_order', 'out_of_stock'];
type ProductSort = 'name' | 'price-asc' | 'price-desc' | 'stock-asc' | 'updated-desc';
const PRODUCT_SORTS: ProductSort[] = ['name', 'price-asc', 'price-desc', 'stock-asc', 'updated-desc'];

function readProductStatus(value: string): 'all' | ProductStatus {
  return value === 'all' ? 'all' : PRODUCT_STATUSES.find((status) => status === value) ?? 'all';
}
function readStockStatus(value: string): 'all' | StockStatus {
  return value === 'all' ? 'all' : STOCK_STATUSES.find((status) => status === value) ?? 'all';
}
function readSort(value: string): ProductSort {
  return PRODUCT_SORTS.find((sort) => sort === value) ?? 'name';
}

export function AdminProductsWorkspace({ products: initialProducts, categories }: { products: Product[]; categories: Category[] }) {
  const router = useRouter();
  const t = useTranslations('admin.products');
  const tPrim = useTranslations('admin.primitives');
  const tInv = useTranslations('admin.inventory');
  const locale = useLocale();
  const { addToast } = useToast();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState<'all' | ProductStatus>('all');
  const [stock, setStock] = useState<'all' | StockStatus>('all');
  const [sort, setSort] = useState<ProductSort>('name');
  const [pendingStatusChange, setPendingStatusChange] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return [...(products ?? [])]
      .filter((product) => !normalized || [product.name, product.sku, product.modelNumber, product.slug, product.categoryName].some((value) => value.toLowerCase().includes(normalized)))
      .filter((product) => category === 'all' || product.category === category)
      .filter((product) => status === 'all' || product.status === status)
      .filter((product) => stock === 'all' || product.stockStatus === stock)
      .sort((a, b) => {
        if (sort === 'price-asc') return a.price - b.price;
        if (sort === 'price-desc') return b.price - a.price;
        if (sort === 'stock-asc') return a.inventoryCount - b.inventoryCount;
        if (sort === 'updated-desc') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        return a.name.localeCompare(b.name);
      });
  }, [category, products, query, sort, status, stock]);

  const commitStatusChange = async () => {
    if (!pendingStatusChange) return;
    const product = pendingStatusChange;
    const nextStatus: ProductStatus = product.status === 'archived' ? 'active' : 'archived';
    setIsSaving(true);
    const result = await setAdminProductStatus(product.id, nextStatus);
    setIsSaving(false);
    if (!result.ok) {
      addToast({ type: 'error', title: t('toastError'), description: result.error });
      return;
    }
    setProducts((current) => current.map((item) => (item.id === result.data.id ? result.data : item)));
    addToast({ type: 'success', title: nextStatus === 'archived' ? t('archived') : t('restored'), description: nextStatus === 'archived' ? t('archivedBody', { name: product.name }) : t('restoredBody', { name: product.name }) });
    setPendingStatusChange(null);
    router.refresh();
  };

  const categoryOptions = [{ label: t('allCategories'), value: 'all' }, ...categories.map((item) => ({ label: item.shortName, value: item.slug }))];
  const resetFilters = () => { setQuery(''); setCategory('all'); setStatus('all'); setStock('all'); setSort('name'); };
  const filterControls = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Input label={t('search')} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchPlaceholder')} leftElement={<Search className="h-4 w-4" aria-hidden="true" />} />
      <Select label={t('category')} value={category} onChange={(event) => setCategory(event.target.value)} options={categoryOptions} />
      <Select label={t('catalogStatus')} value={status} onChange={(event) => setStatus(readProductStatus(event.target.value))} options={[{ label: t('allStatuses'), value: 'all' }, ...PRODUCT_STATUSES.map((value) => ({ label: tPrim(`productStatus.${value}`), value }))]} />
      <Select label={t('stockStatus')} value={stock} onChange={(event) => setStock(readStockStatus(event.target.value))} options={[{ label: t('allStockStates'), value: 'all' }, ...STOCK_STATUSES.map((value) => ({ label: tInv(`state.${value}`), value }))]} />
      <Select label={t('sort')} value={sort} onChange={(event) => setSort(readSort(event.target.value))} options={[{ label: t('sortName'), value: 'name' }, { label: t('sortPriceAsc'), value: 'price-asc' }, { label: t('sortPriceDesc'), value: 'price-desc' }, { label: t('sortStock'), value: 'stock-asc' }, { label: t('sortUpdated'), value: 'updated-desc' }]} />
    </div>
  );

  return (
    <main id="main-content" className="min-w-0">
      <AdminPageHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        actions={<Link href="/admin/products/new" className="inline-flex min-h-11 items-center justify-center border border-foreground bg-foreground px-4 font-mono text-[9px] uppercase tracking-[0.12em] text-background transition-colors hover:bg-foreground/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">{t('create')}</Link>}
      />
      <section aria-label={t('filtersAria')} className="mb-5 border border-border bg-surface p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <TechnicalCode>{t('filtersSort')}</TechnicalCode>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="ghost" size="sm" leftIcon={<ArrowUpDown className="h-3 w-3" aria-hidden="true" />} onClick={resetFilters}>{t('reset')}</Button>
            <Button type="button" variant="outline" size="sm" className="lg:hidden" leftIcon={<Filter className="h-3.5 w-3.5" aria-hidden="true" />} onClick={() => setIsFilterDrawerOpen(true)}>{t('filters')}</Button>
          </div>
        </div>
        <div className="hidden lg:block">{filterControls}</div>
        <div className="grid grid-cols-1 gap-3 lg:hidden sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <Input label={t('searchCatalog')} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchPlaceholder')} leftElement={<Search className="h-4 w-4" aria-hidden="true" />} />
          <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle sm:pb-3">{t('filtersHint')}</p>
        </div>
      </section>
      <Drawer isOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} title={t('drawerTitle')} subtitle={t('drawerSubtitle')} size="lg" footer={<div className="flex flex-col gap-2 sm:flex-row sm:justify-between"><Button type="button" variant="ghost" onClick={resetFilters}>{t('resetFilters')}</Button><Button type="button" variant="primary" onClick={() => setIsFilterDrawerOpen(false)}>{t('apply')}</Button></div>}>
        {filterControls}
      </Drawer>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.11em] text-foreground-subtle">
        <span>{t('count', { visible: filteredProducts.length, total: products.length })}</span>
        <span>{t('actionsHint')}</span>
      </div>

      {filteredProducts.length === 0 ? (
        <EmptyState code={t('noMatchCode')} title={t('noMatchTitle')} description={t('noMatchDescription')} primaryAction={<Button type="button" variant="outline" onClick={resetFilters}>{t('clearFilters')}</Button>} />
      ) : (
        <>
          <div className="hidden overflow-x-auto border-y border-border bg-surface lg:block">
            <table className="w-full min-w-[840px] border-collapse text-start">
              <caption className="sr-only">{t('caption')}</caption>
              <thead><tr className="border-b border-border bg-surface-muted/50 font-mono text-[8px] uppercase tracking-[0.12em] text-foreground-subtle"><th scope="col" className="px-3 py-3">{t('colProduct')}</th><th scope="col" className="px-3 py-3">{t('colSku')}</th><th scope="col" className="px-3 py-3">{t('colCategory')}</th><th scope="col" className="px-3 py-3 text-end">{t('colPrice')}</th><th scope="col" className="px-3 py-3">{t('colStock')}</th><th scope="col" className="px-3 py-3">{t('colStatus')}</th><th scope="col" className="px-3 py-3">{t('colModified')}</th><th scope="col" className="px-3 py-3"><span className="sr-only">{t('colActions')}</span></th></tr></thead>
              <tbody>{filteredProducts.map((product) => <ProductTableRow key={product.id} product={product} onStatusChange={setPendingStatusChange} t={t} tInv={tInv} locale={locale} />)}</tbody>
            </table>
          </div>
          <ul className="divide-y divide-border border-y border-border bg-surface lg:hidden">
            {filteredProducts.map((product) => <ProductMobileCard key={product.id} product={product} onStatusChange={setPendingStatusChange} t={t} tInv={tInv} locale={locale} />)}
          </ul>
        </>
      )}

      <Modal
        isOpen={Boolean(pendingStatusChange)}
        onClose={() => !isSaving && setPendingStatusChange(null)}
        title={pendingStatusChange?.status === 'archived' ? t('restoreTitle') : t('archiveTitle')}
        code={t('modalCode')}
        size="sm"
        footer={<><Button type="button" variant="ghost" disabled={isSaving} onClick={() => setPendingStatusChange(null)}>{t('cancel')}</Button><Button type="button" variant={pendingStatusChange?.status === 'archived' ? 'primary' : 'danger'} isLoading={isSaving} onClick={() => void commitStatusChange()}>{pendingStatusChange?.status === 'archived' ? t('restore') : t('archive')}</Button></>}
      >
        <p className="text-small leading-relaxed text-foreground-muted">{pendingStatusChange?.status === 'archived' ? t('restoreBody', { name: pendingStatusChange.name }) : t('archiveBody', { name: pendingStatusChange?.name ?? t('thisProduct') })}</p>
      </Modal>
    </main>
  );
}

type Translator = ReturnType<typeof useTranslations>;
interface ProductItemProps { product: Product; onStatusChange: (product: Product) => void; t: Translator; tInv: Translator; locale: string }

function ProductTableRow({ product, onStatusChange, t, locale }: ProductItemProps) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-surface-muted/30">
      <th scope="row" className="px-3 py-3.5"><div className="flex min-w-[220px] items-center gap-3"><span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden border border-border bg-surface-muted">{product.primaryImage ? <Image src={product.primaryImage} alt="" fill sizes="48px" className="object-cover" /> : <span className="font-mono text-[6px] uppercase text-foreground-subtle">{t('noImage')}</span>}</span><span className="min-w-0"><Link href={`/admin/products/${encodeURIComponent(product.id)}`} className="block break-words text-[11px] font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">{product.name}</Link><span className="mt-1 block font-mono text-[8px] text-foreground-subtle">{product.modelNumber}</span></span></div></th>
      <td className="px-3 py-3.5 font-mono text-[9px] text-foreground-muted">{product.sku}</td><td className="px-3 py-3.5 text-[10px] text-foreground-muted">{product.categoryName}</td><td className="px-3 py-3.5 text-end font-mono text-[10px] tabular-nums text-foreground">{formatPrice(product.price)}</td><td className="px-3 py-3.5 font-mono text-[10px] tabular-nums text-foreground">{product.inventoryCount}</td><td className="px-3 py-3.5"><ProductStatusBadge product={product} /></td><td className="px-3 py-3.5 text-[10px] text-foreground-muted">{formatOrderDate(product.updatedAt, locale)}</td><td className="px-3 py-3.5"><ProductActions product={product} onStatusChange={onStatusChange} t={t} /></td>
    </tr>
  );
}

function ProductMobileCard({ product, onStatusChange, t, tInv, locale }: ProductItemProps) {
  return (
    <li className="p-4">
      <div className="flex gap-3">
        <Link href={`/admin/products/${encodeURIComponent(product.id)}`} aria-label={t('inspect', { name: product.name })} className="relative flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden border border-border bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">{product.primaryImage ? <Image src={product.primaryImage} alt="" fill sizes="64px" className="object-cover" /> : <span className="font-mono text-[6px] uppercase text-foreground-subtle">{t('noImage')}</span>}</Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><Link href={`/admin/products/${encodeURIComponent(product.id)}`} className="break-words font-display text-base leading-snug text-foreground underline decoration-border underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">{product.name}</Link><p className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">{product.modelNumber} · {product.sku}</p></div><ProductStatusBadge product={product} /></div>
          <p className="mt-2 text-[10px] text-foreground-muted">{product.categoryName} · {formatPrice(product.price)} · {t('units', { count: product.inventoryCount })}</p>
          <p className="mt-1 text-[9px] text-foreground-subtle">{t('modified', { date: formatOrderDate(product.updatedAt, locale) })}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3"><span className="font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">{t('stockChip', { state: tInv(`state.${product.stockStatus}`) })}</span><ProductActions product={product} onStatusChange={onStatusChange} t={t} /></div>
    </li>
  );
}

function ProductActions({ product, onStatusChange, t }: { product: Product; onStatusChange: (product: Product) => void; t: Translator }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/admin/products/${encodeURIComponent(product.id)}`} aria-label={t('editAria', { name: product.name })} className="inline-flex min-h-10 items-center gap-1.5 border border-border px-2.5 font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-muted hover:border-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">{t('edit')} <ArrowUpRight className="h-3 w-3" aria-hidden="true" /></Link>
      {product.status === 'archived' ? (
        <Button type="button" variant="ghost" size="sm" className="min-h-10 px-2.5 text-[8px]" leftIcon={<RotateCcw className="h-3 w-3" aria-hidden="true" />} onClick={() => onStatusChange(product)}>{t('restore')}</Button>
      ) : (
        <Button type="button" variant="ghost" size="sm" className="min-h-10 px-2.5 text-[8px]" leftIcon={<Archive className="h-3 w-3" aria-hidden="true" />} onClick={() => onStatusChange(product)}>{t('archive')}</Button>
      )}
    </div>
  );
}
