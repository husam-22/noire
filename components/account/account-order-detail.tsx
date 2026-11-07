'use client';

import React from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, ArrowUpRight, FileText, Mail, Truck } from 'lucide-react';
import type { Order } from '@/types';
import { EmptyState, PriceDisplay, TechnicalCode } from '@/components/ui';
import { Container } from '@/components/layout';
import {
  fulfillmentStatusLabel,
  orderStatusLabel,
  formatOrderDate,
  orderTotals,
  orderUnitCount,
  paymentStatusLabel,
} from '@/lib/account/order-utils';
import { formatPrice } from '@/lib/utils';
import { useStorefrontContent } from '@/lib/context/storefront-content-context';

const SUPPORT_EMAIL = 'studio@noire.example';

export function AccountOrderDetail({ order }: { order: Order | null }) {
  const storefront = useStorefrontContent();
  if (!order) {
    return (
      <main id="main-content" className="bg-background py-10 text-foreground sm:py-16">
        <Container size="wide">
          <nav aria-label="Breadcrumb" className="mb-7 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground-subtle">
            <Link href="/account" className="inline-flex min-h-11 items-center hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">My Account</Link>
            <span aria-hidden="true" className="px-2">/</span>
            <span aria-current="page">Order</span>
          </nav>
          <EmptyState
            code="ERR // ORDER NOT FOUND"
            title="We couldn't find this order."
            description="The order may belong to a different account, or the link may be incomplete. Your orders are listed in your account."
            icon={<FileText className="h-5 w-5" aria-hidden="true" />}
            primaryAction={<Link href="/account#order-archive" className="inline-flex min-h-11 items-center gap-2 border border-foreground bg-foreground px-4 font-mono text-[9px] uppercase tracking-[0.12em] text-background hover:bg-foreground/90">Back to my orders <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /></Link>}
            secondaryAction={<Link href="/shop" className="inline-flex min-h-11 items-center border-b border-border px-1 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground-muted hover:text-foreground">Browse instruments</Link>}
          />
        </Container>
      </main>
    );
  }

  const totals = orderTotals(order);
  const isPendingSettlement = order.status === 'pending_settlement';
  const showBankDetails = order.paymentStatus === 'pending' && order.paymentSummary?.methodType === 'bank_transfer' && Boolean(storefront.bankTransferInstructions);
  const supportLine = [storefront.supportEmail, storefront.supportPhone].filter(Boolean).join(' · ');
  const completedTimeline = order.timeline.filter((event) => event.completed);
  const shipmentStatusRecorded = order.status === 'shipped' || order.status === 'delivered';
  const supportHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Order ${order.orderNumber}`)}`;

  return (
    <>
      <main id="main-content" className="bg-background pb-12 text-foreground sm:pb-16">
        <header className="border-b border-border bg-background">
          <Container size="wide" className="pb-7 pt-24 sm:pb-9">
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground-subtle">
                <li><Link href="/account" className="inline-flex min-h-11 items-center transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">My Account</Link></li>
                <li aria-hidden="true">/</li>
                <li><Link href="/account#order-archive" className="inline-flex min-h-11 items-center transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">Orders</Link></li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="text-foreground">{order.orderNumber}</li>
              </ol>
            </nav>

            <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12 lg:gap-8">
              <div className="min-w-0 lg:col-span-8">
                <TechnicalCode>Order // {orderStatusLabel(order.status)}</TechnicalCode>
                <h1 className="mt-3 break-words font-display text-3xl leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  {order.orderNumber}
                </h1>
                <p className="mt-3 text-small leading-relaxed text-foreground-muted">
                  Placed {formatOrderDate(order.createdAt)} · {order.paymentMethod}. Every status change is recorded below as it happens.
                </p>
              </div>
              <dl aria-live="polite" className="grid grid-cols-2 gap-2 lg:col-span-4">
                <OrderMeta label="Placed" value={formatOrderDate(order.createdAt)} />
                <OrderMeta label="Instruments" value={`${String(orderUnitCount(order)).padStart(2, '0')} units`} />
                <OrderMeta label="Payment" value={paymentStatusLabel(order.paymentStatus)} />
                <OrderMeta label="Fulfillment" value={fulfillmentStatusLabel(order.status)} />
              </dl>
            </div>
          </Container>
        </header>

        <Container size="wide" className="py-7 sm:py-10">
          {isPendingSettlement && (
            <section role="status" aria-live="polite" className="mb-6 border border-accent/30 bg-accent/5 p-4 sm:p-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-accent">Awaiting confirmation</p>
              <p className="mt-2 max-w-4xl text-small leading-relaxed text-foreground-muted">
                Thank you — your order is reserved. Our team will contact you to confirm it and arrange payment ({order.paymentMethod}). Dispatch starts once the order is confirmed.
              </p>
              {showBankDetails && (
                <div className="mt-4 border border-border bg-background p-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-foreground-subtle">Bank details</p>
                  <pre className="mt-2 whitespace-pre-wrap font-sans text-small leading-relaxed text-foreground">{storefront.bankTransferInstructions}</pre>
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.13em] text-foreground-subtle">Reference // {order.orderNumber}</p>
                </div>
              )}
              {supportLine && <p className="mt-3 text-small text-foreground-muted">Questions? Contact us at {supportLine}.</p>}
            </section>
          )}

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[9px] uppercase tracking-[0.11em] text-foreground-subtle">
              <span>Status // {orderStatusLabel(order.status)}</span>
              <span>Payment // {paymentStatusLabel(order.paymentStatus)}</span>
            </div>
            <Link href="/account#order-archive" className="inline-flex min-h-11 items-center gap-2 border-b border-border px-1 font-mono text-[9px] uppercase tracking-[0.11em] text-foreground-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
              <ArrowLeft className="h-3 w-3" aria-hidden="true" /> All orders
            </Link>
          </div>

          <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-12 lg:gap-5">
            <section aria-labelledby="dossier-items-heading" className="min-w-0 border border-border bg-surface p-4 sm:p-6 lg:col-span-7 lg:p-7">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
                <div>
                  <TechnicalCode>Items // 01—{String(order.items.length).padStart(2, '0')}</TechnicalCode>
                  <h2 id="dossier-items-heading" className="mt-2 font-display text-xl text-foreground">Ordered items</h2>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-foreground-subtle">{String(orderUnitCount(order)).padStart(2, '0')} units</span>
              </div>

              <ul className="divide-y divide-border">
                {order.items.map((item, index) => (
                  <li key={item.id} className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] gap-3 py-4 sm:grid-cols-[92px_minmax(0,1fr)] sm:gap-5 sm:py-5">
                    <Link href={`/product/${item.productSlug}`} aria-label={`Open ${item.productName} product dossier`} className="relative aspect-[4/5] overflow-hidden border border-border bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
                      <Image src={item.image} alt="" fill sizes="92px" className="object-cover" />
                    </Link>
                    <div className="min-w-0">
                      <TechnicalCode>{`${String(index + 1).padStart(2, '0')} // ${item.modelNumber}`}</TechnicalCode>
                      <Link href={`/product/${item.productSlug}`} className="mt-1.5 block break-words font-display text-base leading-snug text-foreground transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
                        {item.productName}
                      </Link>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-foreground-muted">
                        {item.selectedFinish ? (
                          <span className="inline-flex min-w-0 items-center gap-1.5 break-words">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-border-strong/30" style={{ backgroundColor: item.selectedFinish.hex }} aria-hidden="true" />
                            {item.selectedFinish.name}
                          </span>
                        ) : (
                          <span className="break-words">{item.variantName}</span>
                        )}
                        {item.selectedOption && <span className="break-words">/ {item.selectedOption.label}{item.selectedOption.priceDelta !== 0 ? ` (${item.selectedOption.priceDelta > 0 ? '+' : ''}${formatPrice(item.selectedOption.priceDelta)})` : ''}</span>}
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border pt-3 font-mono text-[9px] uppercase tracking-[0.08em]">
                        <div><dt className="text-foreground-subtle">Quantity</dt><dd className="mt-1 text-foreground">{String(item.quantity).padStart(2, '0')}</dd></div>
                        <div><dt className="text-foreground-subtle">Unit price</dt><dd className="mt-1 break-words text-foreground">{formatPrice(item.unitPrice)}</dd></div>
                        <div className="col-span-2 flex items-center justify-between gap-2 border-t border-border pt-2"><dt className="text-foreground-subtle">Line total</dt><dd className="break-words text-foreground">{formatPrice(item.totalPrice)}</dd></div>
                      </dl>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-2 border-t border-border pt-5">
                <div className="flex items-start gap-3">
                  <Truck className="mt-0.5 h-4 w-4 shrink-0 text-foreground-muted" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-foreground-subtle">Delivery</p>
                    <p className="mt-1.5 break-words text-small text-foreground">{order.shippingMethod?.name || order.carrier || 'Not recorded'}</p>
                    {order.shippingMethod?.estimatedWindow && (
                      <p className="mt-1 text-small text-foreground-muted">
                        Estimated window // {order.shippingMethod.estimatedWindow}
                        {isPendingSettlement ? ' · counted from confirmation' : ''}
                      </p>
                    )}
                    {!isPendingSettlement && order.shippingMethod?.estimatedDispatch && (
                      <p className="mt-1 text-[10px] leading-relaxed text-foreground-subtle">Dispatch estimate // {order.shippingMethod.estimatedDispatch}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2">
                  <div className="min-w-0">
                    <p className="font-mono text-[8px] uppercase tracking-[0.11em] text-foreground-subtle">Delivery address</p>
                    <address className="mt-2 not-italic text-small leading-relaxed text-foreground-muted">
                      <span className="block">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</span>
                      {order.shippingAddress.company && <span className="block">{order.shippingAddress.company}</span>}
                      <span className="block break-words">{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}</span>
                      <span className="block break-words">{[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.postalCode].filter(Boolean).join(', ')}</span>
                      <span className="block">{order.shippingAddress.country}</span>
                    </address>
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-[8px] uppercase tracking-[0.11em] text-foreground-subtle">Tracking reference</p>
                    {shipmentStatusRecorded && order.trackingNumber ? (
                      <p className="mt-2 break-all font-mono text-small text-foreground">{order.trackingNumber}</p>
                    ) : (
                      <p className="mt-2 text-small text-foreground-muted">
                        {isPendingSettlement ? 'Available once the order is dispatched.' : 'No tracking reference yet.'}
                      </p>
                    )}
                    {shipmentStatusRecorded && order.carrier && <p className="mt-1 break-words text-[10px] text-foreground-subtle">Carrier // {order.carrier}</p>}
                    {!isPendingSettlement && order.estimatedDispatch && <p className="mt-2 text-[10px] leading-relaxed text-foreground-subtle">Dispatch estimate // {order.estimatedDispatch}</p>}
                    {order.estimatedDelivery && (
                      <p className="mt-1 text-[10px] leading-relaxed text-foreground-subtle">
                        Estimated delivery // {order.estimatedDelivery}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <aside className="min-w-0 space-y-4 lg:col-span-5">
              <section aria-labelledby="financial-dossier-heading" className="border border-border bg-surface p-4 sm:p-6 lg:p-7">
                <TechnicalCode>Summary // {order.currency}</TechnicalCode>
                <h2 id="financial-dossier-heading" className="mt-2 font-display text-xl text-foreground">Payment summary</h2>
                <dl className="mt-4 space-y-3 border-y border-border py-4">
                  <FinancialRow label="Subtotal" value={formatPrice(totals.subtotal)} />
                  {totals.discountAmount > 0 && <FinancialRow label={`Discount${order.discountCode ? ` // ${order.discountCode}` : ''}`} value={`−${formatPrice(totals.discountAmount)}`} />}
                  <FinancialRow label="Delivery" value={totals.shippingCost === 0 ? 'FREE' : formatPrice(totals.shippingCost)} />
                  <FinancialRow label="Tax" value={totals.taxAmount === 0 ? 'INCLUDED' : formatPrice(totals.taxAmount)} />
                </dl>
                <div className="flex items-end justify-between gap-3 pt-4">
                  <div>
                    <p className="font-display text-base text-foreground">Total</p>
                    <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.11em] text-foreground-subtle">Payment // {paymentStatusLabel(order.paymentStatus)}</p>
                  </div>
                  <PriceDisplay price={totals.total} size="xl" />
                </div>
                <p className="mt-4 border-t border-border pt-3 text-[10px] leading-relaxed text-foreground-subtle">
                  Payment method: {order.paymentMethod}. {order.paymentStatus === 'paid' ? 'Payment has been confirmed by our team.' : 'Payment is confirmed by our team on delivery or when your transfer is received.'}
                </p>
              </section>

              <section aria-labelledby="timeline-heading" className="border border-border bg-surface p-4 sm:p-6 lg:p-7">
                <TechnicalCode>Timeline</TechnicalCode>
                <h2 id="timeline-heading" className="mt-2 font-display text-xl text-foreground">Order history</h2>
                {completedTimeline.length > 0 ? (
                  <ol className="mt-4 space-y-0 border-s border-border ps-4">
                    {completedTimeline.map((event) => (
                      <li key={event.id} className="relative pb-5 last:pb-0">
                        <span className="absolute -start-[1.32rem] top-1 h-2 w-2 rounded-full border border-accent bg-accent" aria-hidden="true" />
                        <p className="break-words font-mono text-[9px] uppercase tracking-[0.1em] text-foreground">{event.status}</p>
                        <p className="mt-1 text-[10px] leading-relaxed text-foreground-muted">{event.description}</p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[8px] uppercase tracking-[0.08em] text-foreground-subtle">
                          {event.timestamp && <time dateTime={event.timestamp}>{formatOrderDate(event.timestamp)}</time>}
                          {event.location && shipmentStatusRecorded && <span>{event.location}</span>}
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-4 text-small text-foreground-muted">No events recorded yet.</p>
                )}
              </section>

              <section aria-labelledby="support-heading" className="border-s border-foreground px-4 py-2 sm:px-5">
                <TechnicalCode>Support</TechnicalCode>
                <h2 id="support-heading" className="mt-2 font-display text-xl text-foreground">Need assistance?</h2>
                <p className="mt-2 text-small leading-relaxed text-foreground-muted">
                  Questions about this order? Email us and quote {order.orderNumber}; we reply within one business day.
                </p>
                <a
                  href={supportHref}
                  className="mt-3 inline-flex min-h-11 items-center gap-2 border-b border-foreground px-1 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" /> Email support
                </a>
              </section>
            </aside>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">Order // {order.orderNumber}</p>
            <Link href="/account#order-archive" className="inline-flex min-h-11 items-center gap-2 border-b border-border px-1 font-mono text-[9px] uppercase tracking-[0.11em] text-foreground-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
              Back to my orders <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
        </Container>
      </main>

    </>
  );
}

function OrderMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border border-border bg-surface px-3 py-3">
      <dt className="font-mono text-[8px] uppercase tracking-[0.11em] text-foreground-subtle">{label}</dt>
      <dd className="mt-1.5 break-words text-small text-foreground">{value}</dd>
    </div>
  );
}

function FinancialRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-small">
      <dt className="min-w-0 break-words text-foreground-muted">{label}</dt>
      <dd className="shrink-0 font-mono tabular-nums text-foreground">{value}</dd>
    </div>
  );
}
