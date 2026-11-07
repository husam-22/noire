import type { ShippingMethod } from '@/types';

/**
 * Seed fixtures for the `shipping_methods` table. The live store reads shipping
 * methods from Supabase (`quote_shipping` RPC); these rows are only used by
 * `scripts/seed-*.ts` and the unit tests.
 */
export const SEED_SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'ship-express',
    code: 'NR-EXPRESS',
    name: 'Express Courier',
    carrier: 'Express courier',
    estimatedWindow: '2–4 business days',
    estimatedDispatch: 'Dispatched within 1 business day of payment confirmation.',
    baseCost: 35,
    freeAboveSubtotal: 500,
    description: 'Tracked door-to-door delivery with signature on receipt. Free on orders over $500.',
  },
  {
    id: 'ship-white-glove',
    code: 'NR-WHITE-GLOVE',
    name: 'Studio Delivery',
    carrier: 'NOIRÉ delivery team',
    estimatedWindow: '1–3 business days',
    estimatedDispatch: 'Scheduled with you by phone after payment confirmation.',
    baseCost: 85,
    description: 'Hand delivery, unpacking and placement by our own team. Available in selected cities.',
  },
  {
    id: 'ship-standard-intl',
    code: 'NR-STANDARD',
    name: 'Standard Courier',
    carrier: 'International courier',
    estimatedWindow: '5–10 business days',
    estimatedDispatch: 'Dispatched within 2 business days of payment confirmation.',
    baseCost: 25,
    freeAboveSubtotal: 500,
    description: 'Tracked economy delivery. Duties and taxes for international destinations are paid on arrival.',
  },
];
