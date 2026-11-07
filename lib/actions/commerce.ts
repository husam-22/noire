'use server';

import { getLocale } from 'next-intl/server';
import type { Address, AddressValidationResult, CartItem, CartValidationResult, Order, Product, ProductFilterParams, SearchSuggestionResult, ShippingMethod } from '@/types';
import { isAppLocale } from '@/i18n/routing';
import { validateAddress } from '@/lib/commerce/address-validation';
import {
  getOrderReceipt,
  placeOrder as placeOrderService,
  quoteShippingMethods,
  validateCartForCheckout as validateCartService,
  validateDiscountCode as validateDiscountService,
  type DiscountValidation,
  type PlaceOrderInput,
} from '@/lib/services/supabase/commerce';
import { getProducts as getProductsService } from '@/lib/services/supabase/catalog';
import { searchCatalog as searchCatalogService } from '@/lib/services/supabase/search';
import { runAction, type ActionResult } from './result';

async function requestLocale(): Promise<'en' | 'ar'> {
  const locale = await getLocale();
  return isAppLocale(locale) ? locale : 'en';
}

export async function validateDiscountAction(code: string, subtotal: number): Promise<ActionResult<DiscountValidation>> {
  return runAction(() => validateDiscountService(String(code ?? '').slice(0, 40), Number(subtotal) || 0));
}

export async function quoteShippingAction(
  country: string | undefined,
  subtotal: number,
  freeShippingPrivilege: boolean
): Promise<ActionResult<ShippingMethod[]>> {
  return runAction(() => quoteShippingMethods(country, Number(subtotal) || 0, Boolean(freeShippingPrivilege)));
}

export async function validateCartAction(items: CartItem[]): Promise<ActionResult<CartValidationResult>> {
  return runAction(() => validateCartService(Array.isArray(items) ? items.slice(0, 50) : []));
}

export async function validateAddressAction(address: Partial<Address>): Promise<AddressValidationResult> {
  return validateAddress(address ?? {});
}

export async function placeOrderAction(input: Omit<PlaceOrderInput, 'locale'>): Promise<ActionResult<Order>> {
  const locale = await requestLocale();
  return runAction(() => placeOrderService({ ...input, locale }), 'The order could not be placed. Please try again.');
}

export async function getOrderReceiptAction(orderId: string): Promise<ActionResult<Order | null>> {
  return runAction(() => getOrderReceipt(orderId));
}

export async function searchCatalogAction(query: string): Promise<ActionResult<SearchSuggestionResult>> {
  const locale = await requestLocale();
  return runAction(() => searchCatalogService(String(query ?? '').slice(0, 80), locale));
}

export async function fetchProductsAction(params: ProductFilterParams): Promise<ActionResult<{ items: Product[]; total: number; totalPages: number; page: number; limit: number; hasMore: boolean }>> {
  const locale = await requestLocale();
  return runAction(() => getProductsService(params ?? {}, locale));
}
