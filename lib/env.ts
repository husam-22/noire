/**
 * NOIRÉ — typed environment access.
 *
 * Centralises every variable the app reads so misconfiguration fails loudly at
 * boot (server) instead of as an obscure runtime error. Public values are
 * inlined by Next.js at build time and therefore must be referenced literally.
 */

export type DataSource = 'mock' | 'supabase';

function readPublic(name: string, value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export const publicEnv = {
  supabaseUrl: readPublic('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: readPublic('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  siteUrl: readPublic('NEXT_PUBLIC_SITE_URL', process.env.NEXT_PUBLIC_SITE_URL) ?? 'http://localhost:3000',
} as const;

/** True when the browser-safe Supabase credentials are present. */
export function hasSupabasePublicConfig(): boolean {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey);
}

/** Which adapter the service layer should use. Falls back to fixtures when Supabase is not configured. */
export function getDataSource(): DataSource {
  const requested = (process.env.NOIRE_DATA_SOURCE ?? 'mock').trim().toLowerCase();
  if (requested === 'supabase') {
    if (!hasSupabasePublicConfig()) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(
          '[noire/env] NOIRE_DATA_SOURCE=supabase but NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are missing — falling back to mock data.'
        );
      }
      return 'mock';
    }
    return 'supabase';
  }
  return 'mock';
}

/** Server-only secrets. Throws when called from the browser bundle or when a key is absent. */
export function requireServerEnv(name: 'SUPABASE_SERVICE_ROLE_KEY' | 'STRIPE_SECRET_KEY' | 'STRIPE_WEBHOOK_SECRET'): string {
  if (typeof window !== 'undefined') {
    throw new Error(`[noire/env] ${name} must never be read in the browser.`);
  }
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`[noire/env] Missing required server environment variable ${name}.`);
  }
  return value;
}
