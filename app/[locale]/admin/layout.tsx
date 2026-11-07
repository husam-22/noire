import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { getAuthContext } from '@/lib/supabase/auth';
import { AdminShell } from '@/components/admin';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'admin.meta' });
  return {
    title: { default: t('title'), template: t('template') },
    robots: { index: false, follow: false },
  };
}

export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: { locale: string } }) {
  // Middleware already enforces staff access; this is defence in depth and provides the user to the shell.
  const auth = await getAuthContext();
  if (!auth) redirect({ href: '/auth/sign-in?next=/admin', locale: params.locale });
  if (auth && auth.role !== 'admin' && auth.role !== 'staff') redirect({ href: '/account', locale: params.locale });

  return <AdminShell user={auth ? { email: auth.email ?? '', role: auth.role } : null}>{children}</AdminShell>;
}
