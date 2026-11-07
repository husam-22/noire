'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, BadgeCheck, FileText, Truck } from 'lucide-react';
import { Badge, Button, EmptyState, Input, Modal, PriceDisplay, Select, TechnicalCode, useToast } from '@/components/ui';
import { AdminPageHeader, OrderStatusBadge, PaymentStatusBadge, AdminSurface } from '@/components/admin/admin-primitives';
import { confirmAdminOrderPayment, setAdminOrderStatus, setAdminPaymentStatus } from '@/lib/admin/actions';
import { formatOrderDate, fulfillmentStatusLabel, orderStatusLabel, orderTotals, orderUnitCount, paymentStatusLabel } from '@/lib/account/order-utils';
import { formatPrice } from '@/lib/utils';
import type { Order, OrderStatus, PaymentStatus } from '@/types';

const ORDER_STATUSES: OrderStatus[] = ['pending_settlement', 'processing', 'Craft & Calibration', 'shipped', 'delivered', 'cancelled', 'returned'];
const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'paid', 'refunded', 'failed'];

function readOrderStatus(value: string): OrderStatus {
  return ORDER_STATUSES.find((status) => status === value) ?? 'pending_settlement';
}
function readPaymentStatus(value: string): PaymentStatus {
  return PAYMENT_STATUSES.find((status) => status === value) ?? 'pending';
}

export function AdminOrderDossier({ order }: { order: Order | null }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<OrderStatus>(order?.status ?? 'pending_settlement');
  const [statusNote, setStatusNote] = useState('');
  const [carrier, setCarrier] = useState(order?.carrier ?? '');
  const [trackingNumber, setTrackingNumber] = useState(order?.trackingNumber ?? '');
  const [paymentReference, setPaymentReference] = useState('');
  const [nextPayment, setNextPayment] = useState<PaymentStatus>(order?.paymentStatus ?? 'pending');
  const [isSaving, setIsSaving] = useState(false);

  if (!order) {
    return (
      <>
        <AdminPageHeader eyebrow="OPERATIONS // 01 · ORDER" title="Order not found" description="No order matches this identifier." />
        <EmptyState
          code="ORDER // NOT FOUND"
          title="No matching order."
          description="Check the order number or return to the list."
          icon={<FileText className="h-5 w-5" aria-hidden="true" />}
          primaryAction={<Link href="/admin/orders" className="inline-flex min-h-11 items-center border border-foreground bg-foreground px-4 font-mono text-[9px] uppercase tracking-[0.12em] text-background">Back to orders</Link>}
        />
      </>
    );
  }

  const totals = orderTotals(order);
  const isPendingSettlement = order.status === 'pending_settlement';
  const shipmentStatusRecorded = order.status === 'shipped' || order.status === 'delivered';
  const timeline = [...order.timeline].filter((event) => event.completed);

  const confirmStatusChange = async () => {
    setIsSaving(true);
    const result = await setAdminOrderStatus(
      order.id,
      nextStatus,
      statusNote.trim() || undefined,
      carrier.trim() || undefined,
      trackingNumber.trim() || undefined
    );
    setIsSaving(false);
    if (!result.ok) {
      addToast({ type: 'error', title: 'Could not update order', description: result.error });
      return;
    }
    addToast({ type: 'success', title: 'Order updated', description: `${order.orderNumber} is now ${orderStatusLabel(result.data.status)}.` });
    setIsStatusOpen(false);
    setStatusNote('');
    router.refresh();
  };

  const confirmPayment = async () => {
    setIsSaving(true);
    const result = await confirmAdminOrderPayment(order.id, paymentReference.trim() || undefined);
    setIsSaving(false);
    if (!result.ok) {
      addToast({ type: 'error', title: 'Could not confirm payment', description: result.error });
      return;
    }
    addToast({ type: 'success', title: 'Payment confirmed', description: `${order.orderNumber} is marked paid and moved to processing.` });
    setIsPaymentOpen(false);
    setPaymentReference('');
    router.refresh();
  };

  const changePaymentStatus = async () => {
    if (nextPayment === order.paymentStatus) {
      setIsPaymentOpen(false);
      return;
    }
    setIsSaving(true);
    const result = await setAdminPaymentStatus(order.id, nextPayment);
    setIsSaving(false);
    if (!result.ok) {
      addToast({ type: 'error', title: 'Could not update payment', description: result.error });
      return;
    }
    addToast({ type: 'success', title: 'Payment status updated', description: `${order.orderNumber}: ${paymentStatusLabel(result.data.paymentStatus)}.` });
    setIsPaymentOpen(false);
    router.refresh();
  };

  return (
    <main id="main-content" className="min-w-0">
      <AdminPageHeader
        eyebrow={`OPERATIONS // 01 · ${order.allocationReference ?? 'ORDER'}`}
        title={order.orderNumber}
        description={`Placed ${formatOrderDate(order.createdAt)} · ${order.paymentMethod}. Confirm payment, update the fulfilment status, and record carrier and tracking details here.`}
        actions={
          <>
            {order.paymentStatus !== 'paid' && order.status !== 'cancelled' && (
              <Button type="button" variant="primary" size="md" leftIcon={<BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />} onClick={() => { setNextPayment('paid'); setIsPaymentOpen(true); }}>
                Confirm payment
              </Button>
            )}
            <Link href="/admin/orders" className="inline-flex min-h-11 items-center gap-2 border border-border bg-surface px-4 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground-muted hover:border-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> All orders
            </Link>
          </>
        }
      />

      {isPendingSettlement && (
        <div role="status" aria-live="polite" className="mb-5 border border-warning/30 bg-warning-surface/50 p-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-warning">Awaiting confirmation</p>
          <p className="mt-2 text-small leading-relaxed text-foreground-muted">
            The customer chose <strong className="text-foreground">{order.paymentMethod}</strong>. Contact them to confirm the order, then press “Confirm payment” once cash is collected or the transfer has arrived. Stock was reserved when the order was placed.
          </p>
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <OrderMeta label="Placed" value={formatOrderDate(order.createdAt)} />
        <OrderMeta label="Order status" value={orderStatusLabel(order.status)} />
        <OrderMeta label="Payment" value={paymentStatusLabel(order.paymentStatus)} />
        <OrderMeta label="Fulfilment" value={fulfillmentStatusLabel(order.status)} />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
        <div className="min-w-0 space-y-4 xl:col-span-8">
          <AdminSurface className="p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
              <div><TechnicalCode>01 // CUSTOMER</TechnicalCode><h2 className="mt-1 font-display text-lg text-foreground">Customer &amp; contact</h2></div>
              <Badge variant="outline">{order.customerId === 'guest' ? 'GUEST CHECKOUT' : 'ACCOUNT'}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoBlock label="Order number" value={order.orderNumber} />
              <InfoBlock label="Reference" value={order.allocationReference ?? order.id} />
              <InfoBlock label="Name" value={order.customerName || 'Not recorded'} />
              <InfoBlock label="Email" value={order.customerEmail || 'Not recorded'} />
              <InfoBlock label="Phone" value={order.customerPhone || 'Not recorded'} />
              <InfoBlock label="Payment method" value={order.paymentMethod} />
              {order.customerId !== 'guest' && (
                <div className="sm:col-span-2">
                  <Link href={`/admin/customers/${encodeURIComponent(order.customerId)}`} className="inline-flex min-h-11 items-center gap-2 border-b border-border px-1 font-mono text-[9px] uppercase tracking-[0.1em] text-foreground-muted hover:text-foreground">
                    Open customer profile <ArrowLeft className="h-3 w-3 rotate-180" aria-hidden="true" />
                  </Link>
                </div>
              )}
              {order.notes && <div className="sm:col-span-2"><InfoBlock label="Customer note" value={order.notes} /></div>}
            </div>
          </AdminSurface>

          <AdminSurface className="p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3">
              <div><TechnicalCode>02 // ITEMS</TechnicalCode><h2 className="mt-1 font-display text-lg text-foreground">Order items</h2></div>
              <span className="font-mono text-[9px] uppercase text-foreground-subtle">{orderUnitCount(order)} units</span>
            </div>
            <ul className="divide-y divide-border">
              {order.items.map((item) => (
                <li key={item.id} className="grid min-w-0 grid-cols-[64px_minmax(0,1fr)] gap-3 py-4 sm:grid-cols-[84px_minmax(0,1fr)_auto] sm:items-center sm:gap-4">
                  <Link href={`/admin/products/${encodeURIComponent(item.productId)}`} aria-label={`Open product ${item.productName}`} className="relative aspect-[4/5] overflow-hidden border border-border bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
                    <Image src={item.image} alt="" fill sizes="84px" className="object-cover" />
                  </Link>
                  <div className="min-w-0">
                    <TechnicalCode>{item.modelNumber} · {item.sku}</TechnicalCode>
                    <p className="mt-1 break-words font-display text-base text-foreground">{item.productName}</p>
                    <p className="mt-1 text-[10px] text-foreground-muted">
                      {item.selectedFinish?.name ?? item.variantName}
                      {item.selectedOption ? ` / ${item.selectedOption.label}` : ''}
                    </p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.08em] text-foreground-subtle">Qty {item.quantity} × {formatPrice(item.unitPrice)}</p>
                  </div>
                  <span className="font-mono text-[11px] tabular-nums text-foreground sm:text-end">{formatPrice(item.totalPrice)}</span>
                </li>
              ))}
            </ul>
          </AdminSurface>

          <AdminSurface className="p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3">
              <div><TechnicalCode>03 // DELIVERY</TechnicalCode><h2 className="mt-1 font-display text-lg text-foreground">Delivery &amp; tracking</h2></div>
              <Truck className="h-4 w-4 text-foreground-subtle" aria-hidden="true" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">Shipping method</p>
                <p className="mt-1 text-small text-foreground">{order.shippingMethod?.name ?? 'Not recorded'}</p>
                {order.shippingMethod?.estimatedWindow && <p className="mt-1 text-[10px] text-foreground-muted">Window // {order.shippingMethod.estimatedWindow}</p>}
              </div>
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">Tracking</p>
                {order.trackingNumber ? (
                  <p className="mt-1 break-all font-mono text-small text-foreground">{order.trackingNumber}</p>
                ) : (
                  <p className="mt-1 text-small text-foreground-muted">{shipmentStatusRecorded ? 'No tracking number recorded.' : 'Add carrier and tracking when you mark the order shipped.'}</p>
                )}
                {order.carrier && <p className="mt-1 text-[10px] text-foreground-subtle">Carrier // {order.carrier}</p>}
              </div>
              <div className="sm:col-span-2">
                <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">Delivery address</p>
                <address className="mt-2 not-italic text-[10px] leading-relaxed text-foreground-muted">
                  <span className="block">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</span>
                  {order.shippingAddress.company && <span className="block">{order.shippingAddress.company}</span>}
                  <span className="block break-words">{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}</span>
                  <span className="block">{[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.postalCode].filter(Boolean).join(', ')}</span>
                  <span className="block">{order.shippingAddress.country}</span>
                  {order.shippingAddress.phone && <span className="block font-mono">{order.shippingAddress.phone}</span>}
                </address>
              </div>
            </div>
          </AdminSurface>

          <AdminSurface className="p-4 sm:p-5">
            <div className="mb-4 border-b border-border pb-3"><TechnicalCode>04 // TIMELINE</TechnicalCode><h2 className="mt-1 font-display text-lg text-foreground">Order history</h2></div>
            {timeline.length ? (
              <ol className="space-y-0 border-s border-border ps-4">
                {timeline.map((event) => (
                  <li key={event.id} className="relative pb-5 last:pb-0">
                    <span className="absolute -start-[1.32rem] top-1 h-2 w-2 rounded-full border border-accent bg-accent" aria-hidden="true" />
                    <p className="break-words font-mono text-[9px] uppercase tracking-[0.1em] text-foreground">{event.status}</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-foreground-muted">{event.description}</p>
                    <time dateTime={event.timestamp} className="mt-1 block font-mono text-[8px] uppercase tracking-[0.08em] text-foreground-subtle">{formatOrderDate(event.timestamp)}</time>
                  </li>
                ))}
              </ol>
            ) : <p className="text-small text-foreground-muted">No events recorded yet.</p>}
          </AdminSurface>
        </div>

        <aside className="min-w-0 space-y-4 xl:col-span-4">
          <AdminSurface className="p-4 sm:p-5">
            <div className="mb-4 border-b border-border pb-3"><TechnicalCode>05 // PAYMENT</TechnicalCode><h2 className="mt-1 font-display text-lg text-foreground">Payment</h2></div>
            <div className="flex flex-wrap gap-2"><PaymentStatusBadge status={order.paymentStatus} /><Badge variant="outline">{order.paymentMethod}</Badge></div>
            <p className="mt-3 text-[10px] leading-relaxed text-foreground-muted">
              {order.paymentStatus === 'paid'
                ? 'Payment has been confirmed. Use “Adjust payment” only to record a refund.'
                : 'Confirm payment once the cash has been collected or the bank transfer is visible on the account statement.'}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {order.paymentStatus !== 'paid' && (
                <Button type="button" variant="primary" className="w-full" onClick={() => { setNextPayment('paid'); setIsPaymentOpen(true); }}>Confirm payment</Button>
              )}
              <Button type="button" variant="outline" className="w-full" onClick={() => { setNextPayment(order.paymentStatus); setIsPaymentOpen(true); }}>Adjust payment status</Button>
            </div>
          </AdminSurface>

          <AdminSurface className="p-4 sm:p-5">
            <div className="mb-4 border-b border-border pb-3"><TechnicalCode>06 // TOTALS</TechnicalCode><h2 className="mt-1 font-display text-lg text-foreground">Order value</h2></div>
            <dl className="space-y-3 border-y border-border py-4">
              <MoneyRow label="Subtotal" value={formatPrice(totals.subtotal)} />
              {totals.discountAmount > 0 && <MoneyRow label={`Discount${order.discountCode ? ` // ${order.discountCode}` : ''}`} value={`−${formatPrice(totals.discountAmount)}`} />}
              <MoneyRow label="Delivery" value={totals.shippingCost === 0 ? 'FREE' : formatPrice(totals.shippingCost)} />
              <MoneyRow label="Tax" value={totals.taxAmount === 0 ? 'Included' : formatPrice(totals.taxAmount)} />
            </dl>
            <div className="flex items-end justify-between gap-3 pt-4">
              <div><p className="font-display text-base text-foreground">Total</p><p className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">{`${paymentStatusLabel(order.paymentStatus)} // ${order.currency}`}</p></div>
              <PriceDisplay price={totals.total} size="xl" />
            </div>
          </AdminSurface>

          <AdminSurface className="p-4 sm:p-5">
            <div className="mb-4 border-b border-border pb-3"><TechnicalCode>07 // FULFILMENT</TechnicalCode><h2 className="mt-1 font-display text-lg text-foreground">Order status</h2></div>
            <OrderStatusBadge status={order.status} />
            <p className="mt-3 text-[10px] leading-relaxed text-foreground-muted">Move the order through processing, craft &amp; calibration, shipped and delivered. Each change is recorded in the timeline and visible to the customer.</p>
            <Button type="button" variant="outline" className="mt-4 w-full" onClick={() => { setNextStatus(order.status); setCarrier(order.carrier ?? ''); setTrackingNumber(order.trackingNumber ?? ''); setIsStatusOpen(true); }}>Update status</Button>
          </AdminSurface>
        </aside>
      </div>

      <Modal
        isOpen={isStatusOpen}
        onClose={() => !isSaving && setIsStatusOpen(false)}
        title="Update order status"
        code={`ORDER // ${order.orderNumber}`}
        size="md"
        footer={<><Button type="button" variant="ghost" disabled={isSaving} onClick={() => setIsStatusOpen(false)}>Cancel</Button><Button type="button" variant="primary" isLoading={isSaving} onClick={confirmStatusChange}>Save status</Button></>}
      >
        <div className="space-y-4">
          <Select label="New status" value={nextStatus} onChange={(event) => setNextStatus(readOrderStatus(event.target.value))} options={ORDER_STATUSES.map((status) => ({ label: orderStatusLabel(status), value: status }))} />
          <Input label="Note for the timeline (optional)" value={statusNote} onChange={(event) => setStatusNote(event.target.value)} placeholder="e.g. Confirmed by phone with the customer" />
          {(nextStatus === 'shipped' || nextStatus === 'delivered') && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="Carrier" value={carrier} onChange={(event) => setCarrier(event.target.value)} placeholder="DHL, Aramex…" />
              <Input label="Tracking number" value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} />
            </div>
          )}
          {nextStatus === 'cancelled' && (
            <p className="border border-warning/30 bg-warning-surface/50 p-3 text-[10px] leading-relaxed text-foreground-muted">Cancelling releases the reserved stock back to inventory.</p>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isPaymentOpen}
        onClose={() => !isSaving && setIsPaymentOpen(false)}
        title={nextPayment === 'paid' && order.paymentStatus !== 'paid' ? 'Confirm payment' : 'Adjust payment status'}
        code={`PAYMENT // ${order.orderNumber}`}
        size="md"
        footer={
          <>
            <Button type="button" variant="ghost" disabled={isSaving} onClick={() => setIsPaymentOpen(false)}>Cancel</Button>
            {nextPayment === 'paid' && order.paymentStatus !== 'paid' ? (
              <Button type="button" variant="primary" isLoading={isSaving} onClick={confirmPayment}>Mark as paid</Button>
            ) : (
              <Button type="button" variant="primary" isLoading={isSaving} disabled={nextPayment === order.paymentStatus} onClick={changePaymentStatus}>Save</Button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          <Select label="Payment status" value={nextPayment} onChange={(event) => setNextPayment(readPaymentStatus(event.target.value))} options={PAYMENT_STATUSES.map((status) => ({ label: paymentStatusLabel(status), value: status }))} />
          {nextPayment === 'paid' && order.paymentStatus !== 'paid' && (
            <>
              <Input label="Reference (optional)" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Bank transfer reference or receipt number" />
              <p className="text-[10px] leading-relaxed text-foreground-muted">Marking the order paid records the {formatPrice(totals.total)} payment via {order.paymentMethod} and moves the order to processing.</p>
            </>
          )}
        </div>
      </Modal>
    </main>
  );
}

function OrderMeta({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 border border-border bg-surface p-3"><dt className="font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">{label}</dt><dd className="mt-1.5 break-words text-small text-foreground">{value}</dd></div>;
}
function InfoBlock({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 border-t border-border pt-2"><p className="font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">{label}</p><p className="mt-1 break-words text-small text-foreground">{value}</p></div>;
}
function MoneyRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-3 text-[10px]"><dt className="min-w-0 break-words text-foreground-muted">{label}</dt><dd className="shrink-0 font-mono tabular-nums text-foreground">{value}</dd></div>;
}
