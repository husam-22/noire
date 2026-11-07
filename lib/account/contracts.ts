import type {
  Address,
  Customer,
  CustomerSession,
  CustomerSessionIdentity,
  Order,
} from '@/types';

export type AuthenticatedCustomerSession = Extract<
  CustomerSession,
  { status: 'authenticated' }
>;

export type PrivateDispatchDiscipline =
  | 'acoustic-systems'
  | 'desk-architecture'
  | 'transit-field'
  | 'lighting';

export interface CustomerProfileRecord extends CustomerSessionIdentity {
  phone?: string;
}

export type CustomerProfileUpdate = Pick<
  CustomerProfileRecord,
  'firstName' | 'lastName' | 'email' | 'phone'
>;

export type CustomerPreferencesRecord = Customer['preferences'] & {
  email: string;
  disciplines: PrivateDispatchDiscipline[];
};

export type CustomerAddressInput = Omit<
  Address,
  'id' | 'isDefaultShipping' | 'isDefaultBilling'
> & {
  id?: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
};

/** Everything the account workspace needs, loaded server-side under RLS. */
export interface CustomerAccountSnapshot {
  profile: CustomerProfileRecord | null;
  orders: Order[];
  addresses: Address[];
  preferences: CustomerPreferencesRecord | null;
}

/**
 * Authoritative customer-data boundary. Implemented by
 * `lib/services/supabase/account.ts`; every query is scoped to the
 * authenticated user's `auth.uid()` by row-level security.
 */
export interface CustomerAccountProvider {
  getCustomerProfile(
    session: AuthenticatedCustomerSession
  ): Promise<CustomerProfileRecord | null>;
  getCustomerOrders(session: AuthenticatedCustomerSession): Promise<Order[]>;
  getCustomerAddresses(
    session: AuthenticatedCustomerSession
  ): Promise<Address[]>;
  updateCustomerProfile(
    session: AuthenticatedCustomerSession,
    profile: CustomerProfileUpdate
  ): Promise<CustomerProfileRecord>;
  updateCustomerAddress(
    session: AuthenticatedCustomerSession,
    address: CustomerAddressInput
  ): Promise<Address>;
  getCustomerPreferences(
    session: AuthenticatedCustomerSession
  ): Promise<CustomerPreferencesRecord | null>;
  updateCustomerPreferences(
    session: AuthenticatedCustomerSession,
    preferences: CustomerPreferencesRecord
  ): Promise<CustomerPreferencesRecord>;
}
