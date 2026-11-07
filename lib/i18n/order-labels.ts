import type { OrderStatus, PaymentMethodType, PaymentStatus } from '@/types';

type Translate = (key: string, values?: Record<string, string | number | Date>) => string;

const STATUS_KEYS: Record<OrderStatus, string> = {
  pending_settlement: 'pending_settlement',
  processing: 'processing',
  'Craft & Calibration': 'craft_calibration',
  shipped: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
  returned: 'returned',
};

/** Translate an order status using the `orders` namespace translator. */
export function orderStatusLabel(t: Translate, status: OrderStatus | string): string {
  const key = STATUS_KEYS[status as OrderStatus];
  return key ? t(`status.${key}`) : String(status).replaceAll('_', ' ');
}

/** Translate a payment status using the `orders` namespace translator. */
export function paymentStatusLabel(t: Translate, status: PaymentStatus | string): string {
  if (status === 'paid' || status === 'pending' || status === 'refunded' || status === 'failed') {
    return t(`paymentStatus.${status}`);
  }
  return String(status);
}

/** Translate a payment method type; falls back to the stored label when the type is unknown. */
export function paymentMethodTypeLabel(
  t: Translate,
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
