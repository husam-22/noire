'use server';

import { revalidatePath } from 'next/cache';
import type { Address, Order } from '@/types';
import type { CustomerAddressInput, CustomerPreferencesRecord, CustomerProfileRecord, CustomerProfileUpdate } from '@/lib/account/contracts';
import { customerSessionProvider } from '@/lib/account/supabase-customer-session';
import { deleteCustomerAddress, supabaseCustomerAccountProvider } from '@/lib/services/supabase/account';
import { NoireServiceError } from '@/lib/commerce/errors';
import { runAction, type ActionResult } from './result';

async function requireSession() {
  const session = await customerSessionProvider.getSession();
  if (session.status !== 'authenticated') {
    throw new NoireServiceError('Please sign in to continue.', 'UNAUTHORIZED', 401);
  }
  return session;
}

export async function loadAccountOverviewAction(): Promise<ActionResult<{ profile: CustomerProfileRecord | null; orders: Order[]; addresses: Address[]; preferences: CustomerPreferencesRecord | null }>> {
  return runAction(async () => {
    const session = await requireSession();
    const [profile, orders, addresses, preferences] = await Promise.all([
      supabaseCustomerAccountProvider.getCustomerProfile(session),
      supabaseCustomerAccountProvider.getCustomerOrders(session),
      supabaseCustomerAccountProvider.getCustomerAddresses(session),
      supabaseCustomerAccountProvider.getCustomerPreferences(session),
    ]);
    return { profile, orders, addresses, preferences };
  });
}

export async function updateProfileAction(profile: CustomerProfileUpdate): Promise<ActionResult<CustomerProfileRecord>> {
  return runAction(async () => {
    const session = await requireSession();
    const saved = await supabaseCustomerAccountProvider.updateCustomerProfile(session, profile);
    revalidatePath('/[locale]/account', 'page');
    return saved;
  });
}

export async function saveAddressAction(address: CustomerAddressInput): Promise<ActionResult<Address>> {
  return runAction(async () => {
    const session = await requireSession();
    const saved = await supabaseCustomerAccountProvider.updateCustomerAddress(session, address);
    revalidatePath('/[locale]/account', 'page');
    return saved;
  });
}

export async function deleteAddressAction(addressId: string): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const session = await requireSession();
    await deleteCustomerAddress(session, addressId);
    revalidatePath('/[locale]/account', 'page');
    return { id: addressId };
  });
}

export async function updatePreferencesAction(preferences: CustomerPreferencesRecord): Promise<ActionResult<CustomerPreferencesRecord>> {
  return runAction(async () => {
    const session = await requireSession();
    return supabaseCustomerAccountProvider.updateCustomerPreferences(session, preferences);
  });
}
