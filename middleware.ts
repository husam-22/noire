import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { hasSupabasePublicConfig } from './lib/env';
import { refreshSupabaseSession } from './lib/supabase/middleware';

const handleI18nRouting = createMiddleware(routing);

/** Route prefixes (locale-agnostic) that require a signed-in user. */
const PROTECTED_PREFIXES = ['/account', '/admin'];
/** Route prefixes that additionally require the `staff` or `admin` role. */
const STAFF_PREFIXES = ['/admin'];

function stripLocale(pathname: string): string {
  const match = pathname.match(/^\/(en|ar)(?=\/|$)/);
  return match ? pathname.slice(match[0].length) || '/' : pathname;
}

function localePrefix(pathname: string): string {
  const match = pathname.match(/^\/(en|ar)(?=\/|$)/);
  return match && match[1] !== routing.defaultLocale ? `/${match[1]}` : '';
}

export default async function middleware(request: NextRequest) {
  const response = handleI18nRouting(request);

  // Without Supabase configured the app runs on fixtures and no auth boundary exists
  // (preview mode). The README documents that `/admin` is unprotected in this mode.
  if (!hasSupabasePublicConfig()) {
    return response;
  }

  const { user } = await refreshSupabaseSession(request, response);
  const path = stripLocale(request.nextUrl.pathname);
  const prefix = localePrefix(request.nextUrl.pathname);

  const needsUser = PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
  if (needsUser && !user) {
    const loginUrl = new URL(`${prefix}/auth/sign-in`, request.url);
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const needsStaff = STAFF_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
  if (needsStaff) {
    const role = (user?.app_metadata?.role as string | undefined) ?? 'customer';
    if (role !== 'admin' && role !== 'staff') {
      return NextResponse.rewrite(new URL(`${prefix}/404`, request.url), { status: 404 });
    }
  }

  return response;
}

export const config = {
  // Skip Next.js internals, API routes, and static files (anything with an extension).
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
