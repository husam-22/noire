import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getCategories, getCollections, getFeaturedProducts, getSpotlightProduct } from '@/lib/services/localized';
import { customerSessionProvider } from '@/lib/account/supabase-customer-session';
import { redirect } from '@/i18n/navigation';
import { hasSupabasePublicConfig } from '@/lib/env';
import { GlobalFooter, GlobalHeader } from '@/components/navigation';
import { Container, Section } from '@/components/layout';
import { SignInForm } from '@/components/auth/sign-in-form';

/** Depends on the auth cookie and `?next=` — never prerender. */
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');
  return { title: `${t('title')} | NOIRÉ`, robots: { index: false, follow: false } };
}

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { next?: string; error?: string };
}) {
  const session = await customerSessionProvider.getSession();
  if (session.status === 'authenticated') {
    redirect({ href: '/account', locale: params.locale });
  }

  const [categories, collections, featuredProducts, spotlightProduct, t] = await Promise.all([
    getCategories(0),
    getCollections(0),
    getFeaturedProducts(4, 0),
    getSpotlightProduct(0),
    getTranslations('auth'),
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
      <main id="main-content" className="pt-20 sm:pt-24">
        <Section spacing="lg">
          <Container size="narrow">
            <div className="mx-auto max-w-md space-y-8">
              <div className="space-y-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground-subtle">
                  {t('eyebrow')}
                </p>
                <h1 className="font-display text-h2 tracking-tight">{t('title')}</h1>
                <p className="text-body text-foreground-muted">{t('description')}</p>
              </div>
              <SignInForm
                next={searchParams.next}
                configured={hasSupabasePublicConfig()}
                callbackError={searchParams.error === 'auth_callback_failed'}
              />
            </div>
          </Container>
        </Section>
      </main>
      <GlobalFooter categories={categories} collections={collections} />
    </div>
  );
}
