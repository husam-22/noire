'use client';

import React from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { orderStatusLabel, paymentMethodTypeLabel, paymentStatusLabel } from '@/lib/i18n/order-labels';
import { ArrowDown, ArrowRight, ArrowUpRight, CircleCheck, FileText, ShieldAlert, Truck } from 'lucide-react';
import type { Order } from '@/types';
import { Button, EmptyState, PriceDisplay, TechnicalCode } from '@/components/ui';
import { Container } from '@/components/layout';
import { formatPrice } from '@/lib/utils';
import { useStorefrontContent } from '@/lib/context/storefront-content-context';

interface OrderConfirmationExperienceProps {
  order: Order | null;
}

export function OrderConfirmationSkeleton() {
  const t = useTranslations('orderConfirmation');
  return (
    <section className="bg-background py-16">
      <Container size="wide">
        <div aria-busy="true" aria-label={t('loading')} className="animate-pulse space-y-8">
          <div className="h-4 w-56 bg-surface-muted" />
          <div className="h-14 w-80 max-w-full bg-surface-muted" />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="h-72 border border-border bg-surface lg:col-span-7" />
            <div className="h-72 border border-border bg-surface lg:col-span-5" />
          </div>
        </div>
      </Container>
    </section>
  );
}

function orderTotals(order: Order) {
  return order.totals ?? {
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    shippingCost: order.shippingCost,
    taxAmount: order.taxAmount,
    total: order.total,
    currency: order.currency,
  };
}

export function OrderConfirmationExperience({ order }: OrderConfirmationExperienceProps) {
  const t = useTranslations('orderConfirmation');
  const tOrders = useTranslations('orders');
  const locale = useLocale();
  const storefront = useStorefrontContent();
  if (!order) {
    return (
      <section className="bg-background py-10 sm:py-16">
        <Container size="wide">
          <div className="mb-8 border-b border-border pb-5">
            <TechnicalCode>{t('brand')}</TechnicalCode>
          </div>
          <EmptyState
            code={t('notFound.code')}
            title={t('notFound.title')}
            description={t('notFound.description')}
            icon={<FileText className="h-6 w-6" aria-hidden="true" />}
            primaryAction={<Link href="/shop"><Button withArrow="right">{t('notFound.continue')}</Button></Link>}
            secondaryAction={<Link href="/account" className="inline-flex min-h-11 items-center border-b border-foreground font-mono text-[10px] uppercase tracking-[0.13em]">{t('notFound.account')}</Link>}
            className="min-h-[320px]"
          />
        </Container>
      </section>
    );
  }

  const totals = orderTotals(order);
  const paymentIsPending = order.paymentStatus === 'pending';
  const isBankTransfer = order.paymentSummary?.methodType === 'bank_transfer';
  const supportLine = [storefront.supportEmail, storefront.supportPhone].filter(Boolean).join(' · ');
  const customerName = order.customerName || `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`;
  const shipping = order.shippingMethod;
  const paymentMethodText = paymentMethodTypeLabel(tOrders, order.paymentSummary?.methodType, order.paymentMethod);

  return (
    <main id="main-content" className="bg-background pb-16 text-foreground">
      <section className="surface-obsidian border-b border-border py-14 text-foreground-inverse sm:py-20">
        <Container size="wide">
          <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="mb-6 flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center border border-foreground-inverse/25" aria-hidden="true">
                  <CircleCheck className="h-4 w-4" />
                </span>
                <p className="font-mono text-label uppercase tracking-[0.16em] text-foreground-inverse/70">{paymentIsPending ? t('hero.received') : t('hero.confirmed')}</p>
              </div>
              <h1 className="max-w-4xl break-words font-display text-h1 leading-[1.04]">{t('hero.title', { name: customerName })}<span className="text-accent">.</span></h1>
              <p className="mt-5 max-w-2xl text-small leading-relaxed text-foreground-inverse/70 sm:text-body">
                {t('hero.intro', { email: order.customerEmail })}
              </p>
            </div>
            <div className="border-t border-foreground-inverse/20 pt-5 lg:col-span-4 lg:border-s lg:border-t-0 lg:ps-7 lg:pt-0">
              <TechnicalCode className="text-foreground-inverse/55">{order.allocationReference ?? t('hero.reference')}</TechnicalCode>
              <p className="mt-2 break-words font-mono text-xl tabular-nums text-foreground-inverse">{order.orderNumber}</p>
              <p className="mt-2 break-all text-small text-foreground-inverse/65">{order.customerEmail}</p>
            </div>
          </div>
        </Container>
      </section>

      <Container size="wide" className="py-8 sm:py-12">
        {paymentIsPending && (
          <section role="status" aria-live="polite" className="mb-8 border border-accent/30 bg-accent/5 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <div>
                <h2 className="font-mono text-label uppercase tracking-[0.15em] text-accent">{t('pending.title', { method: paymentMethodText })}</h2>
                <p className="mt-2 max-w-4xl text-small leading-relaxed text-foreground">
                  {isBankTransfer
                    ? t('pending.bank', { amount: formatPrice(totals.total), orderNumber: order.orderNumber })
                    : t('pending.cash', { amount: formatPrice(totals.total) })}
                </p>
                {isBankTransfer && storefront.bankTransferInstructions && (
                  <div className="mt-4 border border-border bg-background p-4">
                    <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-foreground-subtle">{t('pending.bankDetails')}</p>
                    <pre className="mt-2 whitespace-pre-wrap font-sans text-small leading-relaxed text-foreground">{storefront.bankTransferInstructions}</pre>
                    <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.13em] text-foreground-subtle">{t('pending.reference', { orderNumber: order.orderNumber })}</p>
                  </div>
                )}
                {supportLine && (
                  <p className="mt-3 text-small text-foreground-muted">{t('pending.support', { contact: supportLine })}</p>
                )}
              </div>
            </div>
          </section>
        )}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[9px] uppercase tracking-[0.13em] text-foreground-subtle">
            <span>{t('meta.order', { orderNumber: order.orderNumber })}</span>
            <span>{t('meta.status', { status: orderStatusLabel(tOrders, order.status) })}</span>
            <span>{t('meta.payment', { status: paymentStatusLabel(tOrders, order.paymentStatus) })}</span>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <a href="#order-record" className="inline-flex min-h-11 items-center gap-2 border-b border-border-strong/70 font-mono text-[10px] uppercase tracking-[0.13em] text-foreground-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
              {t('meta.view')} <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
            <Link href="/shop" className="inline-flex min-h-11 items-center gap-2 border-b border-border-strong/70 font-mono text-[10px] uppercase tracking-[0.13em] text-foreground-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
              {t('meta.continue')} <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div id="order-record" className="grid scroll-mt-24 grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
          <section aria-labelledby="commission-heading" className="min-w-0 border border-border bg-surface p-5 sm:p-7 lg:col-span-7 lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
              <div>
                <TechnicalCode>{t('items.code', { count: String(order.items.length).padStart(2, '0') })}</TechnicalCode>
                <h2 id="commission-heading" className="mt-2 font-display text-h3 text-foreground">{t('items.title')}</h2>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">{t('items.units', { count: order.items.reduce((sum, item) => sum + item.quantity, 0) })}</span>
            </div>

            <ul className="divide-y divide-border">
              {order.items.map((item, index) => (
                <li key={item.id} className="grid grid-cols-[72px_minmax(0,1fr)] gap-4 py-5 sm:grid-cols-[92px_minmax(0,1fr)] sm:gap-5">
                  <Link href={`/product/${item.productSlug}`} className="relative aspect-[4/5] overflow-hidden bg-surface-muted" aria-label={t('items.view', { name: item.productName })}>
                    <Image src={item.image} alt="" fill sizes="92px" className="object-cover" />
                  </Link>
                  <div className="min-w-0">
                    <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-foreground-subtle">{`${String(index + 1).padStart(2, '0')} // ${item.modelNumber}`}</p>
                    <Link href={`/product/${item.productSlug}`} className="mt-1.5 block break-words font-display text-base leading-snug text-foreground hover:underline">{item.productName}</Link>
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-foreground-muted">
                      {item.selectedFinish && <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full border border-border-strong/40" style={{ backgroundColor: item.selectedFinish.hex }} />{item.selectedFinish.name}</span>}
                      {!item.selectedFinish && <span>{item.variantName}</span>}
                      {item.selectedOption && <><span aria-hidden="true">/</span><span className="break-words">{item.selectedOption.label}{item.selectedOption.priceDelta !== 0 ? ` (${item.selectedOption.priceDelta > 0 ? '+' : ''}${formatPrice(item.selectedOption.priceDelta)})` : ''}</span></>}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-foreground-subtle">
                      <span>{t('items.qty', { quantity: String(item.quantity).padStart(2, '0'), price: formatPrice(item.unitPrice) })}</span>
                      <span className="text-foreground">{t('items.line', { price: formatPrice(item.totalPrice) })}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-3 border-t border-border pt-5">
              <div className="mb-4 flex items-start gap-3">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-foreground-muted" aria-hidden="true" />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground">{shipping?.name ?? order.carrier ?? t('shipping.fallback')}</p>
                  <p className="mt-1 text-small text-foreground-muted">{shipping?.estimatedWindow ?? t('shipping.windowPending')}</p>
                  {order.trackingNumber && <p className="mt-1 font-mono text-[10px] text-foreground-subtle">{t('shipping.tracking', { number: order.trackingNumber })}</p>}
                  {order.estimatedDispatch && <p className="mt-1 text-[11px] leading-relaxed text-foreground-subtle">{order.estimatedDispatch}</p>}
                  {order.estimatedDelivery && <p className="mt-1 text-[11px] leading-relaxed text-foreground-subtle">{t('shipping.estimate', { date: order.estimatedDelivery })}</p>}
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-foreground-subtle">{t('shipping.address')}</p>
                <p className="mt-2 text-small text-foreground">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                <p className="mt-1 break-words text-small text-foreground-muted">{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}</p>
                <p className="mt-1 break-words text-small text-foreground-muted">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                <p className="mt-1 text-small text-foreground-muted">{order.shippingAddress.country}</p>
              </div>
            </div>
          </section>

          <aside className="min-w-0 space-y-6 lg:col-span-5">
            <section className="border border-border bg-surface p-5 sm:p-7 lg:p-8" aria-labelledby="settlement-heading">
              <div className="border-b border-border pb-5">
                <TechnicalCode>{t('totals.code')}</TechnicalCode>
                <h2 id="settlement-heading" className="mt-2 font-display text-h3 text-foreground">{t('totals.title')}</h2>
              </div>
              <dl className="space-y-3 border-b border-border py-5">
                <div className="flex items-center justify-between gap-4 text-small"><dt className="text-foreground-muted">{t('totals.subtotal')}</dt><dd className="font-mono tabular-nums">{formatPrice(totals.subtotal)}</dd></div>
                {totals.discountAmount > 0 && <div className="flex items-center justify-between gap-4 text-small"><dt className="text-foreground-muted">{t('totals.discount')} {order.discountCode && <span className="font-mono text-[10px]">{`// ${order.discountCode}`}</span>}</dt><dd className="font-mono tabular-nums text-success">−{formatPrice(totals.discountAmount)}</dd></div>}
                <div className="flex items-center justify-between gap-4 text-small"><dt className="text-foreground-muted">{t('totals.delivery')}</dt><dd className="font-mono tabular-nums">{totals.shippingCost === 0 ? t('totals.included') : formatPrice(totals.shippingCost)}</dd></div>
                <div className="flex items-center justify-between gap-4 text-small"><dt className="text-foreground-muted">{t('totals.tax')}</dt><dd className="font-mono tabular-nums">{totals.taxAmount === 0 ? t('totals.included') : formatPrice(totals.taxAmount)}</dd></div>
              </dl>
              <div className="flex items-end justify-between gap-4 pt-5">
                <div><p className="font-display text-base text-foreground">{t('totals.totalDue')}</p><p className="mt-1 font-mono text-[9px] uppercase tracking-[0.13em] text-foreground-subtle">{paymentIsPending ? t('totals.pending') : t('totals.paid')}</p></div>
                <PriceDisplay price={totals.total} size="xl" />
              </div>
              <div className="mt-5 border-t border-border pt-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-foreground-subtle">{t('totals.method')}</p>
                <p className="mt-1.5 break-words text-small text-foreground">{paymentMethodText}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-foreground-subtle">{t('totals.noCard')}</p>
              </div>
            </section>

            <section className="border-s border-foreground px-5 py-2 sm:px-6" aria-labelledby="message-heading">
              <TechnicalCode>{t('note.code')}</TechnicalCode>
              <h2 id="message-heading" className="mt-2 font-display text-xl text-foreground">{t('note.title')}</h2>
              <p className="mt-3 text-small leading-relaxed text-foreground-muted">
                {paymentIsPending
                  ? t('note.pending')
                  : t('note.paid')}
              </p>
              <div className="mt-5 border-t border-border pt-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-foreground-subtle">{t('note.placed')}</p>
                <p className="mt-1.5 text-small text-foreground">{new Date(order.createdAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>
            </section>
          </aside>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-foreground-subtle">{t('footer.reference', { orderNumber: order.orderNumber })}</p>
            <p className="mt-1 text-small text-foreground-muted">{t('footer.keep')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/shop"><Button variant="outline" rightIcon={<ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />}>{t('footer.continue')}</Button></Link>
            <Link href="/account" className="inline-flex min-h-11 items-center border-b border-foreground font-mono text-[10px] uppercase tracking-[0.13em]">{t('footer.track')}</Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
