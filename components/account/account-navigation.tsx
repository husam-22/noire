import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';

export type AccountSectionId =
  | 'overview'
  | 'order-archive'
  | 'delivery-register'
  | 'client-profile'
  | 'private-dispatch';

const SECTION_ITEMS: Array<{ id: AccountSectionId; number: string; labelKey: 'overview' | 'orders' | 'addresses' | 'profile' | 'preferences' }> = [
  { id: 'overview', number: '01', labelKey: 'overview' },
  { id: 'order-archive', number: '02', labelKey: 'orders' },
  { id: 'delivery-register', number: '04', labelKey: 'addresses' },
  { id: 'client-profile', number: '05', labelKey: 'profile' },
  { id: 'private-dispatch', number: '06', labelKey: 'preferences' },
];

export function AccountNavigation({
  activeSection,
}: {
  activeSection: AccountSectionId;
}) {
  const t = useTranslations('account.nav');
  return (
    <nav
      aria-label={t('label')}
      className="w-full min-w-0 border-b border-border bg-background lg:sticky lg:top-24 lg:self-start lg:border-b-0"
    >
      <p className="mb-2 hidden font-mono text-[9px] uppercase tracking-[0.14em] text-foreground-subtle lg:block">
        {t('index')}
      </p>
      <ol className="no-scrollbar flex max-w-full gap-1 overflow-x-auto py-2 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-t lg:border-border lg:py-0">
        {SECTION_ITEMS.slice(0, 2).map((item) => (
          <li key={item.id} className="shrink-0 lg:shrink">
            <SectionLink item={item} active={activeSection === item.id} />
          </li>
        ))}
        <li className="shrink-0 lg:shrink">
          <Link
            href="/wishlist"
            className="group inline-flex min-h-11 items-center gap-2 border border-transparent px-3 font-mono text-[9px] uppercase tracking-[0.1em] text-foreground-muted transition-colors hover:border-border hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground lg:min-h-12 lg:w-full lg:justify-between lg:border-b lg:border-x-0 lg:px-2"
            aria-label={t('openWishlist')}
          >
            <span className="text-foreground-subtle">03</span>
            <span>{t('wishlist')}</span>
            <ArrowUpRight className="h-3 w-3 shrink-0 text-foreground-subtle" aria-hidden="true" />
          </Link>
        </li>
        {SECTION_ITEMS.slice(2).map((item) => (
          <li key={item.id} className="shrink-0 lg:shrink">
            <SectionLink item={item} active={activeSection === item.id} />
          </li>
        ))}
      </ol>
    </nav>
  );
}

function SectionLink({
  item,
  active,
}: {
  item: (typeof SECTION_ITEMS)[number];
  active: boolean;
}) {
  const t = useTranslations('account.nav');
  return (
    <a
      href={`#${item.id}`}
      aria-current={active ? 'location' : undefined}
      className={`group inline-flex min-h-11 items-center gap-2 border px-3 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground lg:min-h-12 lg:w-full lg:justify-between lg:border-x-0 lg:border-t-0 lg:px-2 ${active ? 'border-foreground bg-surface text-foreground lg:bg-transparent' : 'border-transparent text-foreground-muted hover:border-border hover:text-foreground lg:border-b'}`}
    >
      <span className={active ? 'text-accent' : 'text-foreground-subtle'}>
        {item.number}
      </span>
      <span className="whitespace-nowrap">{t(item.labelKey)}</span>
      <span
        aria-hidden="true"
        className={`hidden h-1.5 w-1.5 rounded-full bg-accent lg:block ${active ? 'opacity-100' : 'opacity-0'}`}
      />
    </a>
  );
}
