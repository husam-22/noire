'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useStorefrontContent } from '@/lib/context/storefront-content-context';

/**
 * Slim strip pinned above the global header. Height is published through the
 * `--announcement-h` CSS variable set on <html> by the locale layout so the
 * fixed header and page offsets shift together.
 */
export function AnnouncementBar() {
  const { announcement } = useStorefrontContent();
  const t = useTranslations('common');
  if (!announcement) return null;
  return (
    <div
      role="region"
      aria-label={t('announcement')}
      className="fixed inset-x-0 top-0 z-[45] flex h-8 items-center justify-center border-b border-border-inverse bg-surface-inverse px-4 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-inverse"
    >
      <p className="truncate">{announcement}</p>
    </div>
  );
}
