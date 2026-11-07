'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowDown, ArrowUp, ArrowUpRight, Filter, Search, SlidersHorizontal } from 'lucide-react';
import { Badge, Button, Drawer, EmptyState, Input, Select, TechnicalCode } from '@/components/ui';
import { AdminPageHeader, OrderStatusBadge, PaymentStatusBadge } from '@/components/admin/admin-primitives';
import { formatOrderDate, orderPaymentMethodLabel, orderStatusLabel, orderTotals, orderUnitCount, paymentStatusLabel } from '@/lib/account/order-utils';
import { formatPrice } from '@/lib/utils';
import type { Order, OrderStatus, PaymentStatus } from '@/types';

const ORDER_STATUSES: OrderStatus[] = [
  'pending_settlement', 'processing', 'Craft & Calibration', 'shipped', 'delivered', 'cancelled', 'returned',
];
const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded'];
const PAGE_SIZE = 8;

type SortMode = 'date-desc' | 'date-asc' | 'total-desc' | 'order-asc';

const SORT_MODES: SortMode[] = ['date-desc', 'date-asc', 'total-desc', 'order-asc'];

function readOrderStatus(value: string): 'all' | OrderStatus {
  return value === 'all' ? 'all' : ORDER_STATUSES.find((candidate) => candidate === value) ?? 'all';
}

function readPaymentStatus(value: string): 'all' | PaymentStatus {
  return value === 'all' ? 'all' : PAYMENT_STATUSES.find((candidate) => candidate === value) ?? 'all';
}

function readSortMode(value: string): SortMode {
  return SORT_MODES.find((candidate) => candidate === value) ?? 'date-desc';
}

export function AdminOrdersWorkspace({ orders: placedOrders }: { orders: Order[] }) {
  const t = useTranslations('admin.orders');
  const tOrders = useTranslations('orders');
  const locale = useLocale();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | OrderStatus>('all');
  const [payment, setPayment] = useState<'all' | PaymentStatus>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sort, setSort] = useState<SortMode>('date-desc');
  const [page, setPage] = useState(1);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  useEffect(() => {
    const initialStatus = new URLSearchParams(window.location.search).get('status');
    if (initialStatus) setStatus(readOrderStatus(initialStatus));
  }, []);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...placedOrders]
      .filter((order) => status === 'all' || order.status === status)
      .filter((order) => payment === 'all' || order.paymentStatus === payment)
      .filter((order) => {
        const timestamp = new Date(order.createdAt).getTime();
        if (!Number.isFinite(timestamp)) return !fromDate && !toDate;
        const day = new Date(timestamp).toISOString().slice(0, 10);
        return (!fromDate || day >= fromDate) && (!toDate || day <= toDate);
      })
      .filter((order) => {
        if (!normalizedQuery) return true;
        const haystack = [
          order.id, order.orderNumber, order.customerName, order.customerEmail,
          ...order.items.map((item) => `${item.productName} ${item.modelNumber} ${item.sku}`),
        ].join(' ').toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => {
        if (sort === 'date-asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sort === 'total-desc') return orderTotals(b).total - orderTotals(a).total;
        if (sort === 'order-asc') return a.orderNumber.localeCompare(b.orderNumber);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [fromDate, payment, placedOrders, query, sort, status, toDate]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const pageOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const resetFilters = () => {
    setQuery('');
    setStatus('all');
    setPayment('all');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const filterControls = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <div className="sm:col-span-2 xl:col-span-1">
        <Input label={t('find')} type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={t('findPlaceholder')} leftElement={<Search className="h-4 w-4" aria-hidden="true" />} />
      </div>
      <Select label={t('orderStatus')} value={status} onChange={(event) => { setStatus(readOrderStatus(event.target.value)); setPage(1); }} options={[{ label: t('allOrderStates'), value: 'all' }, ...ORDER_STATUSES.map((value) => ({ label: orderStatusLabel(tOrders, value), value }))]} />
      <Select label={t('paymentState')} value={payment} onChange={(event) => { setPayment(readPaymentStatus(event.target.value)); setPage(1); }} options={[{ label: t('allPaymentStates'), value: 'all' }, ...PAYMENT_STATUSES.map((value) => ({ label: paymentStatusLabel(tOrders, value), value }))]} />
      <label className="block space-y-2 font-mono text-label uppercase tracking-[0.12em] text-foreground">
        <span>{t('fromDate')}</span>
        <input aria-label={t('fromDateAria')} type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); setPage(1); }} className="h-11 w-full min-w-0 border border-border bg-surface px-3 text-small font-sans text-foreground focus:border-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground" />
      </label>
      <label className="block space-y-2 font-mono text-label uppercase tracking-[0.12em] text-foreground">
        <span>{t('toDate')}</span>
        <input aria-label={t('toDateAria')} type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); setPage(1); }} className="h-11 w-full min-w-0 border border-border bg-surface px-3 text-small font-sans text-foreground focus:border-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground" />
      </label>
    </div>
  );

  return (
    <main id="main-content" className="min-w-0">
      <AdminPageHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        actions={<Button type="button" variant="outline" size="md" className="lg:hidden" leftIcon={<Filter className="h-3.5 w-3.5" aria-hidden="true" />} onClick={() => setIsFilterDrawerOpen(true)}>{t('filters')}</Button>}
      />
      <section aria-label={t('controlsAria')} className="mb-5 border border-border bg-surface p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-foreground-muted">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            <TechnicalCode>{t('filters')}</TechnicalCode>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex min-h-11 items-center gap-2 font-mono text-[9px] uppercase tracking-[0.1em] text-foreground-muted">
              <span className="hidden sm:inline">{t('sort')}</span>
              <select value={sort} onChange={(event) => { setSort(readSortMode(event.target.value)); setPage(1); }} aria-label={t('sortAria')} className="h-10 max-w-[180px] border border-border bg-background px-2 text-[10px] text-foreground focus:border-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground">
                <option value="date-desc">{t('sortNewest')}</option><option value="date-asc">{t('sortOldest')}</option><option value="total-desc">{t('sortTotal')}</option><option value="order-asc">{t('sortNumber')}</option>
              </select>
            </label>
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>{t('resetFilters')}</Button>
          </div>
        </div>
        <div className="hidden lg:block">{filterControls}</div>
        <div className="lg:hidden flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[0.1em] text-foreground-subtle">
          <Badge variant="outline">{t('chipOrder', { status: status === 'all' ? t('all') : orderStatusLabel(tOrders, status) })}</Badge>
          <Badge variant="outline">{t('chipPayment', { status: payment === 'all' ? t('all') : paymentStatusLabel(tOrders, payment) })}</Badge>
          <span>{query ? t('chipSearch', { query }) : t('chipSearchNone')}</span>
        </div>
      </section>

      {filteredOrders.length === 0 ? (
        placedOrders.length === 0 ? (
          <EmptyState code={t('emptyCode')} title={t('emptyTitle')} description={t('emptyDescription')} icon={<ShoppingBagIcon />} />
        ) : (
          <EmptyState code={t('noMatchCode')} title={t('noMatchTitle')} description={t('noMatchDescription')} primaryAction={<Button type="button" variant="outline" onClick={resetFilters}>{t('clearFilters')}</Button>} />
        )
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.11em] text-foreground-subtle">
            <span>{t('showing', { from: String((page - 1) * PAGE_SIZE + 1).padStart(2, '0'), to: String(Math.min(page * PAGE_SIZE, filteredOrders.length)).padStart(2, '0'), total: filteredOrders.length })}</span>
            <span>{t('source')}</span>
          </div>

          <div className="hidden overflow-x-auto border-y border-border bg-surface xl:block">
            <table className="w-full min-w-[980px] border-collapse text-start">
              <caption className="sr-only">{t('caption')}</caption>
              <thead>
                <tr className="border-b border-border bg-surface-muted/50 font-mono text-[8px] uppercase tracking-[0.12em] text-foreground-subtle">
                  <th scope="col" className="px-3 py-3">{t('colOrder')}</th><th scope="col" className="px-3 py-3">{t('colDate')}</th><th scope="col" className="px-3 py-3">{t('colCustomer')}</th><th scope="col" className="px-3 py-3">{t('colItems')}</th><th scope="col" className="px-3 py-3 text-end">{t('colTotal')}</th><th scope="col" className="px-3 py-3">{t('colPayment')}</th><th scope="col" className="px-3 py-3">{t('colStatus')}</th><th scope="col" className="px-3 py-3">{t('colMethod')}</th><th scope="col" className="px-3 py-3"><span className="sr-only">{t('colActions')}</span></th>
                </tr>
              </thead>
              <tbody>
                {pageOrders.map((order) => <OrderTableRow key={order.id} order={order} t={t} tOrders={tOrders} locale={locale} />)}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-border border-y border-border bg-surface xl:hidden">
            {pageOrders.map((order) => <OrderMobileCard key={order.id} order={order} t={t} tOrders={tOrders} locale={locale} />)}
          </ul>

          <nav aria-label={t('paginationAria')} className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-foreground-subtle">{t('pageOf', { page, total: totalPages, size: PAGE_SIZE })}</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={page <= 1} leftIcon={<ArrowUp className="h-3 w-3 -rotate-90" aria-hidden="true" />} onClick={() => setPage((current) => Math.max(1, current - 1))}>{t('previous')}</Button>
              <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} rightIcon={<ArrowDown className="h-3 w-3 -rotate-90" aria-hidden="true" />} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>{t('next')}</Button>
            </div>
          </nav>
        </>
      )}

      <Drawer isOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} title={t('drawerTitle')} subtitle={t('drawerSubtitle')} size="lg" footer={<div className="flex flex-col gap-2 sm:flex-row sm:justify-between"><Button type="button" variant="ghost" onClick={resetFilters}>{t('reset')}</Button><Button type="button" variant="primary" onClick={() => setIsFilterDrawerOpen(false)}>{t('apply')}</Button></div>}>
        {filterControls}
      </Drawer>
    </main>
  );
}

type RowTranslator = ReturnType<typeof useTranslations>;

function OrderTableRow({ order, t, tOrders, locale }: { order: Order; t: RowTranslator; tOrders: RowTranslator; locale: string }) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-surface-muted/30">
      <th scope="row" className="px-3 py-4 font-mono text-[10px] font-medium text-foreground"><Link href={`/admin/orders/${encodeURIComponent(order.id)}`} className="underline decoration-border underline-offset-4 hover:decoration-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">{order.orderNumber}</Link><span className="mt-1 block font-normal text-foreground-subtle">{order.allocationReference ?? ''}</span></th>
      <td className="px-3 py-4 text-[10px] text-foreground-muted">{formatOrderDate(order.createdAt, locale, t('notRecorded'))}</td>
      <td className="max-w-[150px] px-3 py-4"><span className="block truncate text-[10px] text-foreground">{order.customerName || t('notRecorded')}</span><span className="mt-1 block truncate text-[9px] text-foreground-subtle">{order.customerEmail || t('emailNotRecorded')}</span>{order.customerId === 'guest' && <Badge variant="outline" className="mt-2">{t('guest')}</Badge>}</td>
      <td className="px-3 py-4 font-mono text-[10px] tabular-nums text-foreground-muted">{t('units', { count: orderUnitCount(order) })}</td>
      <td className="px-3 py-4 text-end font-mono text-[10px] tabular-nums text-foreground">{formatPrice(orderTotals(order).total)}</td>
      <td className="px-3 py-4"><PaymentStatusBadge status={order.paymentStatus} /></td>
      <td className="px-3 py-4"><OrderStatusBadge status={order.status} /></td>
      <td className="px-3 py-4 font-mono text-[8px] uppercase tracking-[0.08em] text-foreground-subtle">{orderPaymentMethodLabel(tOrders, order)}</td>
      <td className="px-3 py-4"><Link href={`/admin/orders/${encodeURIComponent(order.id)}`} aria-label={t('openOrder', { number: order.orderNumber })} className="inline-flex h-10 w-10 items-center justify-center border border-border text-foreground-muted hover:border-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"><ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></Link></td>
    </tr>
  );
}

function OrderMobileCard({ order, t, tOrders, locale }: { order: Order; t: RowTranslator; tOrders: RowTranslator; locale: string }) {
  return (
    <li className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <TechnicalCode>{formatOrderDate(order.createdAt, locale, t('notRecorded'))}</TechnicalCode>
          <Link href={`/admin/orders/${encodeURIComponent(order.id)}`} className="mt-1 block break-words font-display text-lg text-foreground underline decoration-border underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">{order.orderNumber}</Link>
          <p className="mt-1 break-words text-[11px] text-foreground-muted">{order.customerName || t('notRecorded')}</p>
        </div>
        <span className="font-mono text-[11px] tabular-nums text-foreground">{formatPrice(orderTotals(order).total)}</span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-border pt-3">
        <div><dt className="font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">{t('colItems')}</dt><dd className="mt-1 text-[10px] text-foreground">{t('units', { count: orderUnitCount(order) })}</dd></div>
        <div><dt className="font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">{t('colMethod')}</dt><dd className="mt-1 text-[10px] text-foreground">{orderPaymentMethodLabel(tOrders, order)}</dd></div>
        <div><dt className="font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">{t('colPayment')}</dt><dd className="mt-1"><PaymentStatusBadge status={order.paymentStatus} /></dd></div>
        <div><dt className="font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">{t('colStatus')}</dt><dd className="mt-1"><OrderStatusBadge status={order.status} /></dd></div>
      </dl>
    </li>
  );
}

function ShoppingBagIcon() {
  return <span aria-hidden="true" className="inline-flex h-5 w-5 items-center justify-center border border-border font-mono text-[10px]">O</span>;
}
