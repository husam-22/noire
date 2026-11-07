import type { Discount } from '@/types';

/** Local-only sample codes. Usage is zero/unrecorded; this is not an offer ledger. */
export const MOCK_DISCOUNTS: Discount[] = [
  {
    id: 'disc-01',
    code: 'EDITION04',
    description: '10% off Edition 04 allocations',
    type: 'percentage',
    value: 10,
    minOrderAmount: 500,
    usageCount: 0,
    status: 'active',
    startsAt: '2026-09-01T00:00:00Z',
    expiresAt: '2026-11-30T23:59:59Z',
  },
  {
    id: 'disc-02',
    code: 'ARCHITECT150',
    description: '$150 off orders over the studio minimum',
    type: 'fixed_amount',
    value: 150,
    minOrderAmount: 1200,
    usageCount: 0,
    status: 'active',
    startsAt: '2026-08-15T00:00:00Z',
    expiresAt: '2026-12-31T23:59:59Z',
  },
];
