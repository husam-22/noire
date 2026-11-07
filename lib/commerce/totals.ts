import type { CartItem, OrderTotals } from '@/types';

export const MAX_SETTLEMENT_AMOUNT = 10_000_000;

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function cartSubtotal(items: CartItem[]): number {
  return roundMoney(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
}

/** Internal consistency check of a totals object; authoritative pricing happens in `place_order`. */
export function validateOrderTotals(totals: OrderTotals): { valid: boolean; message: string } {
  const values = [totals.subtotal, totals.discountAmount, totals.shippingCost, totals.taxAmount, totals.total];
  if (values.some((value) => !Number.isFinite(value) || value < 0 || value > MAX_SETTLEMENT_AMOUNT)) {
    return { valid: false, message: 'One or more order values are invalid or out of range.' };
  }
  if (totals.currency !== 'USD') {
    return { valid: false, message: 'Only USD orders are supported at the moment.' };
  }
  const expectedTotal = Math.max(0, roundMoney(totals.subtotal - totals.discountAmount + totals.shippingCost + totals.taxAmount));
  if (Math.abs(expectedTotal - totals.total) > 0.01) {
    return { valid: false, message: 'The order totals have changed. Review the updated summary before placing the order.' };
  }
  if (totals.discountAmount > totals.subtotal) {
    return { valid: false, message: 'The discount cannot exceed the order subtotal.' };
  }
  return { valid: true, message: 'Totals are consistent.' };
}
