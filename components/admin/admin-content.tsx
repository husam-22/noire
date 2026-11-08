'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BookOpen, Check, Image as ImageIcon, Megaphone, RotateCcw, Sparkles } from 'lucide-react';
import { Badge, Button, Checkbox, TechnicalCode, Textarea, useToast } from '@/components/ui';
import { AdminPageHeader, AdminSurface } from '@/components/admin/admin-primitives';
import { saveAdminContent, saveAdminJournalArticle } from '@/lib/admin/actions';
import type { Collection, JournalArticle, Product } from '@/types';

export interface AdminContentState {
  announcement: string;
  featuredCollectionId: string | null;
  featuredProductIds: string[];
  featuredArticleIds: string[];
}

interface AdminContentWorkspaceProps {
  collections: Collection[];
  products: Product[];
  articles: JournalArticle[];
  initial: AdminContentState;
}

const MAX_FEATURED_PRODUCTS = 8;

function sameSet(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

export function AdminContentWorkspace({ collections, products, articles, initial }: AdminContentWorkspaceProps) {
  const router = useRouter();
  const t = useTranslations('admin.content');
  const tPrim = useTranslations('admin.primitives');
  const { addToast } = useToast();
  const [draft, setDraft] = useState<AdminContentState>(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isDirty = useMemo(
    () => draft.announcement !== initial.announcement
      || draft.featuredCollectionId !== initial.featuredCollectionId
      || !sameSet(draft.featuredProductIds, initial.featuredProductIds)
      || !sameSet(draft.featuredArticleIds, initial.featuredArticleIds),
    [draft, initial]
  );

  const toggleId = (key: 'featuredProductIds' | 'featuredArticleIds', id: string, checked: boolean) => {
    setDraft((current) => ({ ...current, [key]: checked ? Array.from(new Set([...current[key], id])) : current[key].filter((candidate) => candidate !== id) }));
  };

  const publish = async () => {
    setSaveError(null);
    if (draft.featuredProductIds.length > MAX_FEATURED_PRODUCTS) {
      setSaveError(t('errMax', { max: MAX_FEATURED_PRODUCTS }));
      return;
    }
    setIsSaving(true);
    const contentResult = await saveAdminContent({
      announcement: draft.announcement.trim(),
      featuredCollectionId: draft.featuredCollectionId,
      featuredProductIds: draft.featuredProductIds,
    });
    if (!contentResult.ok) {
      setIsSaving(false);
      setSaveError(contentResult.error);
      addToast({ type: 'error', title: t('toastError'), description: contentResult.error });
      return;
    }
    const featured = new Set(draft.featuredArticleIds);
    const articleResults = await Promise.all(
      articles
        .filter((article) => article.featured !== featured.has(article.id))
        .map((article) => saveAdminJournalArticle({ ...article, featured: featured.has(article.id) }))
    );
    setIsSaving(false);
    const failed = articleResults.find((result) => !result.ok);
    if (failed && !failed.ok) {
      setSaveError(failed.error);
      addToast({ type: 'error', title: t('toastJournalError'), description: failed.error });
      return;
    }
    addToast({ type: 'success', title: t('toastPublished'), description: t('toastPublishedBody') });
    router.refresh();
  };

  const reset = () => { setDraft(initial); setSaveError(null); };

  return (
    <main id="main-content" className="min-w-0">
      <AdminPageHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        actions={<><Button type="button" variant="ghost" size="sm" leftIcon={<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />} disabled={!isDirty || isSaving} onClick={reset}>{t('discard')}</Button><Button type="button" variant="primary" size="md" leftIcon={<Check className="h-3.5 w-3.5" aria-hidden="true" />} disabled={!isDirty} isLoading={isSaving} onClick={() => void publish()}>{t('publish')}</Button></>}
      />
      {saveError && <p role="alert" className="mb-4 border border-danger/30 bg-danger-surface px-3 py-2 text-small text-danger">{saveError}</p>}

      <div className="space-y-4">
        <AdminSurface className="p-4 sm:p-5">
          <SectionHeading icon={<Sparkles className="h-4 w-4" aria-hidden="true" />} code={t('collectionCode')} title={t('collectionTitle')} description={t('collectionDescription')} />
          <fieldset className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <legend className="sr-only">{t('collectionLegend')}</legend>
            {collections.map((collection) => (
              <label key={collection.id} className="flex min-h-14 cursor-pointer items-start gap-3 border border-border bg-background p-3 hover:bg-surface-muted/40">
                <input type="radio" name="featured-collection" value={collection.id} checked={draft.featuredCollectionId === collection.id} onChange={() => setDraft((current) => ({ ...current, featuredCollectionId: collection.id }))} className="mt-1 h-4 w-4 accent-foreground focus-visible:ring-2 focus-visible:ring-foreground" />
                <span className="min-w-0"><span className="block break-words text-small text-foreground">{collection.title}</span><span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">{collection.code} · {t('productsCount', { count: collection.productIds.length })}</span></span>
              </label>
            ))}
          </fieldset>
          {collections.length === 0 && <p className="mt-3 text-small text-foreground-muted">{t('noCollections')}</p>}
        </AdminSurface>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <AdminSurface className="p-4 sm:p-5">
            <SectionHeading icon={<ImageIcon className="h-4 w-4" aria-hidden="true" />} code={t('productsCode')} title={t('productsTitle')} description={t('productsDescription', { max: MAX_FEATURED_PRODUCTS })} />
            <div className="mt-4 max-h-[420px] divide-y divide-border overflow-y-auto border-y border-border">
              {products.map((product) => <Checkbox key={product.id} className="min-h-14 items-center px-2 py-3" checked={draft.featuredProductIds.includes(product.id)} onChange={(checked) => toggleId('featuredProductIds', product.id, checked)} label={<span className="min-w-0"><span className="block break-words text-[11px] text-foreground">{product.name}</span><span className="mt-1 block font-mono text-[8px] uppercase text-foreground-subtle">{product.modelNumber} · {tPrim(`productStatus.${product.status}`)}</span></span>} />)}
              {products.length === 0 && <p className="px-3 py-4 text-small text-foreground-muted">{t('noProducts')}</p>}
            </div>
            <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">{t('selected', { count: draft.featuredProductIds.length, max: MAX_FEATURED_PRODUCTS })}</p>
          </AdminSurface>

          <AdminSurface className="p-4 sm:p-5">
            <SectionHeading icon={<BookOpen className="h-4 w-4" aria-hidden="true" />} code={t('journalCode')} title={t('journalTitle')} description={t('journalDescription')} />
            <div className="mt-4 divide-y divide-border border-y border-border">
              {articles.map((article) => <Checkbox key={article.id} className="min-h-14 items-center px-2 py-3" checked={draft.featuredArticleIds.includes(article.id)} onChange={(checked) => toggleId('featuredArticleIds', article.id, checked)} label={<span className="min-w-0"><span className="block break-words text-[11px] text-foreground">{article.title}</span><span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">{article.issueNumber} · {article.category}</span></span>} />)}
              {articles.length === 0 && <p className="px-3 py-4 text-small text-foreground-muted">{t('noArticles')}</p>}
            </div>
          </AdminSurface>
        </div>

        <AdminSurface className="p-4 sm:p-5">
          <SectionHeading icon={<Megaphone className="h-4 w-4" aria-hidden="true" />} code={t('announcementCode')} title={t('announcementTitle')} description={t('announcementDescription')} />
          <div className="mt-4"><Textarea label={t('announcement')} value={draft.announcement} onChange={(event) => setDraft((current) => ({ ...current, announcement: event.target.value.slice(0, 200) }))} rows={3} placeholder={t('announcementPlaceholder')} hint={t('characters', { count: draft.announcement.length, max: 200 })} /></div>
          <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">{initial.announcement ? <Badge variant="success">{t('live')}</Badge> : <Badge variant="outline">{t('hidden')}</Badge>}<span className="text-[10px] text-foreground-subtle">{initial.announcement ? t('currentlyShowing', { text: initial.announcement }) : t('noAnnouncement')}</span></div>
        </AdminSurface>
      </div>

      <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-border pt-4"><Button type="button" variant="ghost" leftIcon={<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />} disabled={!isDirty || isSaving} onClick={reset}>{t('discard')}</Button><Button type="button" variant="primary" disabled={!isDirty} isLoading={isSaving} onClick={() => void publish()}>{t('publish')}</Button></div>
    </main>
  );
}

function SectionHeading({ icon, code, title, description }: { icon: React.ReactNode; code: string; title: string; description: string }) {
  return <div className="flex items-start gap-3 border-b border-border pb-4"><span className="mt-0.5 text-accent">{icon}</span><div><TechnicalCode>{code}</TechnicalCode><h2 className="mt-1 font-display text-lg text-foreground">{title}</h2><p className="mt-1 text-[10px] leading-relaxed text-foreground-muted">{description}</p></div></div>;
}
