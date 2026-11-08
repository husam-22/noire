import React from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import {
  getCategories,
  getCollections,
  getFeaturedProducts,
  getSpotlightProduct,
  getOrderReceipt,
} from '@/lib/services/localized';
import { GlobalHeader, GlobalFooter } from '@/components/navigation';
import { QuickViewModal } from '@/components/product';
import { OrderConfirmationExperience } from '@/components/checkout';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'pages.orderConfirmation' });
  return {
    title: t('title'),
    description: t('description'),
    robots: { index: false, follow: false },
  };
}

interface OrderConfirmationPageProps {
  params: { orderId: string };
}

export default async function NoireOrderConfirmationPage({
  params,
}: OrderConfirmationPageProps) {
  const [categories, collections, featuredProducts, spotlightProduct, order] =
    await Promise.all([
      getCategories(),
      getCollections(),
      getFeaturedProducts(4),
      getSpotlightProduct(),
      getOrderReceipt(params.orderId).catch(() => null),
    ]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <GlobalHeader
        categories={categories}
        collections={collections}
        featuredProducts={featuredProducts}
        spotlightProduct={spotlightProduct}
        allowTransparentTop={false}
      />
      <OrderConfirmationExperience order={order} />
      <GlobalFooter categories={categories} collections={collections} />
      <QuickViewModal />
    </div>
  );
}
