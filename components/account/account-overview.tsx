import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, ArrowUpRight, Archive, FileText, Layers3 } from 'lucide-react';
import type { Order, Product } from '@/types';
import type { CustomerProfileRecord } from '@/lib/account/contracts';
import { EmptyState, PriceDisplay, TechnicalCode } from '@/components/ui';
import {
  fulfillmentStatusLabel,
  orderStatusLabel,
  formatOrderDate,
  orderDestinationSummary,
  orderTotals,
  orderUnitCount,
  paymentStatusLabel,
} from '@/lib/account/order-utils';

interface AccountOverviewProps {
  profile: CustomerProfileRecord;
  isHydrated: boolean;
  activeAllocationCount: number;
  savedProducts: Product[];
  orders: Order[];
  orderedInstrumentCount: number;
}

export function AccountOverview({
  profile,
  isHydrated,
  activeAllocationCount,
  savedProducts,
  orders,
  orderedInstrumentCount,
}: AccountOverviewProps) {
  const latestActiveOrder = orders.find((order) =>
    order.status === 'pending_settlement' ||
    order.status === 'processing' ||
    order.status === 'Craft & Calibration' ||
    order.status === 'shipped'
  );
  const latestOrder = latestActiveOrder ?? orders[0];
  const t = useTranslations('account.overview');
  const tHeader = useTranslations('account.header');
  const tOrders = useTranslations('orders');
  const locale = useLocale();
  const clientCode = profile.clientCode || tHeader('pending');
  const memberSince = profile.memberSince ? formatOrderDate(profile.memberSince, locale) : tHeader('notRecorded');

  const metrics = [
    { label: t('metrics.clientCode'), value: clientCode, detail: t('metrics.clientCodeDetail') },
    { label: t('metrics.memberSince'), value: memberSince, detail: t('metrics.memberSinceDetail') },
    { label: t('metrics.bag'), value: isHydrated ? String(activeAllocationCount).padStart(2, '0') : '—', detail: t('metrics.bagDetail') },
    { label: t('metrics.saved'), value: isHydrated ? String(savedProducts.length).padStart(2, '0') : '—', detail: t('metrics.savedDetail'), href: '/wishlist' },
    { label: t('metrics.ordered'), value: String(orderedInstrumentCount).padStart(2, '0'), detail: t('metrics.orderedDetail', { count: orders.length }) },
  ];

  return (
    <section id="overview" aria-labelledby="account-overview-heading" className="scroll-mt-28 space-y-7 sm:space-y-9">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <TechnicalCode>{t('code')}</TechnicalCode>
          <h2 id="account-overview-heading" className="mt-2 font-display text-2xl text-foreground sm:text-3xl">
            {t('title')}
          </h2>
        </div>
        <span className="border border-accent/35 px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-accent">
          {t('signedIn')}
        </span>
      </div>

      <dl aria-live="polite" aria-atomic="false" className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        {metrics.map((metric) => (
          <div key={metric.label} className="min-w-0 border border-border bg-surface p-3 sm:p-4">
            <dt className="min-h-8 font-mono text-[9px] uppercase leading-relaxed tracking-[0.11em] text-foreground-subtle">
              {metric.label}
            </dt>
            <dd className="mt-2 min-h-6 break-words font-mono text-sm tabular-nums text-foreground sm:text-base">
              {metric.href ? (
                <Link href={metric.href} className="underline decoration-border underline-offset-4 transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
                  {metric.value}
                </Link>
              ) : metric.value}
            </dd>
            <p className="mt-2 break-words text-[10px] leading-relaxed text-foreground-subtle">{metric.detail}</p>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12 xl:gap-5">
        <section aria-labelledby="latest-allocation-heading" className="min-w-0 border border-border bg-surface p-4 sm:p-6 xl:col-span-7">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
            <div>
              <TechnicalCode>{t('latest.code')}</TechnicalCode>
              <h3 id="latest-allocation-heading" className="mt-2 font-display text-xl text-foreground">{latestActiveOrder ? t('latest.active') : t('latest.recent')}</h3>
            </div>
            <FileText className="h-4 w-4 text-foreground-subtle" aria-hidden="true" />
          </div>

          {latestOrder ? (
            <div className="pt-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-foreground-subtle">{t('latest.placed', { date: formatOrderDate(latestOrder.createdAt, locale) })}</p>
                  <p className="mt-1.5 break-all font-mono text-base tabular-nums text-foreground">{latestOrder.orderNumber}</p>
                </div>
                <span aria-label={t('latest.statusAria', { status: orderStatusLabel(tOrders, latestOrder.status) })} className="border border-border px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-muted">
                  {orderStatusLabel(tOrders, latestOrder.status)}
                </span>
              </div>

              <ul className="mt-4 space-y-2 border-y border-border py-4">
                {latestOrder.items.slice(0, 3).map((item) => (
                  <li key={item.id} className="flex min-w-0 items-baseline justify-between gap-3 text-small">
                    <Link href={`/product/${item.productSlug}`} className="min-w-0 break-words text-foreground transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
                      {item.productName}
                    </Link>
                    <span className="shrink-0 font-mono text-[10px] text-foreground-subtle">× {item.quantity}</span>
                  </li>
                ))}
                {latestOrder.items.length > 3 && (
                  <li className="font-mono text-[9px] uppercase tracking-[0.1em] text-foreground-subtle">{t('latest.more', { count: latestOrder.items.length - 3 })}</li>
                )}
              </ul>

              <dl className="grid grid-cols-2 gap-3 py-4">
                <div className="min-w-0">
                  <dt className="font-mono text-[8px] uppercase tracking-[0.11em] text-foreground-subtle">{t('latest.payment')}</dt>
                  <dd className="mt-1 break-words text-small text-foreground">{paymentStatusLabel(tOrders, latestOrder.paymentStatus)}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="font-mono text-[8px] uppercase tracking-[0.11em] text-foreground-subtle">{t('latest.fulfillment')}</dt>
                  <dd className="mt-1 break-words text-small text-foreground">{fulfillmentStatusLabel(tOrders, latestOrder.status)}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="font-mono text-[8px] uppercase tracking-[0.11em] text-foreground-subtle">{t('latest.units')}</dt>
                  <dd className="mt-1 text-small text-foreground">{t('latest.unitsValue', { count: String(orderUnitCount(latestOrder)).padStart(2, '0') })}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="font-mono text-[8px] uppercase tracking-[0.11em] text-foreground-subtle">{t('latest.destination')}</dt>
                  <dd className="mt-1 break-words text-small text-foreground">{orderDestinationSummary(latestOrder) ?? tOrders('notRecorded')}</dd>
                </div>
              </dl>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <PriceDisplay price={orderTotals(latestOrder).total} size="md" />
                <Link
                  href={`/account/orders/${encodeURIComponent(latestOrder.id)}`}
                  className="inline-flex min-h-11 items-center gap-2 border-b border-foreground px-1 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  {t('latest.view')} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>

              {latestOrder.status === 'pending_settlement' && (
                <p className="mt-4 border border-accent/25 bg-accent/5 p-3 text-[10px] leading-relaxed text-foreground-muted">
                  {t('latest.pendingNote')}
                </p>
              )}
            </div>
          ) : (
            <EmptyState
              code={t('latest.emptyCode')}
              title={t('latest.emptyTitle')}
              description={t('latest.emptyDescription')}
              icon={<Layers3 className="h-5 w-5" aria-hidden="true" />}
              primaryAction={
                <Link href="/shop" className="inline-flex min-h-11 items-center gap-2 border border-foreground bg-foreground px-4 font-mono text-[9px] uppercase tracking-[0.12em] text-background transition-colors hover:bg-foreground/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
                  {t('latest.explore')} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              }
              className="mt-5 p-5 sm:p-6"
            />
          )}
        </section>

        <section aria-labelledby="saved-preview-heading" className="min-w-0 border border-border bg-surface p-4 sm:p-6 xl:col-span-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
            <div>
              <TechnicalCode>{t('saved.code')}</TechnicalCode>
              <h3 id="saved-preview-heading" className="mt-2 font-display text-xl text-foreground">{t('saved.title')}</h3>
            </div>
            <Archive className="h-4 w-4 text-foreground-subtle" aria-hidden="true" />
          </div>

          {!isHydrated ? (
            <div aria-label={t('saved.loading')} aria-busy="true" className="mt-5 grid grid-cols-2 gap-2">
              {[0, 1].map((item) => <div key={item} className="aspect-square animate-pulse bg-surface-muted" />)}
            </div>
          ) : savedProducts.length > 0 ? (
            <>
              <ul className="mt-4 grid grid-cols-2 gap-2">
                {savedProducts.slice(0, 4).map((product, index) => (
                  <li key={product.id} className="min-w-0">
                    <Link href={`/product/${product.slug}`} aria-label={t('saved.open', { name: product.name })} className="group block min-w-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
                      <span className="relative block aspect-square overflow-hidden border border-border bg-surface-muted">
                        <Image src={product.primaryImage} alt="" fill sizes="(min-width: 1280px) 15vw, (min-width: 640px) 25vw, 40vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.025] motion-reduce:transform-none" />
                        <span className="absolute start-2 top-2 bg-background/90 px-1.5 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-foreground">{String(index + 1).padStart(2, '0')}</span>
                      </span>
                      <span className="mt-2 block break-words font-display text-sm leading-snug text-foreground transition-colors group-hover:text-accent">{product.name}</span>
                      <span className="mt-1 block break-words font-mono text-[8px] uppercase tracking-[0.08em] text-foreground-subtle">{product.modelNumber}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/wishlist" className="mt-5 inline-flex min-h-11 w-full items-center justify-between gap-3 border-t border-border pt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
                {t('saved.openWishlist')} <span className="flex items-center gap-1.5"><span>{t('saved.records', { count: String(savedProducts.length).padStart(2, '0') })}</span><ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
              </Link>
            </>
          ) : (
            <EmptyState
              code={t('saved.emptyCode')}
              title={t('saved.emptyTitle')}
              description={t('saved.emptyDescription')}
              icon={<Archive className="h-5 w-5" aria-hidden="true" />}
              primaryAction={<Link href="/wishlist" className="inline-flex min-h-11 items-center border-b border-foreground px-1 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground hover:text-accent">{t('saved.openWishlist')}</Link>}
              className="mt-5 p-5 sm:p-6"
            />
          )}
        </section>
      </div>
    </section>
  );
}
