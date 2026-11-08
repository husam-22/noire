import { Link } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUpRight, ClipboardList, FileText } from 'lucide-react';
import type { Order } from '@/types';
import { EmptyState, PriceDisplay, TechnicalCode } from '@/components/ui';
import {
  fulfillmentStatusLabel,
  orderStatusLabel,
  formatOrderDate,
  orderDestinationSummary,
  orderPaymentMethodLabel,
  orderTotals,
  orderUnitCount,
  paymentStatusLabel,
} from '@/lib/account/order-utils';

export function AccountOrders({ orders }: { orders: Order[] }) {
  const t = useTranslations('account.orders');
  const tOrders = useTranslations('orders');
  const locale = useLocale();
  return (
    <section id="order-archive" aria-labelledby="order-archive-heading" className="scroll-mt-28 space-y-5 sm:space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <TechnicalCode>{t('code')}</TechnicalCode>
          <h2 id="order-archive-heading" className="mt-2 font-display text-2xl text-foreground sm:text-3xl">
            {t('title')}
          </h2>
          <p className="mt-2 max-w-2xl text-small leading-relaxed text-foreground-muted">
            {t('intro')}
          </p>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-foreground-subtle">
          {t('count', { count: String(orders.length).padStart(2, '0') })}
        </span>
      </div>

      {orders.length > 0 ? (
        <ol className="space-y-3">
          {orders.map((order) => {
            const totals = orderTotals(order);
            const destination = orderDestinationSummary(order);
            return (
              <li key={order.id}>
                <article className="min-w-0 border border-border bg-surface p-4 transition-colors hover:border-foreground/40 sm:p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <TechnicalCode>{t('orderCode', { number: order.orderNumber })}</TechnicalCode>
                        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-foreground-subtle">
                          {formatOrderDate(order.createdAt, locale)}
                        </span>
                      </div>
                      <h3 className="mt-2 break-all font-display text-xl text-foreground">
                        {order.orderNumber}
                      </h3>
                      <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-foreground-subtle">
                        {t('unitsMethod', { count: String(orderUnitCount(order)).padStart(2, '0'), method: orderPaymentMethodLabel(tOrders, order) })}
                      </p>

                      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-y border-border py-3 text-small text-foreground-muted">
                        {order.items.slice(0, 3).map((item) => (
                          <li key={item.id} className="flex min-w-0 items-center gap-2">
                            <span className="h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                            <span className="max-w-[220px] break-words">{item.productName}</span>
                            <span className="shrink-0 font-mono text-[9px] text-foreground-subtle">×{item.quantity}</span>
                          </li>
                        ))}
                        {order.items.length > 3 && (
                          <li className="font-mono text-[9px] uppercase tracking-[0.1em] text-foreground-subtle">{t('more', { count: order.items.length - 3 })}</li>
                        )}
                      </ul>
                    </div>

                    <dl className="grid min-w-0 grid-cols-2 gap-x-5 gap-y-4 border-y border-border py-3 lg:w-[19rem] lg:border-y-0 lg:py-0">
                      <div className="min-w-0">
                        <dt className="font-mono text-[8px] uppercase tracking-[0.12em] text-foreground-subtle">{t('payment')}</dt>
                        <dd aria-label={t('paymentAria', { status: paymentStatusLabel(tOrders, order.paymentStatus) })} className="mt-1 break-words text-small text-foreground">{paymentStatusLabel(tOrders, order.paymentStatus)}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="font-mono text-[8px] uppercase tracking-[0.12em] text-foreground-subtle">{t('fulfillment')}</dt>
                        <dd aria-label={t('fulfillmentAria', { status: fulfillmentStatusLabel(tOrders, order.status) })} className="mt-1 break-words text-small text-foreground">{fulfillmentStatusLabel(tOrders, order.status)}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="font-mono text-[8px] uppercase tracking-[0.12em] text-foreground-subtle">{t('status')}</dt>
                        <dd className="mt-1 break-words text-small text-foreground">{orderStatusLabel(tOrders, order.status)}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="font-mono text-[8px] uppercase tracking-[0.12em] text-foreground-subtle">{t('destination')}</dt>
                        <dd className="mt-1 break-words text-small text-foreground">{destination ?? tOrders('notRecorded')}</dd>
                      </div>
                      <div className="col-span-2 flex items-end justify-between gap-3 border-t border-border pt-3">
                        <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-foreground-subtle">{t('total', { currency: order.currency })}</span>
                        <PriceDisplay price={totals.total} size="md" />
                      </div>
                    </dl>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                    <p className="flex min-w-0 items-start gap-2 text-[10px] leading-relaxed text-foreground-subtle">
                      <ClipboardList className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>{t('placed', { date: formatOrderDate(order.createdAt, locale) })}{order.trackingNumber ? t('tracking', { number: order.trackingNumber }) : ''}</span>
                    </p>
                    <Link
                      href={`/account/orders/${encodeURIComponent(order.id)}`}
                      aria-label={t('viewAria', { number: order.orderNumber })}
                      className="inline-flex min-h-11 shrink-0 items-center gap-2 border-b border-foreground px-1 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                    >
                      {t('view')} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      ) : (
        <EmptyState
          code={t('emptyCode')}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          icon={<FileText className="h-5 w-5" aria-hidden="true" />}
          primaryAction={
            <Link href="/shop" className="inline-flex min-h-11 items-center gap-2 border border-foreground bg-foreground px-4 font-mono text-[9px] uppercase tracking-[0.12em] text-background transition-colors hover:bg-foreground/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
              {t('browse')} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          }
          secondaryAction={
            <Link href="/cart" className="inline-flex min-h-11 items-center border-b border-border px-1 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground-muted transition-colors hover:border-foreground hover:text-foreground">
              {t('reviewBag')}
            </Link>
          }
          className="p-5 sm:p-8"
        />
      )}
    </section>
  );
}
