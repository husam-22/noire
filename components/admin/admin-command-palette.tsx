'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, Search } from 'lucide-react';
import { Modal, Input, Badge, Skeleton, ErrorState, EmptyState } from '@/components/ui';
import { searchAdminRecords } from '@/lib/admin/actions';
import type { AdminSearchHit } from '@/lib/services/supabase/admin';

const SEARCH_DEBOUNCE_MS = 220;

export function AdminCommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const t = useTranslations('admin.palette');
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<AdminSearchHit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef(0);

  const trimmedQuery = useMemo(() => query.trim(), [query]);

  const runSearch = useCallback(async (value: string) => {
    const requestId = ++requestRef.current;
    if (value.length < 2) {
      setHits([]);
      setIsLoading(false);
      setLoadError(null);
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    const result = await searchAdminRecords(value);
    if (requestId !== requestRef.current) return;
    setIsLoading(false);
    if (!result.ok) {
      setLoadError(result.error);
      setHits([]);
      return;
    }
    setHits(result.data);
    setActiveIndex(0);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setHits([]);
      setActiveIndex(0);
      setLoadError(null);
      return;
    }
    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus({ preventScroll: true });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => { void runSearch(trimmedQuery); }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [isOpen, runSearch, trimmedQuery]);

  const openHit = useCallback((hit: AdminSearchHit) => {
    onClose();
    router.push(hit.href);
  }, [onClose, router]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && hits.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % hits.length);
    } else if (event.key === 'ArrowUp' && hits.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? hits.length - 1 : index - 1));
    } else if (event.key === 'Enter' && hits[activeIndex]) {
      event.preventDefault();
      openHit(hits[activeIndex]);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('title')}
      code="⌘K / CTRL+K"
      size="lg"
      className="max-h-[88vh]"
    >
      <div className="space-y-4">
        <Input
          ref={searchInputRef}
          type="search"
          label={t('label')}
          placeholder={t('placeholder')}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          leftElement={<Search className="h-4 w-4" aria-hidden="true" />}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={trimmedQuery.length > 0}
          aria-controls="admin-command-results"
          aria-activedescendant={hits[activeIndex] ? `command-result-${activeIndex}` : undefined}
          autoComplete="off"
        />

        {isLoading && (
          <div role="status" aria-live="polite" className="space-y-3 border-y border-border py-4">
            <span className="sr-only">{t('searching')}</span>
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        )}
        {!isLoading && loadError && (
          <ErrorState
            code={t('errorCode')}
            title={t('errorTitle')}
            description={loadError}
            onRetry={() => void runSearch(trimmedQuery)}
            retryLabel={t('retry')}
            className="p-4 sm:p-5"
          />
        )}
        {!isLoading && !loadError && trimmedQuery.length < 2 && (
          <div className="border-y border-border py-8 text-center">
            <p className="font-display text-lg text-foreground">{t('introTitle')}</p>
            <p className="mt-2 text-small text-foreground-muted">{t('introBody')}</p>
            <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground-subtle">{t('hint')}</p>
          </div>
        )}
        {!isLoading && !loadError && trimmedQuery.length >= 2 && hits.length === 0 && (
          <EmptyState
            code={t('emptyCode')}
            title={t('emptyTitle')}
            description={t('emptyDescription')}
            className="p-5"
          />
        )}
        {!isLoading && !loadError && hits.length > 0 && (
          <div id="admin-command-results" role="listbox" aria-label={t('resultsAria')} className="max-h-[45vh] overflow-y-auto border-y border-border">
            {hits.map((hit, index) => (
              <button
                key={hit.id}
                id={`command-result-${index}`}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => openHit(hit)}
                className={`flex min-h-14 w-full items-center justify-between gap-3 border-b border-border px-3 py-3 text-start last:border-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-foreground ${index === activeIndex ? 'bg-surface-muted' : 'bg-background hover:bg-surface-muted/60'}`}
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="break-words font-display text-sm text-foreground">{hit.label}</span>
                    <Badge variant="outline">{t(`kind.${hit.kind}`)}</Badge>
                  </span>
                  <span className="mt-1 block break-words text-[10px] text-foreground-muted">{hit.detail}</span>
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-foreground-subtle" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
