import type { CustomerSession } from '@/types';

export interface CustomerSessionProvider {
  getSession(): Promise<CustomerSession>;
}

export const GUEST_SESSION: CustomerSession = { status: 'guest', source: 'none' };
