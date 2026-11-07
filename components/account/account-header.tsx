import { Link } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Fingerprint, LogOut, ShieldCheck } from 'lucide-react';
import type { AuthenticatedCustomerSession, CustomerProfileRecord } from '@/lib/account/contracts';
import { formatOrderDate } from '@/lib/account/order-utils';
import { Container } from '@/components/layout';

export function AccountHeader({
  session,
  profile,
}: {
  session: AuthenticatedCustomerSession;
  profile: CustomerProfileRecord;
}) {
  const t = useTranslations('account.header');
  const locale = useLocale();
  const firstName = profile.firstName || session.customer.firstName;
  const heading = firstName ? t('welcomeName', { name: firstName }) : t('welcome');
  const clientCode = profile.clientCode || t('pending');
  const memberSince = profile.memberSince ? formatOrderDate(profile.memberSince, locale) : t('notRecorded');

  return (
    <header className="border-b border-border bg-background">
      <Container size="wide" className="pb-8 pt-24 sm:pb-10 lg:pb-12">
        <nav aria-label={t('home')} className="mb-7">
          <ol className="flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-foreground-subtle">
            <li>
              <Link
                href="/"
                className="inline-flex min-h-11 items-center transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                {t('home')}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground">
              {t('myAccount')}
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 items-end gap-7 lg:grid-cols-12 lg:gap-10">
          <div className="min-w-0 lg:col-span-7">
            <div className="mb-3 flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[0.17em] text-accent">
              <Fingerprint className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('eyebrow')}</span>
            </div>
            <h1 className="max-w-4xl break-words font-display text-4xl leading-[0.98] tracking-[-0.035em] text-foreground sm:text-5xl lg:text-6xl">
              {heading}
            </h1>
            <p className="mt-4 max-w-2xl text-small leading-relaxed text-foreground-muted sm:text-base">
              {t('intro')}
            </p>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:col-span-5 lg:border-s lg:border-t-0 lg:ps-7 lg:pt-0">
            <div className="min-w-0 border border-border bg-surface px-4 py-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-foreground-subtle">
                {t('clientReference')}
              </p>
              <p className="mt-2 break-all font-mono text-sm tabular-nums text-foreground">
                {clientCode}
              </p>
            </div>
            <div className="min-w-0 border border-border bg-surface px-4 py-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-foreground-subtle">
                {t('memberSince')}
              </p>
              <p className="mt-2 break-words font-mono text-sm tabular-nums text-foreground">
                {memberSince}
              </p>
            </div>
            <div className="flex min-h-11 flex-wrap items-center gap-2 border border-border bg-surface px-4 py-3 sm:col-span-2">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
              <span className="min-w-0 break-all font-mono text-[9px] uppercase tracking-[0.12em] text-foreground">
                {t('signedIn', { email: profile.email || session.customer.email })}
              </span>
              <form action="/api/auth/sign-out" method="post" className="ms-auto">
                <button
                  type="submit"
                  className="inline-flex min-h-8 items-center gap-1.5 border border-border px-2.5 font-mono text-[8px] uppercase tracking-[0.12em] text-foreground-muted transition-colors hover:border-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  <LogOut className="h-3 w-3" aria-hidden="true" />
                  {t('signOut')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </Container>
    </header>
  );
}
