'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, ArrowUpRight, UserRound } from 'lucide-react';
import { Badge, Button, EmptyState, Select, TechnicalCode, Textarea, useToast } from '@/components/ui';
import { AdminPageHeader, AdminSurface, OrderStatusBadge } from '@/components/admin/admin-primitives';
import { updateAdminCustomer } from '@/lib/admin/actions';
import { formatOrderDate, orderTotals, orderUnitCount } from '@/lib/account/order-utils';
import { formatPrice } from '@/lib/utils';
import type { Customer, Order } from '@/types';

const STATUS_OPTIONS: Customer['status'][] = ['active', 'vip', 'inactive'];
const TIER_OPTIONS: Customer['tier'][] = ['Member', 'Collector', 'Private Client'];

export function AdminCustomerDossier({ customer, orders }: { customer: Customer | null; orders: Order[] }) {
  const router = useRouter();
  const t = useTranslations('admin.customerDossier');
  const tCustomers = useTranslations('admin.customers');
  const locale = useLocale();
  const { addToast } = useToast();
  const [status, setStatus] = useState<Customer['status']>(customer?.status ?? 'active');
  const [tier, setTier] = useState<Customer['tier']>(customer?.tier ?? 'Member');
  const [notes, setNotes] = useState(customer?.notes ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const completedEvents = useMemo(
    () => orders
      .flatMap((order) => order.timeline.filter((event) => event.completed).map((event) => ({ ...event, orderNumber: order.orderNumber, orderId: order.id })))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8),
    [orders]
  );

  if (!customer) {
    return (
      <main id="main-content" className="min-w-0">
        <AdminPageHeader eyebrow={t('nfEyebrow')} title={t('nfTitle')} description={t('nfDescription')} />
        <EmptyState code={t('nfCode')} title={t('nfEmptyTitle')} description={t('nfEmptyDescription')} icon={<UserRound className="h-5 w-5" aria-hidden="true" />} primaryAction={<Link href="/admin/customers" className="inline-flex min-h-11 items-center border border-foreground bg-foreground px-4 font-mono text-[9px] uppercase tracking-[0.12em] text-background">{t('backToCustomers')}</Link>} />
      </main>
    );
  }

  const isDirty = status !== customer.status || tier !== customer.tier || (notes.trim() || '') !== (customer.notes ?? '');

  const save = async () => {
    setIsSaving(true);
    const result = await updateAdminCustomer(customer.id, { status, tier, notes: notes.trim() || null });
    setIsSaving(false);
    if (!result.ok) {
      addToast({ type: 'error', title: t('toastError'), description: result.error });
      return;
    }
    addToast({ type: 'success', title: t('toastSaved'), description: t('toastSavedBody', { name: customer.fullName }) });
    router.refresh();
  };

  return (
    <main id="main-content" className="min-w-0">
      <AdminPageHeader
        eyebrow={t('eyebrow')}
        title={customer.fullName}
        description={t('description', { date: formatOrderDate(customer.joinedAt, locale), orders: customer.ordersCount, value: formatPrice(customer.totalSpent) })}
        actions={<Link href="/admin/customers" className="inline-flex min-h-11 items-center gap-2 border border-border bg-surface px-4 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground-muted hover:border-foreground"><ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> {t('customers')}</Link>}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-4">
          <AdminSurface className="p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-3 border-b border-border pb-3"><UserRound className="h-4 w-4 text-accent" aria-hidden="true" /><div><TechnicalCode>{t('contactCode')}</TechnicalCode><h2 className="mt-1 font-display text-lg text-foreground">{t('profile')}</h2></div></div>
            <dl className="space-y-3">
              <IdentityRow label={t('name')} value={customer.fullName} />
              <IdentityRow label={t('email')} value={customer.email} />
              <IdentityRow label={t('phone')} value={customer.phone || t('notProvided')} />
              <IdentityRow label={t('location')} value={customer.location || t('notProvided')} />
              <IdentityRow label={t('joined')} value={formatOrderDate(customer.joinedAt, locale)} />
            </dl>
          </AdminSurface>

          <AdminSurface className="p-4 sm:p-5">
            <TechnicalCode>{t('accountCode')}</TechnicalCode>
            <div className="mt-3 space-y-3">
              <Select label={t('status')} value={status} onChange={(event) => { const next = STATUS_OPTIONS.find((candidate) => candidate === event.target.value); if (next) setStatus(next); }} options={STATUS_OPTIONS.map((value) => ({ label: tCustomers(`status.${value}`), value }))} />
              <Select label={t('tier')} value={tier} onChange={(event) => { const next = TIER_OPTIONS.find((candidate) => candidate === event.target.value); if (next) setTier(next); }} options={TIER_OPTIONS.map((value) => ({ label: tCustomers(`tier.${value}`), value }))} />
              <Textarea label={t('notes')} value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} hint={t('notesHint')} />
              <Button type="button" variant="primary" size="sm" disabled={!isDirty} isLoading={isSaving} onClick={() => void save()}>{t('save')}</Button>
            </div>
          </AdminSurface>

          <AdminSurface className="p-4 sm:p-5">
            <TechnicalCode>{t('valueCode')}</TechnicalCode>
            <dl className="mt-3 divide-y divide-border border-y border-border">
              <IdentityRow label={t('orders')} value={String(customer.ordersCount)} />
              <IdentityRow label={t('lifetimeValue')} value={formatPrice(customer.totalSpent)} />
              <IdentityRow label={t('averageOrder')} value={formatPrice(customer.averageOrderValue)} />
              <IdentityRow label={t('lastOrder')} value={customer.lastOrderDate ? formatOrderDate(customer.lastOrderDate, locale) : '—'} />
            </dl>
            <p className="mt-3 text-[9px] leading-relaxed text-foreground-subtle">{t('valueNote')}</p>
          </AdminSurface>
        </div>

        <div className="min-w-0 space-y-4 xl:col-span-8">
          <AdminSurface className="p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3"><div><TechnicalCode>{t('historyCode')}</TechnicalCode><h2 className="mt-1 font-display text-lg text-foreground">{t('orders')}</h2></div><Badge variant="outline">{t('ordersCount', { count: orders.length })}</Badge></div>
            {orders.length ? (
              <ul className="divide-y divide-border border-y border-border">
                {orders.map((order) => (
                  <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <span className="min-w-0"><Link href={`/admin/orders/${encodeURIComponent(order.id)}`} className="font-mono text-[10px] text-foreground underline decoration-border underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">{order.orderNumber}</Link><span className="mt-1 block text-[9px] text-foreground-subtle">{formatOrderDate(order.createdAt, locale)} · {t('units', { count: orderUnitCount(order) })}</span></span>
                    <span className="flex items-center gap-3"><OrderStatusBadge status={order.status} /><span className="font-mono text-[10px] tabular-nums text-foreground">{formatPrice(orderTotals(order).total)}</span><Link href={`/admin/orders/${encodeURIComponent(order.id)}`} aria-label={t('openOrder', { number: order.orderNumber })} className="inline-flex h-9 w-9 items-center justify-center border border-border hover:border-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"><ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></Link></span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-small text-foreground-muted">{t('noOrders')}</p>}
          </AdminSurface>

          <AdminSurface className="p-4 sm:p-5">
            <div className="mb-4 border-b border-border pb-3"><TechnicalCode>{t('activityCode')}</TechnicalCode><h2 className="mt-1 font-display text-lg text-foreground">{t('activityTitle')}</h2></div>
            {completedEvents.length ? (
              <ol className="space-y-0 border-s border-border ps-4">
                {completedEvents.map((event) => <li key={`${event.orderNumber}-${event.id}`} className="relative pb-4 last:pb-0"><span className="absolute -start-[1.32rem] top-1 h-2 w-2 rounded-full border border-accent bg-accent" aria-hidden="true" /><p className="break-words font-mono text-[9px] uppercase tracking-[0.1em] text-foreground">{event.status}</p><p className="mt-1 text-[10px] leading-relaxed text-foreground-muted">{event.description}</p><p className="mt-1 font-mono text-[8px] uppercase tracking-[0.08em] text-foreground-subtle"><Link href={`/admin/orders/${encodeURIComponent(event.orderId)}`} className="underline decoration-border underline-offset-2">{event.orderNumber}</Link> · {formatOrderDate(event.timestamp, locale)}</p></li>)}
              </ol>
            ) : <p className="text-small text-foreground-muted">{t('noActivity')}</p>}
          </AdminSurface>

          <AdminSurface className="p-4 sm:p-5">
            <div className="mb-4 border-b border-border pb-3"><TechnicalCode>{t('addressesCode')}</TechnicalCode><h2 className="mt-1 font-display text-lg text-foreground">{t('addressesTitle')}</h2></div>
            {customer.addresses.length ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {customer.addresses.map((address, index) => (
                  <address key={address.id} className="min-w-0 border border-border p-3 not-italic">
                    <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">{address.label || t('addressN', { index: String(index + 1).padStart(2, '0') })}{address.isDefaultShipping ? t('defaultShipping') : ''}{address.isDefaultBilling ? t('defaultBilling') : ''}</span>
                    <span className="mt-2 block text-small text-foreground">{address.firstName} {address.lastName}</span>
                    {address.company && <span className="block text-[10px] text-foreground-muted">{address.company}</span>}
                    <span className="mt-1 block break-words text-[10px] leading-relaxed text-foreground-muted">{address.line1}{address.line2 ? `, ${address.line2}` : ''}<br />{[address.city, address.state, address.postalCode].filter(Boolean).join(', ')}<br />{address.country}</span>
                    {address.phone && <span className="mt-1 block font-mono text-[8px] text-foreground-subtle">{address.phone}</span>}
                  </address>
                ))}
              </div>
            ) : <p className="text-small text-foreground-muted">{t('noAddresses')}</p>}
          </AdminSurface>
        </div>
      </div>
    </main>
  );
}

function IdentityRow({ label, value }: { label: string; value: string }) {
  return <div className="flex flex-col gap-1 border-b border-border py-2 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-3"><dt className="font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">{label}</dt><dd className="break-words text-[10px] text-foreground sm:text-end">{value}</dd></div>;
}
