'use server';

import { headers } from 'next/headers';
import { getLocale } from 'next-intl/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasSupabasePublicConfig, publicEnv } from '@/lib/env';

export interface SignInState {
  status: 'idle' | 'sent' | 'error';
  message?: 'auth_not_configured' | 'invalid_email' | 'send_failed';
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Sends a Supabase magic link. The email template must point at `/api/auth/callback`. */
export async function requestMagicLink(_prev: SignInState, formData: FormData): Promise<SignInState> {
  if (!hasSupabasePublicConfig()) {
    return { status: 'error', message: 'auth_not_configured' };
  }

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const nextRaw = String(formData.get('next') ?? '/account');
  const next = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/account';
  if (!EMAIL_PATTERN.test(email)) {
    return { status: 'error', message: 'invalid_email' };
  }

  const locale = await getLocale();
  const origin = headers().get('origin') ?? publicEnv.siteUrl;
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
      data: { preferred_locale: locale },
    },
  });

  if (error) {
    // Surface the real cause in server logs (Vercel → Logs); the UI only shows a generic message.
    console.error('[auth] signInWithOtp failed', { status: error.status, code: error.code, message: error.message });
    return { status: 'error', message: 'send_failed' };
  }
  return { status: 'sent' };
}
