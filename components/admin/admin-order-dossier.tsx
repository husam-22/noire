'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, BadgeCheck, FileText, Truck } from 'lucide-react';
import { Badge, Button, EmptyState, Input, Modal, PriceDisplay, Select, TechnicalCode, useToast } from '@/components/ui';
import { AdminPageHeader, OrderStatusBadge, PaymentStatusBadge, AdminSurface } from '@/components/admin/admin-primitives';
import { confirmAdminOrderPayment, setAdminOrderStatus, setAdminPaymentStatus } from '@/lib/admin/actions';
import { formatOrderDate, fulfillmentStatusLabel, orderPaymentMethodLabel, orderStatusLabel, orderTotals, orderUnitCount, paymentStatusLabel } from '@/lib/account/order-utils';
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
  const t = useTranslations('admin.orderDossier');
  const tOrders = useTranslations('orders');
  const locale = useLocale();
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
        <AdminPageHeader eyebrow={t('nfEyebrow')} title={t('nfTitle')} description={t('nfDescription')} />
        <EmptyState
          code={t('nfCode')}
          title={t('nfEmptyTitle')}
          description={t('nfEmptyDescription')}
          icon={<FileText className="h-5 w-5" aria-hidden="true" />}
          primaryAction={<Link href="/admin/orders" className="inline-flex min-h-11 items-center border border-foreground bg-foreground px-4 font-mono text-[9px] uppercase tracking-[0.12em] text-background">{t('backToOrders')}</Link>}
        />
      </>
    );
  }

  const totals = orderTotals(order);
  const methodLabel = orderPaymentMethodLabel(tOrders, order);
  const placedDate = formatOrderDate(order.createdAt, locale, t('notRecorded'));
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
      addToast({ type: 'error', title: t('toastUpdateError'), description: result.error });
      return;
    }
    addToast({ type: 'success', title: t('toastUpdated'), description: t('toastUpdatedBody', { number: order.orderNumber, status: orderStatusLabel(tOrders, result.data.status) }) });
    setIsStatusOpen(false);
    setStatusNote('');
    router.refresh();
  };

  const confirmPayment = async () => {
    setIsSaving(true);
    const result = await confirmAdminOrderPayment(order.id, paymentReference.trim() || undefined);
    setIsSaving(false);
    if (!result.ok) {
      addToast({ type: 'error', title: t('toastPaymentError'), description: result.error });
      return;
    }
    addToast({ type: 'success', title: t('toastPaymentConfirmed'), description: t('toastPaymentConfirmedBody', { number: order.orderNumber }) });
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
      addToast({ type: 'error', title: t('toastPaymentUpdateError'), description: result.error });
      return;
    }
    addToast({ type: 'success', title: t('toastPaymentUpdated'), description: t('toastPaymentUpdatedBody', { number: order.orderNumber, status: paymentStatusLabel(tOrders, result.data.paymentStatus) }) });
    setIsPaymentOpen(false);
    router.refresh();
  };

  return (
    <main id="main-content" className="min-w-0">
      <AdminPageHeader
        eyebrow={t('eyebrow', { reference: order.allocationReference ?? t('order') })}
        title={order.orderNumber}
        description={t('description', { date: placedDate, method: methodLabel })}
        actions={
          <>
            {order.paymentStatus !== 'paid' && order.status !== 'cancelled' && (
              <Button type="button" variant="primary" size="md" leftIcon={<BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />} onClick={() => { setNextPayment('paid'); setIsPaymentOpen(true); }}>
                {t('confirmPayment')}
              </Button>
            )}
            <Link href="/admin/orders" className="inline-flex min-h-11 items-center gap-2 border border-border bg-surface px-4 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground-muted hover:border-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> {t('allOrders')}
            </Link>
          </>
        }
      />

      {isPendingSettlement && (
        <div role="status" aria-live="polite" className="mb-5 border border-warning/30 bg-warning-surface/50 p-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-warning">{t('awaitingTitle')}</p>
          <p className="mt-2 text-small leading-relaxed text-foreground-muted">
            {t.rich('awaitingBody', { method: methodLabel, strong: (chunks) => <strong className="text-foreground">{chunks}</strong> })}
          </p>
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <OrderMeta label={t('placed')} value={placedDate} />
        <OrderMeta label={t('orderStatus')} value={orderStatusLabel(tOrders, order.status)} />
        <OrderMeta label={t('payment')} value={paymentStatusLabel(tOrders, order.paymentStatus)} />
        <OrderMeta label={t('fulfilment')} value={fulfillmentStatusLabel(tOrders, order.status)} />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
        <div className="min-w-0 space-y-4 xl:col-span-8">
          <AdminSurface className="p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
              <div><TechnicalCode>{t('customerCode')}</TechnicalCode><h2 className="mt-1 font-display text-lg text-foreground">{t('customerTitle')}</h2></div>
              <Badge variant="outline">{order.customerId === 'guest' ? t('guestCheckout') : t('account')}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoBlock label={t('orderNumber')} value={order.orderNumber} />
              <InfoBlock label={t('reference')} value={order.allocationReference ?? order.id} />
              <InfoBlock label={t('name')} value={order.customerName || t('notRecorded')} />
              <InfoBlock label={t('email')} value={order.customerEmail || t('notRecorded')} />
              <InfoBlock label={t('phone')} value={order.customerPhone || t('notRecorded')} />
              <InfoBlock label={t('paymentMethod')} value={methodLabel} />
              {order.customerId !== 'guest' && (
                <div className="sm:col-span-2">
                  <Link href={`/admin/customers/${encodeURIComponent(order.customerId)}`} className="inline-flex min-h-11 items-center gap-2 border-b border-border px-1 font-mono text-[9px] uppercase tracking-[0.1em] text-foreground-muted hover:text-foreground">
                    {t('openCustomer')} <ArrowLeft className="h-3 w-3 rotate-180" aria-hidden="true" />
                  </Link>
                </div>
              )}
              {order.notes && <div className="sm:col-span-2"><InfoBlock label={t('customerNote')} value={order.notes} /></div>}
            </div>
          </AdminSurface>

          <AdminSurface className="p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3">
              <div><TechnicalCode>{t('itemsCode')}</TechnicalCode><h2 className="mt-1 font-display text-lg text-foreground">{t('itemsTitle')}</h2></div>
              <span className="font-mono text-[9px] uppercase text-foreground-subtle">{t('units', { count: orderUnitCount(order) })}</span>
            </div>
            <ul className="divide-y divide-border">
              {order.items.map((item) => (
                <li key={item.id} className="grid min-w-0 grid-cols-[64px_minmax(0,1fr)] gap-3 py-4 sm:grid-cols-[84px_minmax(0,1fr)_auto] sm:items-center sm:gap-4">
                  <Link href={`/admin/products/${encodeURIComponent(item.productId)}`} aria-label={t('openProduct', { name: item.productName })} className="relative aspect-[4/5] overflow-hidden border border-border bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
                    <Image src={item.image} alt="" fill sizes="84px" className="object-cover" />
                  </Link>
                  <div className="min-w-0">
                    <TechnicalCode>{item.modelNumber} · {item.sku}</TechnicalCode>
                    <p className="mt-1 break-words font-display text-base text-foreground">{item.productName}</p>
                    <p className="mt-1 text-[10px] text-foreground-muted">
                      {item.selectedFinish?.name ?? item.variantName}
                      {item.selectedOption ? ` / ${item.selectedOption.label}` : ''}
                    </p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.08em] text-foreground-subtle">{t('qty', { quantity: item.quantity, price: formatPrice(item.unitPrice) })}</p>
                  </div>
                  <span className="font-mono text-[11px] tabular-nums text-foreground sm:text-end">{formatPrice(item.totalPrice)}</span>
                </li>
              ))}
            </ul>
          </AdminSurface>

          <AdminSurface className="p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3">
              <div><TechnicalCode>{t('deliveryCode')}</TechnicalCode><h2 className="mt-1 font-display text-lg text-foreground">{t('deliveryTitle')}</h2></div>
              <Truck className="h-4 w-4 text-foreground-subtle" aria-hidden="true" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">{t('shippingMethod')}</p>
                <p className="mt-1 text-small text-foreground">{order.shippingMethod?.name ?? t('notRecorded')}</p>
                {order.shippingMethod?.estimatedWindow && <p className="mt-1 text-[10px] text-foreground-muted">{t('window', { window: order.shippingMethod.estimatedWindow })}</p>}
              </div>
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">{t('tracking')}</p>
                {order.trackingNumber ? (
                  <p className="mt-1 break-all font-mono text-small text-foreground">{order.trackingNumber}</p>
                ) : (
                  <p className="mt-1 text-small text-foreground-muted">{shipmentStatusRecorded ? t('noTracking') : t('addTracking')}</p>
                )}
                {order.carrier && <p className="mt-1 text-[10px] text-foreground-subtle">{t('carrier', { carrier: order.carrier })}</p>}
              </div>
              <div className="sm:col-span-2">
                <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">{t('deliveryAddress')}</p>
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
            <div className="mb-4 border-b border-border pb-3"><TechnicalCode>{t('timelineCode')}</TechnicalCode><h2 className="mt-1 font-display text-lg text-foreground">{t('timelineTitle')}</h2></div>
            {timeline.length ? (
              <ol className="space-y-0 border-s border-border ps-4">
                {timeline.map((event) => (
                  <li key={event.id} className="relative pb-5 last:pb-0">
                    <span className="absolute -start-[1.32rem] top-1 h-2 w-2 rounded-full border border-accent bg-accent" aria-hidden="true" />
                    <p className="break-words font-mono text-[9px] uppercase tracking-[0.1em] text-foreground">{event.status}</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-foreground-muted">{event.description}</p>
                    <time dateTime={event.timestamp} className="mt-1 block font-mono text-[8px] uppercase tracking-[0.08em] text-foreground-subtle">{formatOrderDate(event.timestamp, locale, t('notRecorded'))}</time>
                  </li>
                ))}
              </ol>
            ) : <p className="text-small text-foreground-muted">{t('noEvents')}</p>}
          </AdminSurface>
        </div>

        <aside className="min-w-0 space-y-4 xl:col-span-4">
          <AdminSurface className="p-4 sm:p-5">
            <div className="mb-4 border-b border-border pb-3"><TechnicalCode>{t('paymentCode')}</TechnicalCode><h2 className="mt-1 font-display text-lg text-foreground">{t('paymentTitle')}</h2></div>
            <div className="flex flex-wrap gap-2"><PaymentStatusBadge status={order.paymentStatus} /><Badge variant="outline">{methodLabel}</Badge></div>
            <p className="mt-3 text-[10px] leading-relaxed text-foreground-muted">
              {order.paymentStatus === 'paid'
                ? t('paidNote')
                : t('unpaidNote')}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {order.paymentStatus !== 'paid' && (
                <Button type="button" variant="primary" className="w-full" onClick={() => { setNextPayment('paid'); setIsPaymentOpen(true); }}>{t('confirmPayment')}</Button>
              )}
              <Button type="button" variant="outline" className="w-full" onClick={() => { setNextPayment(order.paymentStatus); setIsPaymentOpen(true); }}>{t('adjustPayment')}</Button>
            </div>
          </AdminSurface>

          <AdminSurface className="p-4 sm:p-5">
            <div className="mb-4 border-b border-border pb-3"><TechnicalCode>{t('totalsCode')}</TechnicalCode><h2 className="mt-1 font-display text-lg text-foreground">{t('totalsTitle')}</h2></div>
            <dl className="space-y-3 border-y border-border py-4">
              <MoneyRow label={t('subtotal')} value={formatPrice(totals.subtotal)} />
              {totals.discountAmount > 0 && <MoneyRow label={`${t('discount')}${order.discountCode ? ` // ${order.discountCode}` : ''}`} value={`−${formatPrice(totals.discountAmount)}`} />}
              <MoneyRow label={t('delivery')} value={totals.shippingCost === 0 ? t('free') : formatPrice(totals.shippingCost)} />
              <MoneyRow label={t('tax')} value={totals.taxAmount === 0 ? t('included') : formatPrice(totals.taxAmount)} />
            </dl>
            <div className="flex items-end justify-between gap-3 pt-4">
              <div><p className="font-display text-base text-foreground">{t('total')}</p><p className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">{`${paymentStatusLabel(tOrders, order.paymentStatus)} // ${order.currency}`}</p></div>
              <PriceDisplay price={totals.total} size="xl" />
            </div>
          </AdminSurface>

          <AdminSurface className="p-4 sm:p-5">
            <div className="mb-4 border-b border-border pb-3"><TechnicalCode>{t('fulfilmentCode')}</TechnicalCode><h2 className="mt-1 font-display text-lg text-foreground">{t('fulfilmentTitle')}</h2></div>
            <OrderStatusBadge status={order.status} />
            <p className="mt-3 text-[10px] leading-relaxed text-foreground-muted">{t('fulfilmentNote')}</p>
            <Button type="button" variant="outline" className="mt-4 w-full" onClick={() => { setNextStatus(order.status); setCarrier(order.carrier ?? ''); setTrackingNumber(order.trackingNumber ?? ''); setIsStatusOpen(true); }}>{t('updateStatus')}</Button>
          </AdminSurface>
        </aside>
      </div>

      <Modal
        isOpen={isStatusOpen}
        onClose={() => !isSaving && setIsStatusOpen(false)}
        title={t('statusModalTitle')}
        code={t('statusModalCode', { number: order.orderNumber })}
        size="md"
        footer={<><Button type="button" variant="ghost" disabled={isSaving} onClick={() => setIsStatusOpen(false)}>{t('cancel')}</Button><Button type="button" variant="primary" isLoading={isSaving} onClick={confirmStatusChange}>{t('saveStatus')}</Button></>}
      >
        <div className="space-y-4">
          <Select label={t('newStatus')} value={nextStatus} onChange={(event) => setNextStatus(readOrderStatus(event.target.value))} options={ORDER_STATUSES.map((status) => ({ label: orderStatusLabel(tOrders, status), value: status }))} />
          <Input label={t('note')} value={statusNote} onChange={(event) => setStatusNote(event.target.value)} placeholder={t('notePlaceholder')} />
          {(nextStatus === 'shipped' || nextStatus === 'delivered') && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label={t('carrierLabel')} value={carrier} onChange={(event) => setCarrier(event.target.value)} placeholder={t('carrierPlaceholder')} />
              <Input label={t('trackingNumber')} value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} />
            </div>
          )}
          {nextStatus === 'cancelled' && (
            <p className="border border-warning/30 bg-warning-surface/50 p-3 text-[10px] leading-relaxed text-foreground-muted">{t('cancelNote')}</p>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isPaymentOpen}
        onClose={() => !isSaving && setIsPaymentOpen(false)}
        title={nextPayment === 'paid' && order.paymentStatus !== 'paid' ? t('confirmPayment') : t('adjustPayment')}
        code={t('paymentModalCode', { number: order.orderNumber })}
        size="md"
        footer={
          <>
            <Button type="button" variant="ghost" disabled={isSaving} onClick={() => setIsPaymentOpen(false)}>{t('cancel')}</Button>
            {nextPayment === 'paid' && order.paymentStatus !== 'paid' ? (
              <Button type="button" variant="primary" isLoading={isSaving} onClick={confirmPayment}>{t('markPaid')}</Button>
            ) : (
              <Button type="button" variant="primary" isLoading={isSaving} disabled={nextPayment === order.paymentStatus} onClick={changePaymentStatus}>{t('save')}</Button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          <Select label={t('paymentStatus')} value={nextPayment} onChange={(event) => setNextPayment(readPaymentStatus(event.target.value))} options={PAYMENT_STATUSES.map((status) => ({ label: paymentStatusLabel(tOrders, status), value: status }))} />
          {nextPayment === 'paid' && order.paymentStatus !== 'paid' && (
            <>
              <Input label={t('referenceOptional')} value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder={t('referencePlaceholder')} />
              <p className="text-[10px] leading-relaxed text-foreground-muted">{t('markPaidNote', { amount: formatPrice(totals.total), method: methodLabel })}</p>
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
