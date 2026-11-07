import type { Metadata } from 'next';

import { redirect } from '@/i18n/navigation';
import {
  getCategories,
  getCollections,
  getFeaturedProducts,
  getSpotlightProduct,
} from '@/lib/services/localized';
import type { AuthenticatedCustomerSession } from '@/lib/account/contracts';
import { customerSessionProvider } from '@/lib/account/supabase-customer-session';
import { getOrderReceipt } from '@/lib/services/supabase/commerce';
import { GlobalFooter, GlobalHeader } from '@/components/navigation';
import { QuickViewModal } from '@/components/product';
import { AccountOrderDetail } from '@/components/account';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Order Details | NOIRÉ',
  description: 'Review the items, delivery, and payment status of your NOIRÉ order.',
  robots: {
    index: false,
    follow: false,
  },
};

interface AccountOrderPageProps {
  params: { orderId: string; locale: string };
}

export default async function AccountOrderPage({ params }: AccountOrderPageProps) {
  const resolved = await customerSessionProvider.getSession();
  if (resolved.status !== 'authenticated') {
    redirect({ href: `/auth/sign-in?next=/account/orders/${encodeURIComponent(params.orderId)}`, locale: params.locale });
  }
  const session = resolved as AuthenticatedCustomerSession;

  const [categories, collections, featuredProducts, spotlightProduct, receipt] =
    await Promise.all([
      getCategories(),
      getCollections(),
      getFeaturedProducts(4),
      getSpotlightProduct(),
      getOrderReceipt(params.orderId).catch(() => null),
    ]);

  // Only the owner may open an order from the account area.
  const order = receipt && receipt.customerId === session.customer.id ? receipt : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <GlobalHeader
        categories={categories}
        collections={collections}
        featuredProducts={featuredProducts}
        spotlightProduct={spotlightProduct}
        allowTransparentTop={false}
      />

      <AccountOrderDetail order={order} />

      <GlobalFooter categories={categories} collections={collections} />
      <QuickViewModal />
    </div>
  );
}
