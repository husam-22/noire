import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';
import { publicEnv } from '@/lib/env';

/**
 * Refreshes the Supabase auth session on every request and copies the rotated
 * cookies onto the response produced by the next-intl middleware.
 * Returns the (possibly null) user so callers can guard routes.
 */
export async function refreshSupabaseSession(request: NextRequest, response: NextResponse) {
  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) {
    return { response, user: null };
  }

  const supabase = createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
