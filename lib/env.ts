/**
 * NOIRÉ — typed environment access.
 *
 * Centralises every variable the app reads so misconfiguration fails loudly at
 * boot (server) instead of as an obscure runtime error. Public values are
 * inlined by Next.js at build time and therefore must be referenced literally.
 */

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

/**
 * Supabase is the only data source. This throws at request time with a clear
 * message instead of letting a misconfigured deployment render a broken page.
 */
export function assertSupabaseConfigured(): void {
  if (!hasSupabasePublicConfig()) {
    throw new Error(
      '[noire/env] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required. See README → Backend.'
    );
  }
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
