import type { Order, OrderStatus, OrderTotals, PaymentStatus } from '@/types';

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_settlement: 'Awaiting confirmation',
  processing: 'Confirmed · preparing',
  'Craft & Calibration': 'Craft & calibration',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'Paid',
  pending: 'Pending',
  refunded: 'Refunded',
  failed: 'Failed',
};

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status];
}

export function paymentStatusLabel(status: PaymentStatus): string {
  return PAYMENT_STATUS_LABELS[status];
}

/** Fulfillment label derived from the order status; nothing is inferred beyond the recorded state. */
export function fulfillmentStatusLabel(status: OrderStatus): string {
  if (status === 'pending_settlement') return 'Not started';
  return ORDER_STATUS_LABELS[status];
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

export function formatOrderDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date not recorded';
  return date.toLocaleDateString('en-GB', {
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
