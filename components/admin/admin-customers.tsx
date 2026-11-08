'use client';

import React, { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowUpRight, Search, Users } from 'lucide-react';
import { Badge, Button, EmptyState, Input, Select } from '@/components/ui';
import { AdminPageHeader } from '@/components/admin/admin-primitives';
import { formatOrderDate } from '@/lib/account/order-utils';
import { formatPrice } from '@/lib/utils';
import type { Customer } from '@/types';

type ClientSort = 'recent' | 'orders' | 'value' | 'name' | 'joined';
function readClientSort(value: string): ClientSort {
  return value === 'orders' || value === 'value' || value === 'name' || value === 'joined' ? value : 'recent';
}

function statusVariant(status: Customer['status']): 'success' | 'accent' | 'default' {
  if (status === 'vip') return 'accent';
  if (status === 'active') return 'success';
  return 'default';
}

export function AdminCustomersWorkspace({ customers }: { customers: Customer[] }) {
  const t = useTranslations('admin.customers');
  const locale = useLocale();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<ClientSort>('recent');

  const visibleClients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return [...customers]
      .filter((client) => !normalized || `${client.fullName} ${client.email} ${client.phone} ${client.location}`.toLowerCase().includes(normalized))
      .sort((a, b) => {
        if (sort === 'orders') return b.ordersCount - a.ordersCount;
        if (sort === 'value') return b.totalSpent - a.totalSpent;
        if (sort === 'name') return a.fullName.localeCompare(b.fullName);
        if (sort === 'joined') return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
        return new Date(b.lastOrderDate || b.joinedAt).getTime() - new Date(a.lastOrderDate || a.joinedAt).getTime();
      });
  }, [customers, query, sort]);

  return (
    <main id="main-content" className="min-w-0">
      <AdminPageHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
      />
      <div className="mb-5 grid grid-cols-1 gap-3 border border-border bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-end">
        <Input label={t('find')} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('findPlaceholder')} leftElement={<Search className="h-4 w-4" aria-hidden="true" />} />
        <Select label={t('sort')} value={sort} onChange={(event) => setSort(readClientSort(event.target.value))} options={[{ label: t('sortRecent'), value: 'recent' }, { label: t('sortOrders'), value: 'orders' }, { label: t('sortValue'), value: 'value' }, { label: t('sortJoined'), value: 'joined' }, { label: t('sortName'), value: 'name' }]} />
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.11em] text-foreground-subtle">
        <span>{t('count', { visible: visibleClients.length, total: customers.length })}</span>
        <span>{t('vip', { count: customers.filter((c) => c.status === 'vip').length })}</span>
      </div>

      {visibleClients.length === 0 ? (
        customers.length === 0 ? (
          <EmptyState code={t('emptyCode')} title={t('emptyTitle')} description={t('emptyDescription')} icon={<Users className="h-5 w-5" aria-hidden="true" />} />
        ) : (
          <EmptyState code={t('noMatchCode')} title={t('noMatchTitle')} description={t('noMatchDescription')} primaryAction={<Button type="button" variant="outline" onClick={() => setQuery('')}>{t('clearSearch')}</Button>} />
        )
      ) : (
        <>
          <div className="hidden overflow-x-auto border-y border-border bg-surface xl:block">
            <table className="w-full min-w-[840px] border-collapse text-start">
              <caption className="sr-only">{t('caption')}</caption>
              <thead><tr className="border-b border-border bg-surface-muted/50 font-mono text-[8px] uppercase tracking-[0.12em] text-foreground-subtle"><th scope="col" className="px-3 py-3">{t('colCustomer')}</th><th scope="col" className="px-3 py-3">{t('colEmail')}</th><th scope="col" className="px-3 py-3">{t('colStatus')}</th><th scope="col" className="px-3 py-3 text-end">{t('colOrders')}</th><th scope="col" className="px-3 py-3 text-end">{t('colValue')}</th><th scope="col" className="px-3 py-3">{t('colLastOrder')}</th><th scope="col" className="px-3 py-3">{t('colJoined')}</th><th scope="col" className="px-3 py-3"><span className="sr-only">{t('colOpen')}</span></th></tr></thead>
              <tbody>{visibleClients.map((client) => (
                <tr key={client.id} className="border-b border-border last:border-0 hover:bg-surface-muted/30">
                  <th scope="row" className="px-3 py-4"><Link href={`/admin/customers/${encodeURIComponent(client.id)}`} className="block break-words text-[11px] font-medium text-foreground underline decoration-border underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">{client.fullName}</Link><span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">{t(`tier.${client.tier}`)}{client.location ? ` · ${client.location}` : ''}</span></th>
                  <td className="max-w-[220px] truncate px-3 py-4 text-[10px] text-foreground-muted">{client.email}</td>
                  <td className="px-3 py-4"><Badge variant={statusVariant(client.status)}>{t(`status.${client.status}`)}</Badge></td>
                  <td className="px-3 py-4 text-end font-mono text-[10px] tabular-nums text-foreground">{client.ordersCount}</td>
                  <td className="px-3 py-4 text-end font-mono text-[10px] tabular-nums text-foreground">{formatPrice(client.totalSpent)}</td>
                  <td className="px-3 py-4 text-[10px] text-foreground-muted">{client.lastOrderDate ? formatOrderDate(client.lastOrderDate, locale) : '—'}</td>
                  <td className="px-3 py-4 text-[10px] text-foreground-muted">{formatOrderDate(client.joinedAt, locale)}</td>
                  <td className="px-3 py-4"><Link href={`/admin/customers/${encodeURIComponent(client.id)}`} aria-label={t('open', { name: client.fullName })} className="inline-flex h-10 w-10 items-center justify-center border border-border hover:border-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"><ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></Link></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <ul className="divide-y divide-border border-y border-border bg-surface xl:hidden">
            {visibleClients.map((client) => (
              <li key={client.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3"><span className="min-w-0"><Link href={`/admin/customers/${encodeURIComponent(client.id)}`} className="break-words font-display text-lg text-foreground underline decoration-border underline-offset-4">{client.fullName}</Link><span className="mt-1 block break-all text-[10px] text-foreground-muted">{client.email}</span></span><Badge variant={statusVariant(client.status)}>{t(`status.${client.status}`)}</Badge></div>
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3"><div><dt className="font-mono text-[8px] uppercase text-foreground-subtle">{t('colOrders')}</dt><dd className="mt-1 font-mono text-small text-foreground">{client.ordersCount}</dd></div><div><dt className="font-mono text-[8px] uppercase text-foreground-subtle">{t('colValue')}</dt><dd className="mt-1 font-mono text-small text-foreground">{formatPrice(client.totalSpent)}</dd></div><div><dt className="font-mono text-[8px] uppercase text-foreground-subtle">{t('colLastOrder')}</dt><dd className="mt-1 text-[10px] text-foreground">{client.lastOrderDate ? formatOrderDate(client.lastOrderDate, locale) : '—'}</dd></div><div><dt className="font-mono text-[8px] uppercase text-foreground-subtle">{t('colJoined')}</dt><dd className="mt-1 text-[10px] text-foreground">{formatOrderDate(client.joinedAt, locale)}</dd></div></dl>
                <Link href={`/admin/customers/${encodeURIComponent(client.id)}`} className="mt-3 inline-flex min-h-11 items-center gap-2 border-b border-border px-1 font-mono text-[9px] uppercase tracking-[0.1em] text-foreground-muted">{t('openProfile')} <ArrowUpRight className="h-3 w-3" aria-hidden="true" /></Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
