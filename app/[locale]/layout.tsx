import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import '../globals.css';
import { fontClassNames } from '../fonts';
import { routing, getDirection } from '@/i18n/routing';
import { NoireProviders } from '@/components/layout/providers';
import { getShippingMethods, getStorefrontContent } from '@/lib/services/localized';
import { AnnouncementBar } from '@/components/layout/announcement-bar';
import { DEFAULT_STOREFRONT_CONTENT } from '@/lib/context/storefront-content-context';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = hasLocale(routing.locales, params.locale)
    ? params.locale
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: {
      default: t('title'),
      template: t('titleTemplate'),
    },
    description: t('description'),
    keywords: t('keywords').split(',').map((keyword) => keyword.trim()),
    openGraph: {
      title: t('title'),
      description: t('ogDescription'),
      siteName: 'NOIRÉ',
      locale: locale === 'ar' ? 'ar_AR' : 'en_US',
      type: 'website',
    },
  };
}

/** Storefront pages are statically rendered and refreshed at least every 60 s (admin saves revalidate immediately). */
export const revalidate = 60;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  // Enables static rendering for every route beneath this layout.
  setRequestLocale(locale);

  const dir = getDirection(locale);
  const [shippingMethods, storefrontContent] = await Promise.all([
    getShippingMethods().catch(() => []),
    getStorefrontContent().catch(() => DEFAULT_STOREFRONT_CONTENT),
  ]);
  const announcementHeight = storefrontContent.announcement ? '2rem' : '0px';

  return (
    <html
      lang={locale}
      dir={dir}
      className={fontClassNames}
      style={{ '--announcement-h': announcementHeight } as React.CSSProperties}
    >
      <body
        className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-foreground selection:text-background"
        style={{ paddingTop: 'var(--announcement-h)' }}
      >
        <NextIntlClientProvider>
          <NoireProviders shippingMethods={shippingMethods} storefrontContent={storefrontContent}>
            <AnnouncementBar />
            {children}
          </NoireProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
