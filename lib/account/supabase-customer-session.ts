import 'server-only';

import type { CustomerSession } from '@/types';
import type { CustomerSessionProvider } from './customer-session';
import { previewCustomerSessionProvider } from './customer-session';
import { hasSupabasePublicConfig } from '@/lib/env';

/**
 * Supabase-backed implementation of the `CustomerSessionProvider` contract.
 * Resolves the signed-in user from the request cookies and joins their profile.
 * Falls back to the preview (guest) provider when Supabase is not configured,
 * so pages can import this provider unconditionally.
 */
export const supabaseCustomerSessionProvider: CustomerSessionProvider = {
  async getSession(): Promise<CustomerSession> {
    if (!hasSupabasePublicConfig()) {
      return previewCustomerSessionProvider.getSession();
    }

    const { createSupabaseServerClient } = await import('@/lib/supabase/server');
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { status: 'guest', source: 'preview' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, phone, client_code, created_at')
      .eq('id', user.id)
      .maybeSingle();

    return {
      status: 'authenticated',
      source: 'provider',
      customer: {
        id: user.id,
        firstName: profile?.first_name ?? '',
        lastName: profile?.last_name ?? '',
        email: profile?.email ?? user.email ?? '',
        phone: profile?.phone ?? undefined,
        clientCode: profile?.client_code ?? undefined,
        memberSince: profile?.created_at ?? user.created_at,
      },
    };
  },
};

/** The provider the app should use: Supabase when configured, preview otherwise. */
export const customerSessionProvider: CustomerSessionProvider = supabaseCustomerSessionProvider;
