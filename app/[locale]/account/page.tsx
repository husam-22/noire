import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { redirect } from '@/i18n/navigation';
import {
  getCategories,
  getCollections,
  getFeaturedProducts,
  getProducts,
  getSpotlightProduct,
} from '@/lib/services/localized';
import { customerSessionProvider } from '@/lib/account/supabase-customer-session';
import { supabaseCustomerAccountProvider } from '@/lib/services/supabase/account';
import type { AuthenticatedCustomerSession, CustomerAccountSnapshot } from '@/lib/account/contracts';
import { GlobalFooter, GlobalHeader } from '@/components/navigation';
import { QuickViewModal } from '@/components/product';
import { AccountExperience } from '@/components/account';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'pages.account' });
  return {
    title: t('title'),
    description: t('description'),
    robots: { index: false, follow: false },
  };
}

export default async function NoireAccountPage({ params }: { params: { locale: string } }) {
  const resolved = await customerSessionProvider.getSession();
  if (resolved.status !== 'authenticated') {
    redirect({ href: '/auth/sign-in?next=/account', locale: params.locale });
  }
  const session = resolved as AuthenticatedCustomerSession;

  const [categories, collections, featuredProducts, spotlightProduct, catalog, profile, orders, addresses, preferences] =
    await Promise.all([
      getCategories(),
      getCollections(),
      getFeaturedProducts(4),
      getSpotlightProduct(),
      getProducts({ limit: 50, sort: 'featured' }),
      supabaseCustomerAccountProvider.getCustomerProfile(session),
      supabaseCustomerAccountProvider.getCustomerOrders(session),
      supabaseCustomerAccountProvider.getCustomerAddresses(session),
      supabaseCustomerAccountProvider.getCustomerPreferences(session),
    ]);

  const snapshot: CustomerAccountSnapshot = { profile, orders, addresses, preferences };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <GlobalHeader
        categories={categories}
        collections={collections}
        featuredProducts={featuredProducts}
        spotlightProduct={spotlightProduct}
        allowTransparentTop={false}
      />

      <AccountExperience session={session} snapshot={snapshot} allProducts={catalog.items} />

      <GlobalFooter categories={categories} collections={collections} />
      <QuickViewModal />
    </div>
  );
}
