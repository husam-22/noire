import type { Order, OrderStatus, OrderTotals, PaymentMethodType, PaymentStatus } from '@/types';

/** Translator bound to the `orders` message namespace (client: useTranslations('orders'), server: getTranslations('orders')). */
export type OrdersTranslator = (key: string, values?: Record<string, string | number | Date>) => string;

const ORDER_STATUS_KEYS: Record<OrderStatus, string> = {
  pending_settlement: 'pending_settlement',
  processing: 'processing',
  'Craft & Calibration': 'craft_calibration',
  shipped: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
  returned: 'returned',
};

export function orderStatusKey(status: OrderStatus | string): string {
  return ORDER_STATUS_KEYS[status as OrderStatus] ?? String(status);
}

export function orderStatusLabel(t: OrdersTranslator, status: OrderStatus | string): string {
  const key = ORDER_STATUS_KEYS[status as OrderStatus];
  return key ? t(`status.${key}`) : String(status).replaceAll('_', ' ');
}

export function paymentStatusLabel(t: OrdersTranslator, status: PaymentStatus | string): string {
  if (status === 'paid' || status === 'pending' || status === 'refunded' || status === 'failed') {
    return t(`paymentStatus.${status}`);
  }
  return String(status);
}

/** Fulfillment label derived from the order status; nothing is inferred beyond the recorded state. */
export function fulfillmentStatusLabel(t: OrdersTranslator, status: OrderStatus | string): string {
  if (status === 'pending_settlement') return t('fulfillmentNotStarted');
  return orderStatusLabel(t, status);
}

/** Translate a payment method type; falls back to the stored label when the type is unknown. */
export function paymentMethodTypeLabel(
  t: OrdersTranslator,
  methodType: PaymentMethodType | string | undefined,
  fallback: string
): string {
  switch (methodType) {
    case 'cash_on_delivery':
    case 'bank_transfer':
    case 'wire_transfer':
    case 'apple_pay':
      return t(`paymentMethod.${methodType}`);
    case 'card':
      return fallback || t('paymentMethod.card');
    default:
      return fallback || t('paymentMethod.manual');
  }
}

export function orderPaymentMethodLabel(t: OrdersTranslator, order: Pick<Order, 'paymentMethod' | 'paymentSummary'>): string {
  return paymentMethodTypeLabel(t, order.paymentSummary?.methodType, order.paymentMethod);
}

export function orderUnitCount(order: Order): number {
  return order.items.reduce((total, item) => total + item.quantity, 0);
}

export function orderTotals(order: Order): OrderTotals {
  return (
    order.totals ?? {
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      shippingCost: order.shippingCost,
      taxAmount: order.taxAmount,
      total: order.total,
      currency: order.currency,
    }
  );
}

export function formatOrderDate(value: string, locale = 'en-GB', fallback = 'Date not recorded'): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function orderDestinationSummary(order: Order): string | null {
  const parts = [order.shippingAddress.city, order.shippingAddress.country]
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}
