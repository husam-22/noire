import 'server-only';

import type {
  Address,
  CartItem,
  CartValidationIssue,
  CartValidationResult,
  CheckoutCustomerInfo,
  Discount,
  Order,
  OrderTotals,
  PaymentMethodType,
  ShippingMethod,
} from '@/types';
import type { Json } from '@/types/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NoireServiceError, toServiceError } from '@/lib/commerce/errors';
import { cartSubtotal, roundMoney, validateOrderTotals } from '@/lib/commerce/totals';
import { mapOrder, mapOrderReceipt, mapShippingMethod } from './mappers';

/* ------------------------------------------------------------------------- */
/* Discounts                                                                 */
/* ------------------------------------------------------------------------- */

export interface DiscountValidation {
  valid: boolean;
  discount?: Discount;
  discountAmount: number;
  message: string;
}

interface ValidateDiscountRpc {
  valid: boolean;
  code?: string;
  message?: string;
  discountId?: string;
  type?: Discount['type'];
  value?: number;
  amount?: number;
  freeShipping?: boolean;
  description?: string;
  minOrderAmount?: number;
}

/** Validates a code through the `validate_discount` RPC — the discounts table is never read directly. */
export async function validateDiscountCode(code: string, subtotal: number): Promise<DiscountValidation> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.rpc('validate_discount', { p_code: code, p_subtotal: roundMoney(subtotal) });
  if (error) throw toServiceError(error);
  const result = (data ?? { valid: false }) as unknown as ValidateDiscountRpc;
  if (!result.valid || !result.discountId || !result.type || !result.code) {
    return { valid: false, discountAmount: 0, message: result.message ?? 'This code is not valid.' };
  }
  const discount: Discount = {
    id: result.discountId,
    code: result.code,
    description: result.description ?? '',
    type: result.type,
    value: Number(result.value ?? 0),
    minOrderAmount: result.minOrderAmount,
    usageCount: 0,
    status: 'active',
    startsAt: new Date(0).toISOString(),
  };
  return {
    valid: true,
    discount,
    discountAmount: Number(result.amount ?? 0),
    message: discount.description ? `${discount.code} applied — ${discount.description}` : `${discount.code} applied`,
  };
}

/* ------------------------------------------------------------------------- */
/* Shipping                                                                  */
/* ------------------------------------------------------------------------- */

export async function quoteShippingMethods(
  country?: string,
  subtotal = 0,
  freeShippingPrivilege = false
): Promise<ShippingMethod[]> {
  const supabase = createSupabaseServerClient();
  let request = supabase.from('shipping_methods').select('*').eq('active', true).order('sort_order');
  if (country) request = request.or(`countries.is.null,countries.cs.{${country}}`);
  const { data, error } = await request;
  if (error) throw toServiceError(error);
  return (data ?? []).map((row) => {
    const method = mapShippingMethod(row);
    const free = freeShippingPrivilege || (method.freeAboveSubtotal !== undefined && subtotal >= method.freeAboveSubtotal);
    return { ...method, quotedCost: free ? 0 : method.baseCost };
  });
}

/* ------------------------------------------------------------------------- */
/* Cart validation (re-priced from the catalog)                              */
/* ------------------------------------------------------------------------- */

const MAX_UNITS_PER_LINE = 10;

export async function validateCartForCheckout(items: CartItem[]): Promise<CartValidationResult> {
  if (!items || items.length === 0) {
    return {
      valid: false,
      issues: [{ itemId: 'empty', productId: '', productName: 'Bag', type: 'product_unavailable', message: 'Your bag is empty.' }],
    };
  }

  const supabase = createSupabaseServerClient();
  const productIds = Array.from(new Set(items.map((item) => item.productId)));
  const { data, error } = await supabase
    .from('products')
    .select('id, name, status, price, stock_status, inventory_count, colors, options')
    .in('id', productIds);
  if (error) throw toServiceError(error);

  const products = new Map((data ?? []).map((row) => [row.id, row]));
  const issues: CartValidationIssue[] = [];

  for (const item of items) {
    const product = products.get(item.productId);
    if (!product || product.status !== 'active') {
      issues.push({ itemId: item.id, productId: item.productId, productName: item.name, type: 'product_unavailable', message: `${item.name} is no longer available.` });
      continue;
    }
    if (product.stock_status === 'out_of_stock' || (product.stock_status !== 'pre_order' && product.inventory_count <= 0)) {
      issues.push({ itemId: item.id, productId: item.productId, productName: item.name, type: 'out_of_stock', message: `${item.name} is currently out of stock.` });
      continue;
    }

    const colors = (Array.isArray(product.colors) ? product.colors : []) as Array<{ id: string; inStock?: boolean }>;
    const color = colors.find((c) => c.id === item.selectedColor.id);
    if (!color || color.inStock === false) {
      issues.push({ itemId: item.id, productId: item.productId, productName: item.name, type: 'color_unavailable', message: `The ${item.selectedColor.name} finish of ${item.name} is currently unavailable.` });
    }

    let expectedDelta = 0;
    if (item.selectedOption) {
      const options = (Array.isArray(product.options) ? product.options : []) as Array<{ id: string; inStock?: boolean; priceDelta?: number }>;
      const option = options.find((o) => o.id === item.selectedOption?.id);
      if (!option || option.inStock === false) {
        issues.push({ itemId: item.id, productId: item.productId, productName: item.name, type: 'option_unavailable', message: `The ${item.selectedOption.label} configuration of ${item.name} is no longer offered.` });
      } else {
        expectedDelta = Number(option.priceDelta ?? 0);
      }
    }

    const availableUnits = product.stock_status === 'pre_order' ? MAX_UNITS_PER_LINE : product.inventory_count;
    const maxAllowed = Math.max(1, Math.min(MAX_UNITS_PER_LINE, availableUnits));
    if (item.quantity > maxAllowed || item.quantity <= 0) {
      issues.push({ itemId: item.id, productId: item.productId, productName: item.name, type: 'quantity_adjusted', message: `Only ${maxAllowed} unit(s) of ${item.name} can be ordered right now.`, suggestedQuantity: maxAllowed });
    }

    const expectedUnitPrice = roundMoney(Number(product.price) + expectedDelta);
    if (Math.abs(item.price - expectedUnitPrice) > 0.009) {
      issues.push({ itemId: item.id, productId: item.productId, productName: item.name, type: 'price_updated', message: `The price of ${item.name} has been updated to $${expectedUnitPrice}.`, updatedPrice: expectedUnitPrice });
    }
  }

  // Cross-line inventory check per product.
  const byProduct = new Map<string, CartItem[]>();
  for (const item of items) byProduct.set(item.productId, [...(byProduct.get(item.productId) ?? []), item]);
  for (const [productId, lines] of byProduct) {
    const product = products.get(productId);
    if (!product || product.stock_status === 'pre_order') continue;
    const requested = lines.reduce((sum, line) => sum + Math.max(0, line.quantity), 0);
    if (requested > product.inventory_count) {
      const representative = lines[0];
      issues.push({ itemId: representative.id, productId, productName: representative.name, type: 'quantity_adjusted', message: `Across all finishes, only ${product.inventory_count} unit(s) of ${representative.name} remain.` });
    }
  }

  return { valid: issues.length === 0, issues };
}

/* ------------------------------------------------------------------------- */
/* Orders                                                                    */
/* ------------------------------------------------------------------------- */

export interface PlaceOrderInput {
  idempotencyKey: string;
  customer: CheckoutCustomerInfo;
  shippingAddress: Address;
  billingAddress: Address;
  shippingMethodId: string;
  items: CartItem[];
  totals: OrderTotals;
  discountCode?: string;
  paymentMethodType: Extract<PaymentMethodType, 'cash_on_delivery' | 'bank_transfer'>;
  notes?: string;
  locale: 'en' | 'ar';
}

/**
 * Places an order through the `place_order` RPC. Everything money-related is
 * recomputed in Postgres; the client totals are only checked for consistency
 * so a stale summary produces a clear error instead of a surprising charge.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  const totalsCheck = validateOrderTotals(input.totals);
  if (!totalsCheck.valid) throw new NoireServiceError(totalsCheck.message, 'VALIDATION_ERROR', 422);
  if (Math.abs(cartSubtotal(input.items) - input.totals.subtotal) > 0.01) {
    throw new NoireServiceError('The displayed subtotal does not match the items in your bag.', 'VALIDATION_ERROR', 422);
  }

  const cartCheck = await validateCartForCheckout(input.items);
  if (!cartCheck.valid) {
    throw new NoireServiceError(cartCheck.issues[0]?.message ?? 'Your bag could not be validated.', 'VALIDATION_ERROR', 422);
  }

  const supabase = createSupabaseServerClient();
  const payload = {
    idempotencyKey: input.idempotencyKey,
    customer: input.customer,
    shippingAddress: input.shippingAddress,
    billingAddress: input.billingAddress,
    shippingMethodId: input.shippingMethodId,
    items: input.items.map((item) => ({
      productId: item.productId,
      colorId: item.selectedColor.id,
      optionId: item.selectedOption?.id ?? null,
      quantity: item.quantity,
    })),
    discountCode: input.discountCode ?? null,
    payment: { provider: 'manual', methodType: input.paymentMethodType },
    notes: input.notes ?? null,
    locale: input.locale,
  } as unknown as Json;

  const { data: orderId, error } = await supabase.rpc('place_order', { payload });
  if (error) throw toServiceError(error, 'The order could not be placed.');

  const order = await getOrderReceipt(orderId);
  if (!order) throw new NoireServiceError('The order was created but could not be loaded.', 'INTERNAL_ERROR', 500);

  // The server recomputed every amount; refuse to continue silently if the buyer saw a different total.
  if (Math.abs(order.total - input.totals.total) > 0.01) {
    throw new NoireServiceError(
      `Pricing changed while placing the order (new total $${order.total.toFixed(2)}). Order ${order.orderNumber} was recorded — contact us if you did not expect this.`,
      'CONFLICT',
      409
    );
  }
  return order;
}

/** Receipt lookup by the unguessable order id (works for guests and signed-in buyers). */
export async function getOrderReceipt(orderId: string): Promise<Order | null> {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return null;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.rpc('get_order_receipt', { p_order_id: orderId });
  if (error) throw toServiceError(error);
  return mapOrderReceipt(data);
}

/** Orders owned by the signed-in customer (RLS scoped). */
export async function getCustomerOrders(profileId: string): Promise<Order[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), order_events(*)')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw toServiceError(error);
  return (data ?? []).map((row) => {
    const { order_items: items, order_events: events, ...order } = row;
    return mapOrder(order, items ?? [], (events ?? []).sort((a, b) => a.created_at.localeCompare(b.created_at)));
  });
}
