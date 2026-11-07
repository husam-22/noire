import 'server-only';

import type { Address, Order } from '@/types';
import type { Json } from '@/types/supabase';
import type {
  AuthenticatedCustomerSession,
  CustomerAccountProvider,
  CustomerAddressInput,
  CustomerPreferencesRecord,
  CustomerProfileRecord,
  CustomerProfileUpdate,
  PrivateDispatchDiscipline,
} from '@/lib/account/contracts';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NoireServiceError, toServiceError } from '@/lib/commerce/errors';
import { validateAddress } from '@/lib/commerce/address-validation';
import { addressToRow, mapAddress, profilePreferences } from './mappers';
import { getCustomerOrders } from './commerce';

const DISCIPLINES: PrivateDispatchDiscipline[] = ['acoustic-systems', 'desk-architecture', 'transit-field', 'lighting'];

function bounded(value: string | undefined, max: number): string {
  return (value ?? '').trim().slice(0, max);
}

/** Supabase-backed implementation of the account contract (RLS scopes every query to `auth.uid()`). */
export const supabaseCustomerAccountProvider: CustomerAccountProvider = {
  async getCustomerProfile(session: AuthenticatedCustomerSession): Promise<CustomerProfileRecord | null> {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, phone, client_code, created_at')
      .eq('id', session.customer.id)
      .maybeSingle();
    if (error) throw toServiceError(error);
    if (!data) return null;
    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone ?? undefined,
      clientCode: data.client_code ?? undefined,
      memberSince: data.created_at,
    };
  },

  async getCustomerOrders(session: AuthenticatedCustomerSession): Promise<Order[]> {
    return getCustomerOrders(session.customer.id);
  },

  async getCustomerAddresses(session: AuthenticatedCustomerSession): Promise<Address[]> {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('profile_id', session.customer.id)
      .order('is_default_shipping', { ascending: false })
      .order('created_at', { ascending: true });
    if (error) throw toServiceError(error);
    return (data ?? []).map(mapAddress);
  },

  async updateCustomerProfile(session: AuthenticatedCustomerSession, profile: CustomerProfileUpdate): Promise<CustomerProfileRecord> {
    const firstName = bounded(profile.firstName, 80);
    const lastName = bounded(profile.lastName, 80);
    if (!firstName || !lastName) {
      throw new NoireServiceError('First and last name are required.', 'VALIDATION_ERROR', 422);
    }
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from('profiles')
      .update({ first_name: firstName, last_name: lastName, phone: bounded(profile.phone, 40) || null })
      .eq('id', session.customer.id)
      .select('id, first_name, last_name, email, phone, client_code, created_at')
      .single();
    if (error) throw toServiceError(error);
    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone ?? undefined,
      clientCode: data.client_code ?? undefined,
      memberSince: data.created_at,
    };
  },

  async updateCustomerAddress(session: AuthenticatedCustomerSession, address: CustomerAddressInput): Promise<Address> {
    const validation = validateAddress(address);
    if (!validation.valid) {
      const first = Object.values(validation.fieldErrors ?? {})[0];
      throw new NoireServiceError(first ?? validation.message, 'VALIDATION_ERROR', 422);
    }
    const supabase = createSupabaseServerClient();
    const profileId = session.customer.id;

    // Partial unique indexes allow a single default per kind — clear the previous one first.
    if (address.isDefaultShipping) {
      await supabase.from('addresses').update({ is_default_shipping: false }).eq('profile_id', profileId).eq('is_default_shipping', true);
    }
    if (address.isDefaultBilling) {
      await supabase.from('addresses').update({ is_default_billing: false }).eq('profile_id', profileId).eq('is_default_billing', true);
    }

    const row = addressToRow(profileId, {
      ...address,
      isDefaultShipping: address.isDefaultShipping ?? false,
      isDefaultBilling: address.isDefaultBilling ?? false,
    });
    const { data, error } = await supabase.from('addresses').upsert(row, { onConflict: 'id' }).select('*').single();
    if (error) throw toServiceError(error);
    return mapAddress(data);
  },

  async getCustomerPreferences(session: AuthenticatedCustomerSession): Promise<CustomerPreferencesRecord | null> {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.from('profiles').select('email, preferences').eq('id', session.customer.id).maybeSingle();
    if (error) throw toServiceError(error);
    if (!data) return null;
    const prefs = profilePreferences(data.preferences);
    return {
      email: data.email,
      newsletter: prefs.newsletter,
      privateReleases: prefs.privateReleases,
      smsUpdates: prefs.smsUpdates,
      preferredCurrency: prefs.preferredCurrency,
      disciplines: prefs.disciplines.filter((d): d is PrivateDispatchDiscipline => (DISCIPLINES as string[]).includes(d)),
    };
  },

  async updateCustomerPreferences(
    session: AuthenticatedCustomerSession,
    preferences: CustomerPreferencesRecord
  ): Promise<CustomerPreferencesRecord> {
    const supabase = createSupabaseServerClient();
    const next = {
      newsletter: Boolean(preferences.newsletter),
      privateReleases: Boolean(preferences.privateReleases),
      smsUpdates: Boolean(preferences.smsUpdates),
      preferredCurrency: preferences.preferredCurrency,
      disciplines: preferences.disciplines.filter((d) => DISCIPLINES.includes(d)),
    };
    const { data, error } = await supabase
      .from('profiles')
      .update({ preferences: next as unknown as Json })
      .eq('id', session.customer.id)
      .select('email, preferences')
      .single();
    if (error) throw toServiceError(error);
    const prefs = profilePreferences(data.preferences);
    return {
      email: data.email,
      newsletter: prefs.newsletter,
      privateReleases: prefs.privateReleases,
      smsUpdates: prefs.smsUpdates,
      preferredCurrency: prefs.preferredCurrency,
      disciplines: prefs.disciplines.filter((d): d is PrivateDispatchDiscipline => (DISCIPLINES as string[]).includes(d)),
    };
  },
};

export async function deleteCustomerAddress(session: AuthenticatedCustomerSession, addressId: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from('addresses').delete().eq('id', addressId).eq('profile_id', session.customer.id);
  if (error) throw toServiceError(error);
}

export async function subscribeToNewsletter(email: string, locale: 'en' | 'ar', source = 'home'): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new NoireServiceError('Enter a valid email address.', 'VALIDATION_ERROR', 422);
  }
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from('newsletter_subscribers').insert({ email: normalized, locale, source });
  // Duplicate subscriptions are fine — treat as success.
  if (error && error.code !== '23505') throw toServiceError(error);
}
