'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight, ArrowUpRight, CircleAlert, Package, ShoppingBag } from 'lucide-react';
import { Badge, EmptyState, TechnicalCode } from '@/components/ui';
import { AdminMetric, AdminPageHeader, OrderStatusBadge } from '@/components/admin/admin-primitives';
import { formatOrderDate, orderTotals } from '@/lib/account/order-utils';
import type { DashboardStats, Order, Product } from '@/types';
import { formatPrice } from '@/lib/utils';

interface AdminOverviewProps {
  stats: DashboardStats;
  orders: Order[];
  products: Product[];
}

export function AdminOverview({ stats, orders, products }: AdminOverviewProps) {
  const t = useTranslations('admin.overview');
  const locale = useLocale();
  const trend = (value: number): string => {
    if (!Number.isFinite(value) || value === 0) return t('noChange');
    return t('trend', { value: `${value > 0 ? '+' : ''}${value.toFixed(1)}` });
  };
  const recentOrders = stats.recentOrders.length > 0 ? stats.recentOrders.slice(0, 6) : orders.slice(0, 6);
  const pendingSettlement = orders.filter((order) => order.status === 'pending_settlement').length;
  const processingOrders = orders.filter((order) => order.status === 'processing' || order.status === 'Craft & Calibration').length;
  const shippedOrders = orders.filter((order) => order.status === 'shipped').length;
  const unpaidOrders = orders.filter((order) => order.paymentStatus === 'pending' && order.status !== 'cancelled').length;
  const activeProducts = products.filter((product) => product.status === 'active').length;
  const draftProducts = products.filter((product) => product.status === 'draft').length;
  const lowStock = stats.inventoryAlerts;

  return (
    <main id="main-content" className="min-w-0">
      <AdminPageHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        actions={<Link href="/admin/orders?status=pending_settlement" className="inline-flex min-h-11 items-center gap-2 border border-foreground bg-foreground px-4 font-mono text-[9px] uppercase tracking-[0.12em] text-background transition-colors hover:bg-foreground/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">{t('ordersToConfirm')} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>}
      />

      <section aria-labelledby="kpi-heading" className="mb-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <TechnicalCode>{t('kpiCode')}</TechnicalCode>
            <h2 id="kpi-heading" className="mt-1 font-display text-xl text-foreground">{t('kpiTitle')}</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
          <AdminMetric index="KPI // 01" label={t('paidRevenue')} value={formatPrice(stats.totalRevenue)} note={trend(stats.revenueChangePercentage)} />
          <AdminMetric index="KPI // 02" label={t('orders')} value={stats.totalOrders} note={trend(stats.ordersChangePercentage)} />
          <AdminMetric index="KPI // 03" label={t('aov')} value={stats.averageOrderValue > 0 ? formatPrice(stats.averageOrderValue) : '—'} note={t('paidOnly')} />
          <AdminMetric index="KPI // 04" label={t('newCustomers')} value={stats.totalCustomers} note={trend(stats.customersChangePercentage)} />
        </div>
      </section>

      <section aria-labelledby="queue-heading" className="mb-8">
        <div className="mb-3">
          <TechnicalCode>{t('queueCode')}</TechnicalCode>
          <h2 id="queue-heading" className="mt-1 font-display text-xl text-foreground">{t('queueTitle')}</h2>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <QueueMetric label={t('awaitingConfirmation')} value={pendingSettlement} note={t('awaitingConfirmationNote')} icon={<CircleAlert className="h-4 w-4" aria-hidden="true" />} href="/admin/orders?status=pending_settlement" />
          <QueueMetric label={t('paymentPending')} value={unpaidOrders} note={t('paymentPendingNote')} icon={<ShoppingBag className="h-4 w-4" aria-hidden="true" />} href="/admin/orders" />
          <QueueMetric label={t('inProduction')} value={processingOrders} note={t('inProductionNote')} icon={<Package className="h-4 w-4" aria-hidden="true" />} href="/admin/orders?status=processing" />
          <QueueMetric label={t('lowStock')} value={lowStock.length} note={t('lowStockNote')} icon={<Package className="h-4 w-4" aria-hidden="true" />} href="/admin/inventory" />
        </div>
      </section>

      <section aria-labelledby="catalog-heading" className="mb-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <TechnicalCode>{t('catalogCode')}</TechnicalCode>
            <h2 id="catalog-heading" className="mt-1 font-display text-xl text-foreground">{t('catalogTitle')}</h2>
          </div>
          <Link href="/admin/products" className="inline-flex min-h-11 items-center gap-2 font-mono text-[9px] uppercase tracking-[0.11em] text-foreground-muted underline decoration-border underline-offset-4 hover:text-foreground">{t('manageProducts')} <ArrowUpRight className="h-3 w-3" aria-hidden="true" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
          <AdminMetric index="CAT // 01" label={t('activeProducts')} value={activeProducts} note={t('activeProductsNote')} />
          <AdminMetric index="CAT // 02" label={t('drafts')} value={draftProducts} note={t('draftsNote')} />
          <AdminMetric index="CAT // 03" label={t('shipped')} value={shippedOrders} note={t('shippedNote')} />
          <AdminMetric index="CAT // 04" label={t('allOrders')} value={orders.length} note={t('allOrdersNote')} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-8">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <TechnicalCode>{t('recentCode')}</TechnicalCode>
              <h2 className="mt-1 font-display text-xl text-foreground">{t('recentTitle')}</h2>
            </div>
            <Link href="/admin/orders" className="min-h-11 border-b border-border px-1 py-3 font-mono text-[9px] uppercase tracking-[0.1em] text-foreground-muted hover:text-foreground">{t('allOrders')}</Link>
          </div>
          {recentOrders.length > 0 ? (
            <div className="border-y border-border bg-surface">
              {recentOrders.map((order) => (
                <Link key={order.id} href={`/admin/orders/${encodeURIComponent(order.id)}`} className="grid min-h-16 grid-cols-1 gap-2 border-b border-border px-4 py-3 transition-colors last:border-0 hover:bg-surface-muted/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-foreground sm:grid-cols-[1fr_1.3fr_auto_auto] sm:items-center sm:gap-4">
                  <span className="min-w-0">
                    <span className="block font-mono text-[10px] font-medium text-foreground">{order.orderNumber}</span>
                    <span className="mt-1 block text-[10px] text-foreground-subtle">{formatOrderDate(order.createdAt, locale)}</span>
                  </span>
                  <span className="min-w-0 truncate text-[11px] text-foreground-muted">{order.customerName || order.customerEmail || t('customer')}</span>
                  <OrderStatusBadge status={order.status} />
                  <span className="text-end font-mono text-[11px] tabular-nums text-foreground">{formatPrice(orderTotals(order).total)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState code={t('emptyCode')} title={t('emptyTitle')} description={t('emptyDescription')} icon={<ShoppingBag className="h-5 w-5" aria-hidden="true" />} className="p-5 sm:p-7" />
          )}
        </div>

        <aside className="min-w-0 xl:col-span-4">
          <div className="mb-3">
            <TechnicalCode>{t('alertsCode')}</TechnicalCode>
            <h2 className="mt-1 font-display text-xl text-foreground">{t('alertsTitle')}</h2>
          </div>
          <div className="border-y border-border bg-surface">
            {lowStock.slice(0, 6).map((alert) => (
              <Link key={alert.productId} href="/admin/inventory" className="flex min-h-14 items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-surface-muted/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-foreground">
                <span className="min-w-0">
                  <span className="block truncate text-[11px] text-foreground">{alert.productName}</span>
                  <span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">{alert.sku}</span>
                </span>
                <span className="shrink-0 text-end">
                  <Badge variant={alert.severity === 'critical' ? 'danger' : 'warning'}>{alert.severity === 'critical' ? t('critical') : t('low')}</Badge>
                  <span className="mt-1 block font-mono text-[9px] tabular-nums text-foreground-subtle">{t('units', { count: alert.currentStock })}</span>
                </span>
              </Link>
            ))}
            {lowStock.length === 0 && <p className="px-4 py-5 text-small text-foreground-muted">{t('allAbove')}</p>}
          </div>
        </aside>
      </section>
    </main>
  );
}

function QueueMetric({
  label,
  value,
  note,
  icon,
  href,
}: {
  label: string;
  value: number;
  note: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href} className="flex min-h-24 items-start gap-3 border border-border bg-surface p-4 transition-colors hover:bg-surface-muted/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
      <span className="mt-0.5 text-accent">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-foreground-subtle">{label}</span>
        <span className="mt-1 block font-display text-2xl tabular-nums text-foreground">{value}</span>
        <span className="mt-1 block text-[10px] leading-relaxed text-foreground-muted">{note}</span>
      </span>
      <ArrowUpRight className="h-3 w-3 shrink-0 text-foreground-subtle" aria-hidden="true" />
    </Link>
  );
}
