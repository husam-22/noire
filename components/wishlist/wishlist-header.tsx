import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, Archive, Layers3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';

interface WishlistHeaderProps {
  savedCount: number;
  activeAllocationCount: number;
  onClearArchive: () => void;
}

export function WishlistHeader({
  savedCount,
  activeAllocationCount,
  onClearArchive,
}: WishlistHeaderProps) {
  const t = useTranslations('wishlist.header');
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto max-w-container px-4 pb-7 pt-24 sm:px-6 sm:pb-9 lg:px-8">
        <nav aria-label={t('home')} className="mb-7">
          <ol className="flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-foreground-subtle">
            <li>
              <Link href="/" className="min-h-8 inline-flex items-center transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
                {t('home')}
              </Link>
            </li>
            <li aria-hidden="true" className="text-border-strong">/</li>
            <li aria-current="page" className="text-foreground">{t('crumb')}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <div className="mb-3 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-accent">
              <Archive className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('eyebrow')}</span>
            </div>
            <h1 className="max-w-3xl font-display text-4xl leading-[0.98] tracking-[-0.035em] text-foreground sm:text-5xl lg:text-6xl">
              {t('title')}
            </h1>
            <p className="mt-4 max-w-xl text-small leading-relaxed text-foreground-muted sm:text-base">
              {t('intro')}
            </p>
          </div>

          <div className="flex flex-col gap-4 border-t border-border pt-4 lg:col-span-5 lg:border-s lg:border-t-0 lg:pb-1 lg:ps-7 lg:pt-0">
            <div className="grid grid-cols-2 gap-3" aria-live="polite" aria-atomic="true">
              <div className="border border-border bg-surface px-3 py-3 sm:px-4">
                <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.11em] text-foreground-subtle">
                  <Archive className="h-3 w-3" aria-hidden="true" /> {t('saved')}
                </div>
                <p className="mt-1.5 font-mono text-2xl tabular-nums text-foreground">{String(savedCount).padStart(2, '0')}</p>
              </div>
              <div className="border border-border bg-surface px-3 py-3 sm:px-4">
                <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.11em] text-foreground-subtle">
                  <Layers3 className="h-3 w-3" aria-hidden="true" /> {t('inBag')}
                </div>
                <p className="mt-1.5 font-mono text-2xl tabular-nums text-foreground">{String(activeAllocationCount).padStart(2, '0')}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/shop"
                className="inline-flex min-h-11 items-center gap-2 border border-transparent px-1 font-mono text-[9px] uppercase tracking-[0.13em] text-foreground transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                {t('continue')} <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden="true" />
              </Link>
              <Button
                type="button"
                variant="outline"
                size="md"
                disabled={savedCount === 0}
                leftIcon={<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
                onClick={onClearArchive}
              >
                {t('clear')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
