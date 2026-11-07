'use server';

import { getLocale } from 'next-intl/server';
import { isAppLocale } from '@/i18n/routing';
import { subscribeToNewsletter } from '@/lib/services/supabase/account';
import { runAction, type ActionResult } from './result';

export async function subscribeNewsletterAction(email: string, source = 'home'): Promise<ActionResult<{ email: string }>> {
  const locale = await getLocale();
  const appLocale = isAppLocale(locale) ? locale : 'en';
  return runAction(async () => {
    await subscribeToNewsletter(email, appLocale, source.slice(0, 40));
    return { email: email.trim().toLowerCase() };
  });
}
