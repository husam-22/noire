import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { routing } from '@/i18n/routing';

/**
 * Supabase Auth redirect target (magic links, OAuth, password recovery).
 * Exchanges the one-time `code` for a session cookie and continues to `next`.
 * Lives outside `[locale]` so a single URL can be registered with providers;
 * the locale is carried in `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next') ?? '/account';
  // Only allow same-origin relative redirects.
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/account';

  if (code) {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  const locale = next.match(/^\/(ar)(?=\/|$)/)?.[1];
  const prefix = locale && locale !== routing.defaultLocale ? `/${locale}` : '';
  return NextResponse.redirect(`${origin}${prefix}/auth/sign-in?error=auth_callback_failed`);
}
