'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ArrowDown, ArrowUp, ArrowUpRight, Filter, Search, SlidersHorizontal } from 'lucide-react';
import { Badge, Button, Drawer, EmptyState, Input, Select, TechnicalCode } from '@/components/ui';
import { AdminPageHeader, OrderStatusBadge, PaymentStatusBadge } from '@/components/admin/admin-primitives';
import { formatOrderDate, orderStatusLabel, orderTotals, orderUnitCount } from '@/lib/account/order-utils';
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
        <Input label="Find record" type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Order, contact, item…" leftElement={<Search className="h-4 w-4" aria-hidden="true" />} />
      </div>
      <Select label="Order status" value={status} onChange={(event) => { setStatus(readOrderStatus(event.target.value)); setPage(1); }} options={[{ label: 'All order states', value: 'all' }, ...ORDER_STATUSES.map((value) => ({ label: orderStatusLabel(value), value }))]} />
      <Select label="Payment state" value={payment} onChange={(event) => { setPayment(readPaymentStatus(event.target.value)); setPage(1); }} options={[{ label: 'All payment states', value: 'all' }, ...PAYMENT_STATUSES.map((value) => ({ label: value, value }))]} />
      <label className="block space-y-2 font-mono text-label uppercase tracking-[0.12em] text-foreground">
        <span>From date</span>
        <input aria-label="Filter orders from date" type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); setPage(1); }} className="h-11 w-full min-w-0 border border-border bg-surface px-3 text-small font-sans text-foreground focus:border-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground" />
      </label>
      <label className="block space-y-2 font-mono text-label uppercase tracking-[0.12em] text-foreground">
        <span>To date</span>
        <input aria-label="Filter orders to date" type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); setPage(1); }} className="h-11 w-full min-w-0 border border-border bg-surface px-3 text-small font-sans text-foreground focus:border-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground" />
      </label>
    </div>
  );

  return (
    <main id="main-content" className="min-w-0">
      <AdminPageHeader
        eyebrow="OPERATIONS // 01 · ORDERS"
        title="Orders"
        description="Every order placed on the storefront. Confirm payment, move orders through fulfilment, and record tracking from the order page."
        actions={<Button type="button" variant="outline" size="md" className="lg:hidden" leftIcon={<Filter className="h-3.5 w-3.5" aria-hidden="true" />} onClick={() => setIsFilterDrawerOpen(true)}>Filters</Button>}
      />
      <section aria-label="Order ledger controls" className="mb-5 border border-border bg-surface p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-foreground-muted">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            <TechnicalCode>Filters</TechnicalCode>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex min-h-11 items-center gap-2 font-mono text-[9px] uppercase tracking-[0.1em] text-foreground-muted">
              <span className="hidden sm:inline">Sort</span>
              <select value={sort} onChange={(event) => { setSort(readSortMode(event.target.value)); setPage(1); }} aria-label="Sort order ledger" className="h-10 max-w-[180px] border border-border bg-background px-2 text-[10px] text-foreground focus:border-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground">
                <option value="date-desc">Newest date</option><option value="date-asc">Oldest date</option><option value="total-desc">Highest total</option><option value="order-asc">Order number</option>
              </select>
            </label>
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>Reset filters</Button>
          </div>
        </div>
        <div className="hidden lg:block">{filterControls}</div>
        <div className="lg:hidden flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[0.1em] text-foreground-subtle">
          <Badge variant="outline">Order // {status}</Badge>
          <Badge variant="outline">Payment // {payment}</Badge>
          <span>{query ? `Search // ${query}` : 'Search // none'}</span>
        </div>
      </section>

      {filteredOrders.length === 0 ? (
        placedOrders.length === 0 ? (
          <EmptyState code="ORDERS // EMPTY" title="No orders yet." description="Orders placed on the storefront will appear here as soon as customers check out." icon={<ShoppingBagIcon />} />
        ) : (
          <EmptyState code="ORDERS // 00 MATCHES" title="No orders match these filters." description="Adjust the search, order status, payment state, or date range." primaryAction={<Button type="button" variant="outline" onClick={resetFilters}>Clear filters</Button>} />
        )
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.11em] text-foreground-subtle">
            <span>Showing {String((page - 1) * PAGE_SIZE + 1).padStart(2, '0')}—{String(Math.min(page * PAGE_SIZE, filteredOrders.length)).padStart(2, '0')} of {filteredOrders.length} orders</span>
            <span>Source // Storefront checkout</span>
          </div>

          <div className="hidden overflow-x-auto border-y border-border bg-surface xl:block">
            <table className="w-full min-w-[980px] border-collapse text-start">
              <caption className="sr-only">Orders placed on the storefront.</caption>
              <thead>
                <tr className="border-b border-border bg-surface-muted/50 font-mono text-[8px] uppercase tracking-[0.12em] text-foreground-subtle">
                  <th scope="col" className="px-3 py-3">Order ID</th><th scope="col" className="px-3 py-3">Date</th><th scope="col" className="px-3 py-3">Customer</th><th scope="col" className="px-3 py-3">Items</th><th scope="col" className="px-3 py-3 text-end">Total</th><th scope="col" className="px-3 py-3">Payment</th><th scope="col" className="px-3 py-3">Status</th><th scope="col" className="px-3 py-3">Method</th><th scope="col" className="px-3 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {pageOrders.map((order) => <OrderTableRow key={order.id} order={order} />)}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-border border-y border-border bg-surface xl:hidden">
            {pageOrders.map((order) => <OrderMobileCard key={order.id} order={order} />)}
          </ul>

          <nav aria-label="Order ledger pagination" className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-foreground-subtle">Page {page} of {totalPages} · {PAGE_SIZE} orders per page</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={page <= 1} leftIcon={<ArrowUp className="h-3 w-3 -rotate-90" aria-hidden="true" />} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</Button>
              <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} rightIcon={<ArrowDown className="h-3 w-3 -rotate-90" aria-hidden="true" />} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</Button>
            </div>
          </nav>
        </>
      )}

      <Drawer isOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} title="Order filters" subtitle="ORDERS" size="lg" footer={<div className="flex flex-col gap-2 sm:flex-row sm:justify-between"><Button type="button" variant="ghost" onClick={resetFilters}>Reset</Button><Button type="button" variant="primary" onClick={() => setIsFilterDrawerOpen(false)}>Apply filters</Button></div>}>
        {filterControls}
      </Drawer>
    </main>
  );
}

function OrderTableRow({ order }: { order: Order }) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-surface-muted/30">
      <th scope="row" className="px-3 py-4 font-mono text-[10px] font-medium text-foreground"><Link href={`/admin/orders/${encodeURIComponent(order.id)}`} className="underline decoration-border underline-offset-4 hover:decoration-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">{order.orderNumber}</Link><span className="mt-1 block font-normal text-foreground-subtle">{order.allocationReference ?? ''}</span></th>
      <td className="px-3 py-4 text-[10px] text-foreground-muted">{formatOrderDate(order.createdAt)}</td>
      <td className="max-w-[150px] px-3 py-4"><span className="block truncate text-[10px] text-foreground">{order.customerName || 'Not recorded'}</span><span className="mt-1 block truncate text-[9px] text-foreground-subtle">{order.customerEmail || 'Email not recorded'}</span>{order.customerId === 'guest' && <Badge variant="outline" className="mt-2">GUEST</Badge>}</td>
      <td className="px-3 py-4 font-mono text-[10px] tabular-nums text-foreground-muted">{orderUnitCount(order)} units</td>
      <td className="px-3 py-4 text-end font-mono text-[10px] tabular-nums text-foreground">{formatPrice(orderTotals(order).total)}</td>
      <td className="px-3 py-4"><PaymentStatusBadge status={order.paymentStatus} /></td>
      <td className="px-3 py-4"><OrderStatusBadge status={order.status} /></td>
      <td className="px-3 py-4 font-mono text-[8px] uppercase tracking-[0.08em] text-foreground-subtle">{order.paymentMethod}</td>
      <td className="px-3 py-4"><Link href={`/admin/orders/${encodeURIComponent(order.id)}`} aria-label={`Open dossier for ${order.orderNumber}`} className="inline-flex h-10 w-10 items-center justify-center border border-border text-foreground-muted hover:border-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"><ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></Link></td>
    </tr>
  );
}

function OrderMobileCard({ order }: { order: Order }) {
  return (
    <li className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <TechnicalCode>{formatOrderDate(order.createdAt)}</TechnicalCode>
          <Link href={`/admin/orders/${encodeURIComponent(order.id)}`} className="mt-1 block break-words font-display text-lg text-foreground underline decoration-border underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">{order.orderNumber}</Link>
          <p className="mt-1 break-words text-[11px] text-foreground-muted">{order.customerName || 'Not recorded'}</p>
        </div>
        <span className="font-mono text-[11px] tabular-nums text-foreground">{formatPrice(orderTotals(order).total)}</span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-border pt-3">
        <div><dt className="font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">Items</dt><dd className="mt-1 text-[10px] text-foreground">{orderUnitCount(order)} units</dd></div>
        <div><dt className="font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">Method</dt><dd className="mt-1 text-[10px] text-foreground">{order.paymentMethod}</dd></div>
        <div><dt className="font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">Payment</dt><dd className="mt-1"><PaymentStatusBadge status={order.paymentStatus} /></dd></div>
        <div><dt className="font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">Status</dt><dd className="mt-1"><OrderStatusBadge status={order.status} /></dd></div>
      </dl>
    </li>
  );
}

function ShoppingBagIcon() {
  return <span aria-hidden="true" className="inline-flex h-5 w-5 items-center justify-center border border-border font-mono text-[10px]">O</span>;
}
