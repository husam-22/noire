import 'server-only';

import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { publicEnv, requireServerEnv } from '@/lib/env';

function assertPublicConfig(): { url: string; anonKey: string } {
  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) {
    throw new Error('[noire/supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not configured.');
  }
  return { url: publicEnv.supabaseUrl, anonKey: publicEnv.supabaseAnonKey };
}

/**
 * Request-scoped client for Server Components, Route Handlers, and Server
 * Actions. Reads the auth session from cookies; RLS applies as the signed-in
 * user (or anon). Cookie writes are swallowed in Server Components, where
 * Next.js forbids them — the proxy in `middleware.ts` refreshes sessions instead.
 */
export function createSupabaseServerClient() {
  const { url, anonKey } = assertPublicConfig();
  const cookieStore = cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component — safe to ignore.
        }
      },
    },
  });
}

/**
 * Service-role client. Bypasses RLS — use ONLY in trusted server code paths
 * (webhooks, seeding, admin actions that already verified `profile.role`).
 */
export function createSupabaseAdminClient() {
  const { url } = assertPublicConfig();
  return createClient<Database>(url, requireServerEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
