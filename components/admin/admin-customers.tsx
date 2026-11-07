'use client';

import React, { useMemo, useState } from 'react';
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
        eyebrow="OPERATIONS // 03 · CUSTOMERS"
        title="Customers"
        description="Every registered account, with order count and lifetime value from confirmed orders. Guest checkouts appear on their orders only."
      />
      <div className="mb-5 grid grid-cols-1 gap-3 border border-border bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-end">
        <Input label="Find customer" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, email, phone…" leftElement={<Search className="h-4 w-4" aria-hidden="true" />} />
        <Select label="Sort" value={sort} onChange={(event) => setSort(readClientSort(event.target.value))} options={[{ label: 'Most recent order', value: 'recent' }, { label: 'Most orders', value: 'orders' }, { label: 'Highest lifetime value', value: 'value' }, { label: 'Newest accounts', value: 'joined' }, { label: 'Name A—Z', value: 'name' }]} />
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.11em] text-foreground-subtle">
        <span>{visibleClients.length} of {customers.length} customers</span>
        <span>VIP // {customers.filter((c) => c.status === 'vip').length}</span>
      </div>

      {visibleClients.length === 0 ? (
        customers.length === 0 ? (
          <EmptyState code="CUSTOMERS // EMPTY" title="No customers yet." description="Accounts appear here as soon as someone signs up on the storefront." icon={<Users className="h-5 w-5" aria-hidden="true" />} />
        ) : (
          <EmptyState code="CUSTOMERS // 00 MATCHES" title="No customers match this search." description="Try another name or email, or clear the search." primaryAction={<Button type="button" variant="outline" onClick={() => setQuery('')}>Clear search</Button>} />
        )
      ) : (
        <>
          <div className="hidden overflow-x-auto border-y border-border bg-surface xl:block">
            <table className="w-full min-w-[840px] border-collapse text-start">
              <caption className="sr-only">Registered customers.</caption>
              <thead><tr className="border-b border-border bg-surface-muted/50 font-mono text-[8px] uppercase tracking-[0.12em] text-foreground-subtle"><th scope="col" className="px-3 py-3">Customer</th><th scope="col" className="px-3 py-3">Email</th><th scope="col" className="px-3 py-3">Status</th><th scope="col" className="px-3 py-3 text-end">Orders</th><th scope="col" className="px-3 py-3 text-end">Lifetime value</th><th scope="col" className="px-3 py-3">Last order</th><th scope="col" className="px-3 py-3">Joined</th><th scope="col" className="px-3 py-3"><span className="sr-only">Open</span></th></tr></thead>
              <tbody>{visibleClients.map((client) => (
                <tr key={client.id} className="border-b border-border last:border-0 hover:bg-surface-muted/30">
                  <th scope="row" className="px-3 py-4"><Link href={`/admin/customers/${encodeURIComponent(client.id)}`} className="block break-words text-[11px] font-medium text-foreground underline decoration-border underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">{client.fullName}</Link><span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">{client.tier}{client.location ? ` · ${client.location}` : ''}</span></th>
                  <td className="max-w-[220px] truncate px-3 py-4 text-[10px] text-foreground-muted">{client.email}</td>
                  <td className="px-3 py-4"><Badge variant={statusVariant(client.status)}>{client.status.toUpperCase()}</Badge></td>
                  <td className="px-3 py-4 text-end font-mono text-[10px] tabular-nums text-foreground">{client.ordersCount}</td>
                  <td className="px-3 py-4 text-end font-mono text-[10px] tabular-nums text-foreground">{formatPrice(client.totalSpent)}</td>
                  <td className="px-3 py-4 text-[10px] text-foreground-muted">{client.lastOrderDate ? formatOrderDate(client.lastOrderDate) : '—'}</td>
                  <td className="px-3 py-4 text-[10px] text-foreground-muted">{formatOrderDate(client.joinedAt)}</td>
                  <td className="px-3 py-4"><Link href={`/admin/customers/${encodeURIComponent(client.id)}`} aria-label={`Open ${client.fullName}`} className="inline-flex h-10 w-10 items-center justify-center border border-border hover:border-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"><ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></Link></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <ul className="divide-y divide-border border-y border-border bg-surface xl:hidden">
            {visibleClients.map((client) => (
              <li key={client.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3"><span className="min-w-0"><Link href={`/admin/customers/${encodeURIComponent(client.id)}`} className="break-words font-display text-lg text-foreground underline decoration-border underline-offset-4">{client.fullName}</Link><span className="mt-1 block break-all text-[10px] text-foreground-muted">{client.email}</span></span><Badge variant={statusVariant(client.status)}>{client.status.toUpperCase()}</Badge></div>
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3"><div><dt className="font-mono text-[8px] uppercase text-foreground-subtle">Orders</dt><dd className="mt-1 font-mono text-small text-foreground">{client.ordersCount}</dd></div><div><dt className="font-mono text-[8px] uppercase text-foreground-subtle">Lifetime value</dt><dd className="mt-1 font-mono text-small text-foreground">{formatPrice(client.totalSpent)}</dd></div><div><dt className="font-mono text-[8px] uppercase text-foreground-subtle">Last order</dt><dd className="mt-1 text-[10px] text-foreground">{client.lastOrderDate ? formatOrderDate(client.lastOrderDate) : '—'}</dd></div><div><dt className="font-mono text-[8px] uppercase text-foreground-subtle">Joined</dt><dd className="mt-1 text-[10px] text-foreground">{formatOrderDate(client.joinedAt)}</dd></div></dl>
                <Link href={`/admin/customers/${encodeURIComponent(client.id)}`} className="mt-3 inline-flex min-h-11 items-center gap-2 border-b border-border px-1 font-mono text-[9px] uppercase tracking-[0.1em] text-foreground-muted">Open profile <ArrowUpRight className="h-3 w-3" aria-hidden="true" /></Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
