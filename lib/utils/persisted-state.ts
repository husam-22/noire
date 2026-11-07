import type { CartItem, Discount, ShippingMethod } from '@/types';

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9_-]{0,159}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;
const DISCOUNT_TYPES: Discount['type'][] = [
  'percentage',
  'fixed_amount',
  'free_shipping',
];
const DISCOUNT_STATUSES: Discount['status'][] = [
  'active',
  'scheduled',
  'expired',
  'disabled',
  'archived',
];
const MAX_MONEY = 10_000_000;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function boundedText(
  value: unknown,
  fallback = '',
  maxLength = 256
): string {
  if (typeof value !== 'string') return fallback;
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .slice(0, maxLength);
}

function identifier(value: unknown): string | null {
  return typeof value === 'string' && IDENTIFIER.test(value) ? value : null;
}

function finiteNumber(
  value: unknown,
  minimum = 0,
  maximum = MAX_MONEY
): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum
    ? value
    : null;
}

function safeInteger(value: unknown, minimum: number, maximum: number): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum && value <= maximum
    ? value
    : null;
}

function validTimestamp(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 64) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

export function isSafeImageSource(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048 || value.includes('\\')) return false;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.hostname === 'images.unsplash.com' &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

function sanitizeColor(value: unknown): CartItem['selectedColor'] | null {
  if (!isRecord(value)) return null;
  const id = identifier(value.id);
  const name = boundedText(value.name, '', 80);
  const hex = typeof value.hex === 'string' && HEX_COLOR.test(value.hex) ? value.hex : null;
  return id && name && hex ? { id, name, hex } : null;
}

function sanitizeCartItem(value: unknown): CartItem | null {
  if (!isRecord(value)) return null;
  const id = identifier(value.id);
  const productId = identifier(value.productId);
  const slug = typeof value.slug === 'string' && SLUG.test(value.slug) ? value.slug : null;
  const name = boundedText(value.name, '', 180);
  const modelNumber = boundedText(value.modelNumber, '', 80);
  const categoryName = boundedText(value.categoryName, '', 100);
  const price = finiteNumber(value.price);
  const compareAtPrice = value.compareAtPrice === undefined
    ? undefined
    : finiteNumber(value.compareAtPrice);
  const image = isSafeImageSource(value.image) ? value.image : null;
  const selectedColor = sanitizeColor(value.selectedColor);
  const quantity = safeInteger(value.quantity, 1, 10);
  const maxQuantity = safeInteger(value.maxQuantity, 1, 10);
  const shippingEstimate = boundedText(value.shippingEstimate, '', 240);

  if (
    !id || !productId || !slug || !name || !modelNumber || !categoryName ||
    price === null || compareAtPrice === null || !image || !selectedColor ||
    quantity === null || maxQuantity === null || quantity > maxQuantity || !shippingEstimate
  ) return null;

  let selectedOption: CartItem['selectedOption'];
  if (value.selectedOption !== undefined && value.selectedOption !== null) {
    if (!isRecord(value.selectedOption)) return null;
    const optionId = identifier(value.selectedOption.id);
    const label = boundedText(value.selectedOption.label, '', 140);
    const priceDelta = finiteNumber(value.selectedOption.priceDelta, -MAX_MONEY, MAX_MONEY);
    if (!optionId || !label || priceDelta === null) return null;
    selectedOption = { id: optionId, label, priceDelta };
  }

  return {
    id,
    productId,
    slug,
    name,
    modelNumber,
    categoryName,
    price,
    ...(compareAtPrice === undefined ? {} : { compareAtPrice }),
    image,
    selectedColor,
    ...(selectedOption ? { selectedOption } : {}),
    quantity,
    maxQuantity,
    shippingEstimate,
  };
}

export function sanitizeCartState(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const items: CartItem[] = [];
  const seen = new Set<string>();
  for (const entry of value.slice(0, 100)) {
    const item = sanitizeCartItem(entry);
    if (!item || seen.has(item.id)) continue;
    seen.add(item.id);
    items.push(item);
  }
  return items;
}

export function sanitizeIdentifierList(value: unknown, limit = 100): string[] {
  if (!Array.isArray(value)) return [];
  const result: string[] = [];
  const seen = new Set<string>();
  for (const entry of value.slice(0, Math.max(0, limit * 2))) {
    const id = identifier(entry);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
    if (result.length >= limit) break;
  }
  return result;
}

export function sanitizeDiscountState(value: unknown): Discount | null {
  if (!isRecord(value)) return null;
  const id = identifier(value.id);
  const code = boundedText(value.code, '', 64).trim().toUpperCase();
  const description = boundedText(value.description, '', 240).trim();
  const type = DISCOUNT_TYPES.find((candidate) => candidate === value.type);
  const status = DISCOUNT_STATUSES.find((candidate) => candidate === value.status);
  const discountValue = finiteNumber(value.value, 0, 1_000_000);
  const usageCount = safeInteger(value.usageCount, 0, 1_000_000_000);
  const startsAt = validTimestamp(value.startsAt);
  const minOrderAmount = value.minOrderAmount === undefined
    ? undefined
    : finiteNumber(value.minOrderAmount);
  const usageLimit = value.usageLimit === undefined
    ? undefined
    : safeInteger(value.usageLimit, 1, 1_000_000_000);
  const expiresAt = value.expiresAt === undefined ? undefined : validTimestamp(value.expiresAt);
  if (
    !id || !/^[A-Z0-9_-]{1,64}$/.test(code) || !description || !type || !status ||
    discountValue === null || usageCount === null || !startsAt ||
    minOrderAmount === null || usageLimit === null || expiresAt === null ||
    (type === 'percentage' && discountValue > 100) ||
    (expiresAt && Date.parse(expiresAt) < Date.parse(startsAt))
  ) return null;

  return {
    id,
    code,
    description,
    type,
    value: discountValue,
    ...(minOrderAmount === undefined ? {} : { minOrderAmount }),
    usageCount,
    ...(usageLimit === undefined ? {} : { usageLimit }),
    status,
    startsAt,
    ...(expiresAt ? { expiresAt } : {}),
  };
}

export function sanitizeShippingMethodState(
  value: unknown,
  methods: ShippingMethod[]
): ShippingMethod {
  const fallback = methods[0];
  if (!fallback || !isRecord(value)) return fallback;
  const method = methods.find((candidate) => candidate.id === value.id);
  return method ? { ...method } : { ...fallback };
}
