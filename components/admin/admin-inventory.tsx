'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Box, Filter, Search } from 'lucide-react';
import { Badge, Button, Drawer, EmptyState, Input, Modal, Select, useToast } from '@/components/ui';
import { AdminPageHeader, inventoryState } from '@/components/admin/admin-primitives';
import { updateAdminInventory } from '@/lib/admin/actions';
import type { Product, StockStatus } from '@/types';
import { formatOrderDate } from '@/lib/account/order-utils';

const STOCK_STATES: StockStatus[] = ['in_stock', 'low_stock', 'pre_order', 'out_of_stock'];
function readStockState(value: string): 'all' | StockStatus {
  return value === 'all' ? 'all' : STOCK_STATES.find((status) => status === value) ?? 'all';
}

export function AdminInventoryWorkspace({ products: initialProducts }: { products: Product[] }) {
  const router = useRouter();
  const t = useTranslations('admin.inventory');
  const tPrim = useTranslations('admin.primitives');
  const locale = useLocale();
  const { addToast } = useToast();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [query, setQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | StockStatus>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('0');
  const [nextStockState, setNextStockState] = useState<StockStatus>('in_stock');
  const [isSaving, setIsSaving] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return [...products]
      .filter((product) => !normalized || [product.name, product.sku, product.modelNumber].some((value) => value.toLowerCase().includes(normalized)))
      .filter((product) => stockFilter === 'all' || product.stockStatus === stockFilter)
      .sort((a, b) => a.inventoryCount - b.inventoryCount);
  }, [products, query, stockFilter]);

  const openEditor = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(String(product.inventoryCount));
    setNextStockState(product.stockStatus);
  };

  const saveInventory = async () => {
    if (!selectedProduct) return;
    const numericQuantity = Number(quantity);
    if (!Number.isSafeInteger(numericQuantity) || numericQuantity < 0) {
      addToast({ type: 'error', title: t('invalidQuantity'), description: t('invalidQuantityBody') });
      return;
    }
    setIsSaving(true);
    const result = await updateAdminInventory(selectedProduct.id, numericQuantity, nextStockState);
    setIsSaving(false);
    if (!result.ok) {
      addToast({ type: 'error', title: t('toastError'), description: result.error });
      return;
    }
    setProducts((current) => current.map((product) => (product.id === result.data.id ? result.data : product)));
    addToast({ type: 'success', title: t('toastUpdated'), description: t('toastUpdatedBody', { name: result.data.name, count: result.data.inventoryCount, state: t(`state.${result.data.stockStatus}`) }) });
    setSelectedProduct(null);
    router.refresh();
  };

  return (
    <main id="main-content" className="min-w-0">
      <AdminPageHeader eyebrow={t('eyebrow')} title={t('title')} description={t('description')} />
      <section aria-label={t('filtersAria')} className="mb-5 border border-border bg-surface p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 lg:hidden sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <Input label={t('search')} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchPlaceholder')} leftElement={<Search className="h-4 w-4" aria-hidden="true" />} />
          <Button type="button" variant="outline" size="sm" leftIcon={<Filter className="h-3.5 w-3.5" aria-hidden="true" />} onClick={() => setIsFilterDrawerOpen(true)}>{t('stockFilter')}{stockFilter !== 'all' ? t('active') : ''}</Button>
        </div>
        <div className="hidden grid-cols-[minmax(0,1fr)_minmax(220px,0.45fr)_auto] gap-3 lg:grid lg:items-end">
          <Input label={t('search')} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchPlaceholder')} leftElement={<Search className="h-4 w-4" aria-hidden="true" />} />
          <Select label={t('stockState')} value={stockFilter} onChange={(event) => setStockFilter(readStockState(event.target.value))} options={[{ label: t('allStockStates'), value: 'all' }, ...STOCK_STATES.map((value) => ({ label: t(`state.${value}`), value }))]} />
          <Button type="button" variant="ghost" size="sm" onClick={() => { setQuery(''); setStockFilter('all'); }}>{t('reset')}</Button>
        </div>
      </section>
      <Drawer isOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} title={t('drawerTitle')} subtitle={t('drawerSubtitle')} size="md" footer={<div className="flex flex-col gap-2 sm:flex-row sm:justify-between"><Button type="button" variant="ghost" onClick={() => { setQuery(''); setStockFilter('all'); }}>{t('resetFilters')}</Button><Button type="button" variant="primary" onClick={() => setIsFilterDrawerOpen(false)}>{t('apply')}</Button></div>}>
        <Select label={t('stockState')} value={stockFilter} onChange={(event) => setStockFilter(readStockState(event.target.value))} options={[{ label: t('allStockStates'), value: 'all' }, ...STOCK_STATES.map((value) => ({ label: t(`state.${value}`), value }))]} />
      </Drawer>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.1em] text-foreground-subtle"><span>{t('count', { count: visibleProducts.length })}</span><span>{t('sorted')}</span></div>

      {visibleProducts.length === 0 ? (
        <EmptyState code={t('noMatchCode')} title={t('noMatchTitle')} description={products.length === 0 ? t('emptyCatalog') : t('tryDifferent')} icon={<Box className="h-5 w-5" aria-hidden="true" />} primaryAction={products.length > 0 ? <Button type="button" variant="outline" onClick={() => { setQuery(''); setStockFilter('all'); }}>{t('resetView')}</Button> : undefined} />
      ) : (
        <>
          <div className="hidden overflow-x-auto border-y border-border bg-surface lg:block">
            <table className="w-full min-w-[780px] border-collapse text-start">
              <caption className="sr-only">{t('caption')}</caption>
              <thead><tr className="border-b border-border bg-surface-muted/50 font-mono text-[8px] uppercase tracking-[0.12em] text-foreground-subtle"><th scope="col" className="px-3 py-3">{t('colProduct')}</th><th scope="col" className="px-3 py-3">{t('colSku')}</th><th scope="col" className="px-3 py-3 text-end">{t('colOnHand')}</th><th scope="col" className="px-3 py-3">{t('colState')}</th><th scope="col" className="px-3 py-3">{t('colUpdated')}</th><th scope="col" className="px-3 py-3"><span className="sr-only">{t('colEdit')}</span></th></tr></thead>
              <tbody>{visibleProducts.map((product) => <InventoryRow key={product.id} product={product} onEdit={openEditor} t={t} tPrim={tPrim} locale={locale} />)}</tbody>
            </table>
          </div>
          <ul className="divide-y divide-border border-y border-border bg-surface lg:hidden">
            {visibleProducts.map((product) => <InventoryCard key={product.id} product={product} onEdit={openEditor} t={t} tPrim={tPrim} locale={locale} />)}
          </ul>
        </>
      )}

      <Modal isOpen={Boolean(selectedProduct)} onClose={() => !isSaving && setSelectedProduct(null)} title={t('modalTitle')} code={t('modalCode')} size="md" footer={<><Button type="button" variant="ghost" disabled={isSaving} onClick={() => setSelectedProduct(null)}>{t('cancel')}</Button><Button type="button" variant="primary" isLoading={isSaving} onClick={() => void saveInventory()}>{t('saveStock')}</Button></>}>
        {selectedProduct && (
          <div className="space-y-4">
            <div className="border-b border-border pb-4"><p className="font-display text-lg text-foreground">{selectedProduct.name}</p><p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-foreground-subtle">{t('currentQuantity', { sku: selectedProduct.sku, count: selectedProduct.inventoryCount })}</p></div>
            <Input label={t('unitsOnHand')} type="number" min="0" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} hint={t('unitsHint')} />
            <Select label={t('stockStatus')} value={nextStockState} onChange={(event) => { const state = STOCK_STATES.find((candidate) => candidate === event.target.value); if (state) setNextStockState(state); }} options={STOCK_STATES.map((value) => ({ label: t(`state.${value}`), value }))} />
          </div>
        )}
      </Modal>
    </main>
  );
}

type Translator = ReturnType<typeof useTranslations>;
interface InventoryItemProps { product: Product; onEdit: (product: Product) => void; t: Translator; tPrim: Translator; locale: string }

function InventoryRow({ product, onEdit, t, tPrim, locale }: InventoryItemProps) {
  const state = inventoryState(tPrim, product);
  return (
    <tr className="border-b border-border last:border-0 hover:bg-surface-muted/30"><th scope="row" className="px-3 py-3.5"><Link href={`/admin/products/${encodeURIComponent(product.id)}`} className="text-[10px] text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">{product.name}</Link><span className="mt-1 block font-mono text-[8px] text-foreground-subtle">{product.modelNumber}</span></th><td className="px-3 py-3.5 font-mono text-[9px] text-foreground-muted">{product.sku}</td><td className="px-3 py-3.5 text-end font-mono text-[11px] tabular-nums text-foreground">{product.inventoryCount}</td><td className="px-3 py-3.5"><Badge variant={state.variant}>{state.label}</Badge></td><td className="px-3 py-3.5 text-[10px] text-foreground-muted">{formatOrderDate(product.updatedAt, locale)}</td><td className="px-3 py-3.5"><Button type="button" variant="outline" size="sm" onClick={() => onEdit(product)}>{t('adjust')}</Button></td></tr>
  );
}

function InventoryCard({ product, onEdit, t, tPrim, locale }: InventoryItemProps) {
  const state = inventoryState(tPrim, product);
  return (
    <li className="flex gap-3 p-4"><span className="relative h-16 w-14 shrink-0 overflow-hidden border border-border bg-surface-muted">{product.primaryImage && <Image src={product.primaryImage} alt="" fill sizes="56px" className="object-cover" />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><Link href={`/admin/products/${encodeURIComponent(product.id)}`} className="break-words text-[11px] font-medium text-foreground underline decoration-border underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">{product.name}</Link><Badge variant={state.variant}>{state.label}</Badge></div><p className="mt-1 font-mono text-[8px] uppercase text-foreground-subtle">{product.sku}</p><dl className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3"><div><dt className="font-mono text-[8px] uppercase text-foreground-subtle">{t('colOnHand')}</dt><dd className="mt-1 font-mono text-small text-foreground">{product.inventoryCount}</dd></div><div><dt className="font-mono text-[8px] uppercase text-foreground-subtle">{t('status')}</dt><dd className="mt-1 text-[9px] text-foreground-muted">{tPrim(`productStatus.${product.status}`)}</dd></div></dl><div className="mt-3 flex items-center justify-between gap-2"><span className="text-[9px] text-foreground-subtle">{t('updated', { date: formatOrderDate(product.updatedAt, locale) })}</span><Button type="button" variant="outline" size="sm" onClick={() => onEdit(product)}>{t('adjust')}</Button></div></div></li>
  );
}
