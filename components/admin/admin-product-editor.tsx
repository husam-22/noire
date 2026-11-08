'use client';

import React, { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button, EmptyState, TechnicalCode, useToast } from '@/components/ui';
import { AdminPageHeader } from '@/components/admin/admin-primitives';
import { AdminProductEditorFields } from '@/components/admin/admin-product-editor-fields';
import { saveAdminProduct } from '@/lib/admin/actions';
import type { Category, Product } from '@/types';

function newProductDraft(category?: Category): Product {
  return {
    id: '__new__',
    slug: '',
    sku: '',
    modelNumber: '',
    name: '',
    subtitle: '',
    shortDescription: '',
    editorialDescription: '',
    category: category?.slug ?? 'audio',
    categoryName: category?.name ?? '',
    collectionIds: [],
    price: 0,
    currency: 'USD',
    stockStatus: 'out_of_stock',
    inventoryCount: 0,
    featured: false,
    isSpotlight: false,
    isNewArrival: false,
    releaseYear: 2026,
    designedIn: '',
    primaryImage: '',
    secondaryImage: '',
    gallery: [],
    colors: [],
    options: [],
    materials: [],
    highlights: [],
    specifications: [],
    storyBlocks: [],
    faqs: [],
    shippingEstimate: '',
    warrantyYears: 0,
    relatedProductIds: [],
    status: 'draft',
    createdAt: '',
    updatedAt: '',
  };
}

interface AdminProductEditorProps {
  /** `null` when creating a new product; `undefined` when the id did not resolve. */
  initialProduct: Product | null | undefined;
  categories: Category[];
}

export function AdminProductEditor({ initialProduct, categories }: AdminProductEditorProps) {
  const router = useRouter();
  const t = useTranslations('admin.productEditor');
  const tPrim = useTranslations('admin.primitives');
  const locale = useLocale();
  const { addToast } = useToast();
  const isNewRoute = initialProduct === null;
  const [product, setProduct] = useState<Product | null>(
    initialProduct === null ? newProductDraft(categories[0]) : initialProduct ?? null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const updateProduct = <Key extends keyof Product>(key: Key, value: Product[Key]) => {
    setProduct((current) => current ? { ...current, [key]: value } : current);
    setSaveError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!product) return;
    const normalizedSlug = product.slug.trim().toLowerCase();
    if (!product.name.trim() || !product.sku.trim() || !product.modelNumber.trim() || !normalizedSlug) {
      setSaveError(t('errRequired'));
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) {
      setSaveError(t('errSlug'));
      return;
    }
    if (!Number.isFinite(product.price) || product.price < 0 || !Number.isSafeInteger(product.inventoryCount) || product.inventoryCount < 0) {
      setSaveError(t('errNumbers'));
      return;
    }
    if (product.status === 'active' && product.price <= 0) {
      setSaveError(t('errActivePrice'));
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    const result = await saveAdminProduct({ ...product, slug: normalizedSlug });
    setIsSaving(false);
    if (!result.ok) {
      setSaveError(result.error);
      addToast({ type: 'error', title: t('toastError'), description: result.error });
      return;
    }
    const saved = result.data;
    setProduct(saved);
    addToast({ type: 'success', title: isNewRoute ? t('created') : t('saved'), description: saved.status === 'active' ? t('liveBody', { name: saved.name }) : t('savedBody', { name: saved.name, status: tPrim(`productStatus.${saved.status}`) }) });
    if (isNewRoute) router.replace(`/admin/products/${encodeURIComponent(saved.id)}`);
    router.refresh();
  };

  if (!product) {
    return <><AdminPageHeader eyebrow={t('nfEyebrow')} title={t('nfTitle')} description={t('nfDescription')} /><EmptyState code={t('nfCode')} title={t('nfEmptyTitle')} description={t('nfEmptyDescription')} primaryAction={<Link href="/admin/products" className="inline-flex min-h-11 items-center border border-foreground bg-foreground px-4 font-mono text-[9px] uppercase tracking-[0.12em] text-background">{t('backToProducts')}</Link>} /></>;
  }

  return (
    <main id="main-content" className="min-w-0">
      <AdminPageHeader
        eyebrow={t('eyebrow', { reference: product.id === '__new__' ? t('newProductCode') : product.modelNumber })}
        title={product.id === '__new__' ? t('newProduct') : product.name}
        description={t('description')}
        actions={<Link href="/admin/products" className="inline-flex min-h-11 items-center gap-2 border border-border bg-surface px-4 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground-muted hover:border-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"><ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> {t('allProducts')}</Link>}
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-y border-border py-3 font-mono text-[8px] uppercase tracking-[0.11em] text-foreground-subtle">
        <span>{t('record', { id: product.id === '__new__' ? t('notAssigned') : product.id })}</span>
        <span>{t('modifiedAt', { date: product.updatedAt ? new Date(product.updatedAt).toLocaleString(locale) : t('notSaved') })}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AdminProductEditorFields product={product} categories={categories} onUpdate={updateProduct} />
        {saveError && <p role="alert" className="border border-danger/30 bg-danger-surface px-4 py-3 text-small text-danger">{saveError}</p>}
        <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <span className="hidden items-center gap-2 sm:inline-flex"><TechnicalCode>{product.status === 'active' ? t('live') : t('statusChip', { status: tPrim(`productStatus.${product.status}`) })}</TechnicalCode></span>
          <div className="flex w-full justify-end gap-2 sm:w-auto"><Link href="/admin/products" className="inline-flex min-h-11 items-center border border-border px-4 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground-muted hover:border-foreground">{t('cancel')}</Link><Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save className="h-3.5 w-3.5" aria-hidden="true" />}>{product.id === '__new__' ? t('create') : t('save')}</Button></div>
        </div>
      </form>
    </main>
  );
}
