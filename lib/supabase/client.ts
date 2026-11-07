'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import { publicEnv } from '@/lib/env';

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Browser Supabase client (anon key, RLS enforced). Safe to call in any Client
 * Component; the instance is memoised for the lifetime of the page.
 */
export function getSupabaseBrowserClient() {
  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) {
    throw new Error('[noire/supabase] Browser client requested without NEXT_PUBLIC_SUPABASE_* configuration.');
  }
  browserClient ??= createBrowserClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
  return browserClient;
}
