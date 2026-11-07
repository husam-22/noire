'use client';

import React from 'react';
import { Link } from '@/i18n/navigation';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button, Checkbox, Input, Select, TechnicalCode, Textarea } from '@/components/ui';
import type {
  Category,
  Product,
  ProductColorVariant,
  ProductFAQ,
  ProductOptionVariant,
  ProductSpecification,
  ProductStoryBlock,
  StockStatus,
} from '@/types';

type UpdateProduct = <Key extends keyof Product>(key: Key, value: Product[Key]) => void;

const STOCK_OPTIONS: StockStatus[] = ['in_stock', 'low_stock', 'pre_order', 'out_of_stock'];
const SPECIFICATION_GROUPS: ProductSpecification['group'][] = [
  'Acoustics & Electronics', 'Architecture & Materials', 'Dimensions & Weight', 'Connectivity & Power', 'In The Box',
];
const STORY_LAYOUTS: ProductStoryBlock['layout'][] = ['split-left', 'split-right', 'full-bleed', 'technical-grid'];

export function AdminProductEditorFields({
  product,
  categories,
  onUpdate,
}: {
  product: Product;
  categories: Category[];
  onUpdate: UpdateProduct;
}) {
  const updateColor = (index: number, next: ProductColorVariant) => {
    onUpdate('colors', product.colors.map((color, current) => current === index ? next : color));
  };
  const updateOption = (index: number, next: ProductOptionVariant) => {
    const options = product.options ?? [];
    onUpdate('options', options.map((option, current) => current === index ? next : option));
  };
  const updateGallery = (index: number, next: Product['gallery'][number]) => {
    onUpdate('gallery', product.gallery.map((image, current) => current === index ? next : image));
  };
  const updateStory = (index: number, next: ProductStoryBlock) => {
    onUpdate('storyBlocks', product.storyBlocks.map((block, current) => current === index ? next : block));
  };
  const updateSpecification = (index: number, next: ProductSpecification) => {
    onUpdate('specifications', product.specifications.map((specification, current) => current === index ? next : specification));
  };
  const updateFaq = (index: number, next: ProductFAQ) => {
    onUpdate('faqs', product.faqs.map((faq, current) => current === index ? next : faq));
  };

  return (
    <div className="space-y-4">
      <EditorSection code="01 // IDENTITY" title="Product identity" description="The existing Product model powers catalog, product detail, and checkout references.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="Product name" value={product.name} onChange={(event) => onUpdate('name', event.target.value)} required />
          <Input label="URL slug" value={product.slug} onChange={(event) => onUpdate('slug', event.target.value.toLowerCase().replace(/\s+/g, '-'))} hint="Lowercase words separated by hyphens." required />
          <Input label="SKU / technical identifier" value={product.sku} onChange={(event) => onUpdate('sku', event.target.value)} required />
          <Input label="Model number" value={product.modelNumber} onChange={(event) => onUpdate('modelNumber', event.target.value)} required />
          <Select label="Category" value={product.category} onChange={(event) => {
            const selected = categories.find((category) => category.slug === event.target.value);
            if (selected) {
              onUpdate('category', selected.slug);
              onUpdate('categoryName', selected.name);
            }
          }} options={categories.map((category) => ({ label: category.name, value: category.slug }))} />
          <Input label="Subtitle" value={product.subtitle} onChange={(event) => onUpdate('subtitle', event.target.value)} />
          <div className="md:col-span-2"><Textarea label="Short description" value={product.shortDescription} onChange={(event) => onUpdate('shortDescription', event.target.value)} rows={3} /></div>
        </div>
      </EditorSection>

      <EditorSection code="02 // PRICING" title="Price & currency" description="USD is the current currency represented by the shared commerce model.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Base price (USD)" type="number" min="0" step="0.01" value={product.price} onChange={(event) => onUpdate('price', Number(event.target.value))} required />
          <Input label="Compare-at price (USD)" type="number" min="0" step="0.01" value={product.compareAtPrice ?? ''} onChange={(event) => onUpdate('compareAtPrice', event.target.value === '' ? undefined : Number(event.target.value))} />
          <div className="flex min-h-11 items-end border-b border-border pb-3"><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-muted">Currency // USD</span></div>
        </div>
      </EditorSection>

      <EditorSection code="03 // AVAILABILITY" title="Catalog state & availability" description="Stock count is the existing catalog quantity. Reserved or available-to-promise inventory is not modeled.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Select label="Product status" value={product.status} disabled={product.status === 'archived'} hint={product.status === 'archived' ? 'Use the confirmed Restore action in Product command.' : 'Archiving requires the confirmation flow in Product command.'} onChange={(event) => {
            if (event.target.value === 'active' || event.target.value === 'draft') onUpdate('status', event.target.value);
          }} options={product.status === 'archived' ? [{ label: 'Archived', value: 'archived' }] : [{ label: 'Active', value: 'active' }, { label: 'Draft', value: 'draft' }]} />
          <Select label="Stock state" value={product.stockStatus} disabled hint="Change stock state through the confirmed Inventory control." options={STOCK_OPTIONS.map((value) => ({ label: value.replace('_', ' '), value }))} />
          <Input label="Catalog quantity" type="number" value={product.inventoryCount} disabled hint="Quantity edits require the Inventory confirmation dialog." />
          <Input label="Release year" type="number" min="2000" max="2100" step="1" value={product.releaseYear} onChange={(event) => onUpdate('releaseYear', Number(event.target.value))} />
        </div>
        <Link href="/admin/inventory" className="mt-3 inline-flex min-h-11 items-center border-b border-border px-1 font-mono text-[9px] uppercase tracking-[0.1em] text-foreground-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">Open inventory control for confirmed stock edits</Link>
        <div className="mt-4 max-w-sm"><Checkbox checked={product.featured} onChange={(checked) => onUpdate('featured', checked)} label="Featured" description="Featured products appear first in the shop and on the home page." /></div>
      </EditorSection>

      <EditorSection code="04 // FINISHES & CONFIGURATION" title="Finishes & configuration" description="Variant identifiers and option pricing use the existing ProductColorVariant and ProductOptionVariant contracts.">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><TechnicalCode>Finishes // {String(product.colors.length).padStart(2, '0')}</TechnicalCode><Button type="button" variant="outline" size="sm" leftIcon={<Plus className="h-3 w-3" aria-hidden="true" />} onClick={() => onUpdate('colors', [...product.colors, { id: `finish-${Date.now()}`, name: '', hex: '#111110', finish: '', image: '', inStock: true, skuSuffix: 'STD' }])}>Add finish</Button></div>
          {product.colors.length === 0 && <p className="border border-dashed border-border px-3 py-4 text-small text-foreground-subtle">No finishes defined.</p>}
          {product.colors.map((color, index) => (
            <fieldset key={color.id} className="grid grid-cols-1 gap-3 border border-border p-3 sm:grid-cols-2 xl:grid-cols-4">
              <legend className="px-1 font-mono text-[8px] uppercase tracking-[0.12em] text-foreground-subtle">Finish {String(index + 1).padStart(2, '0')}</legend>
              <Input label="Finish name" value={color.name} onChange={(event) => updateColor(index, { ...color, name: event.target.value })} />
              <Input label="Hex / swatch value" value={color.hex} onChange={(event) => updateColor(index, { ...color, hex: event.target.value })} />
              <Input label="SKU suffix" value={color.skuSuffix} onChange={(event) => updateColor(index, { ...color, skuSuffix: event.target.value })} />
              <Input label="Finish material" value={color.finish} onChange={(event) => updateColor(index, { ...color, finish: event.target.value })} />
              <div className="sm:col-span-2"><Input label="Finish image URL" value={color.image} onChange={(event) => updateColor(index, { ...color, image: event.target.value })} /></div>
              <div className="flex items-center justify-between gap-3 sm:col-span-2"><Checkbox checked={color.inStock} onChange={(checked) => updateColor(index, { ...color, inStock: checked })} label="Variant available" /><Button type="button" variant="ghost" size="sm" aria-label={`Remove finish ${color.name || index + 1}`} leftIcon={<Trash2 className="h-3 w-3" aria-hidden="true" />} onClick={() => onUpdate('colors', product.colors.filter((_, current) => current !== index))}>Remove</Button></div>
            </fieldset>
          ))}
        </div>

        <div className="mt-7 space-y-4 border-t border-border pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><TechnicalCode>Options // {String(product.options?.length ?? 0).padStart(2, '0')}</TechnicalCode><Button type="button" variant="outline" size="sm" leftIcon={<Plus className="h-3 w-3" aria-hidden="true" />} onClick={() => onUpdate('options', [...(product.options ?? []), { id: `option-${Date.now()}`, label: '', value: '', priceDelta: 0, inStock: true }])}>Add option</Button></div>
          <Input label="Option group label" value={product.optionGroupLabel ?? ''} onChange={(event) => onUpdate('optionGroupLabel', event.target.value || undefined)} />
          {(product.options ?? []).map((option, index) => (
            <fieldset key={option.id} className="grid grid-cols-1 gap-3 border border-border p-3 sm:grid-cols-2 xl:grid-cols-4">
              <legend className="px-1 font-mono text-[8px] uppercase tracking-[0.12em] text-foreground-subtle">Option {String(index + 1).padStart(2, '0')}</legend>
              <Input label="Option label" value={option.label} onChange={(event) => updateOption(index, { ...option, label: event.target.value })} />
              <Input label="Internal value" value={option.value} onChange={(event) => updateOption(index, { ...option, value: event.target.value })} />
              <Input label="Price delta (USD)" type="number" step="0.01" value={option.priceDelta} onChange={(event) => updateOption(index, { ...option, priceDelta: Number(event.target.value) })} />
              <div className="flex items-center justify-between gap-3"><Checkbox checked={option.inStock} onChange={(checked) => updateOption(index, { ...option, inStock: checked })} label="Option available" /><Button type="button" variant="ghost" size="sm" aria-label={`Remove option ${option.label || index + 1}`} onClick={() => onUpdate('options', (product.options ?? []).filter((_, current) => current !== index))}>Remove</Button></div>
            </fieldset>
          ))}
          {(product.options ?? []).length === 0 && <p className="text-small text-foreground-subtle">No configuration options defined.</p>}
        </div>
      </EditorSection>

      <EditorSection code="05 // MEDIA REGISTER" title="Media & image order" description="Gallery entries are held in the existing Product.gallery array. Reorder entries or assign a primary image explicitly.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Input label="Primary image URL" value={product.primaryImage} onChange={(event) => onUpdate('primaryImage', event.target.value)} /><Input label="Secondary image URL" value={product.secondaryImage} onChange={(event) => onUpdate('secondaryImage', event.target.value)} /></div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2"><TechnicalCode>Gallery // ordered entries</TechnicalCode><Button type="button" variant="outline" size="sm" leftIcon={<Plus className="h-3 w-3" aria-hidden="true" />} onClick={() => onUpdate('gallery', [...product.gallery, { id: `gallery-${Date.now()}`, url: '', alt: '', caption: '' }])}>Add image</Button></div>
        <ol className="mt-3 space-y-2">
          {product.gallery.map((image, index) => (
            <li key={image.id} className="grid grid-cols-1 gap-3 border border-border p-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <Input label={`Image ${index + 1} URL`} value={image.url} onChange={(event) => updateGallery(index, { ...image, url: event.target.value })} />
              <Input label="Alt text" value={image.alt} onChange={(event) => updateGallery(index, { ...image, alt: event.target.value })} />
              <div className="flex flex-wrap items-end gap-2 xl:col-span-2"><Input label="Caption" value={image.caption ?? ''} onChange={(event) => updateGallery(index, { ...image, caption: event.target.value || undefined })} /><Button type="button" variant="ghost" size="sm" onClick={() => onUpdate('primaryImage', image.url)}>Use as primary</Button></div>
              <div className="flex items-center justify-end gap-1"><Button type="button" variant="ghost" size="icon" aria-label={`Move image ${index + 1} up`} disabled={index === 0} onClick={() => moveItem(product.gallery, index, index - 1, (next) => onUpdate('gallery', next))}><ArrowUp className="h-3.5 w-3.5" aria-hidden="true" /></Button><Button type="button" variant="ghost" size="icon" aria-label={`Move image ${index + 1} down`} disabled={index === product.gallery.length - 1} onClick={() => moveItem(product.gallery, index, index + 1, (next) => onUpdate('gallery', next))}><ArrowDown className="h-3.5 w-3.5" aria-hidden="true" /></Button><Button type="button" variant="ghost" size="icon" aria-label={`Remove image ${index + 1}`} onClick={() => onUpdate('gallery', product.gallery.filter((_, current) => current !== index))}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></Button></div>
            </li>
          ))}
          {product.gallery.length === 0 && <li className="border border-dashed border-border px-3 py-4 text-small text-foreground-subtle">No gallery images defined.</li>}
        </ol>
      </EditorSection>

      <EditorSection code="06 // EDITORIAL & TECHNICAL" title="Story & dossier" description="Structured fields match the existing story, materials, specification, and FAQ contracts.">
        <Textarea label="Long-form editorial description" value={product.editorialDescription} onChange={(event) => onUpdate('editorialDescription', event.target.value)} rows={6} />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"><Textarea label="Materials · one per line" value={product.materials.join('\n')} onChange={(event) => onUpdate('materials', parseLines(event.target.value))} rows={5} /><Textarea label="Highlights · one per line" value={product.highlights.join('\n')} onChange={(event) => onUpdate('highlights', parseLines(event.target.value))} rows={5} /></div>
        <div className="mt-6 border-t border-border pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><TechnicalCode>Technical specifications // {product.specifications.length}</TechnicalCode><Button type="button" variant="outline" size="sm" leftIcon={<Plus className="h-3 w-3" aria-hidden="true" />} onClick={() => onUpdate('specifications', [...product.specifications, { group: SPECIFICATION_GROUPS[0], label: '', value: '' }])}>Add specification</Button></div>
          <div className="mt-3 space-y-2">
            {product.specifications.map((specification, index) => (
              <div key={`${specification.group}-${index}`} className="grid grid-cols-1 gap-2 border border-border p-3 sm:grid-cols-[1.2fr_1fr_1.4fr_auto] sm:items-end">
                <Select label="Dossier group" value={specification.group} onChange={(event) => { const group = SPECIFICATION_GROUPS.find((value) => value === event.target.value); if (group) updateSpecification(index, { ...specification, group }); }} options={SPECIFICATION_GROUPS.map((value) => ({ label: value, value }))} />
                <Input label="Specification" value={specification.label} onChange={(event) => updateSpecification(index, { ...specification, label: event.target.value })} />
                <Input label="Recorded value" value={specification.value} onChange={(event) => updateSpecification(index, { ...specification, value: event.target.value })} />
                <Button type="button" variant="ghost" size="icon" aria-label={`Remove specification ${specification.label || index + 1}`} onClick={() => onUpdate('specifications', product.specifications.filter((_, current) => current !== index))}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></Button>
              </div>
            ))}
            {product.specifications.length === 0 && <p className="border border-dashed border-border px-3 py-4 text-small text-foreground-subtle">No technical specifications defined.</p>}
          </div>
        </div>
        <div className="mt-6 border-t border-border pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><TechnicalCode>Story blocks // {product.storyBlocks.length}</TechnicalCode><Button type="button" variant="outline" size="sm" leftIcon={<Plus className="h-3 w-3" aria-hidden="true" />} onClick={() => onUpdate('storyBlocks', [...product.storyBlocks, { id: `story-${Date.now()}`, eyebrow: '', title: '', description: '', image: '', imageAlt: '', layout: 'split-left' }])}>Add story block</Button></div>
          <div className="mt-3 space-y-3">
            {product.storyBlocks.map((block, index) => (
              <fieldset key={block.id} className="grid grid-cols-1 gap-3 border border-border p-3 sm:grid-cols-2">
                <legend className="px-1 font-mono text-[8px] uppercase tracking-[0.12em] text-foreground-subtle">Story block {String(index + 1).padStart(2, '0')}</legend>
                <Input label="Eyebrow / index" value={block.eyebrow} onChange={(event) => updateStory(index, { ...block, eyebrow: event.target.value })} />
                <Input label="Title" value={block.title} onChange={(event) => updateStory(index, { ...block, title: event.target.value })} />
                <Select label="Layout" value={block.layout} onChange={(event) => { const layout = STORY_LAYOUTS.find((value) => value === event.target.value); if (layout) updateStory(index, { ...block, layout }); }} options={STORY_LAYOUTS.map((value) => ({ label: value.replace('-', ' '), value }))} />
                <Input label="Image URL" value={block.image} onChange={(event) => updateStory(index, { ...block, image: event.target.value })} />
                <Input label="Image alt text" value={block.imageAlt} onChange={(event) => updateStory(index, { ...block, imageAlt: event.target.value })} />
                <div className="sm:col-span-2"><Textarea label="Story copy" value={block.description} onChange={(event) => updateStory(index, { ...block, description: event.target.value })} rows={3} /></div>
                <div className="flex items-end justify-between gap-3 sm:col-span-2"><Input label="Caption" value={block.caption ?? ''} onChange={(event) => updateStory(index, { ...block, caption: event.target.value || undefined })} /><Button type="button" variant="ghost" size="sm" onClick={() => onUpdate('storyBlocks', product.storyBlocks.filter((_, current) => current !== index))}>Remove block</Button></div>
              </fieldset>
            ))}
            {product.storyBlocks.length === 0 && <p className="border border-dashed border-border px-3 py-4 text-small text-foreground-subtle">No editorial story blocks defined.</p>}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-2"><Input label="Shipping estimate copy" value={product.shippingEstimate} onChange={(event) => onUpdate('shippingEstimate', event.target.value)} hint="Editorial/catalog text only; it is not a dispatch guarantee." /><Input label="Warranty years" type="number" min="0" step="1" value={product.warrantyYears} onChange={(event) => onUpdate('warrantyYears', Math.max(0, Math.floor(Number(event.target.value) || 0)))} /></div>
        <div className="mt-6 border-t border-border pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><TechnicalCode>Frequently asked // {product.faqs.length}</TechnicalCode><Button type="button" variant="outline" size="sm" leftIcon={<Plus className="h-3 w-3" aria-hidden="true" />} onClick={() => onUpdate('faqs', [...product.faqs, { question: '', answer: '' }])}>Add FAQ</Button></div>
          <div className="mt-3 space-y-3">
            {product.faqs.map((faq, index) => (
              <fieldset key={`faq-${index}`} className="grid grid-cols-1 gap-3 border border-border p-3 sm:grid-cols-2">
                <legend className="px-1 font-mono text-[8px] uppercase tracking-[0.12em] text-foreground-subtle">FAQ {String(index + 1).padStart(2, '0')}</legend>
                <Textarea label="Question" value={faq.question} onChange={(event) => updateFaq(index, { ...faq, question: event.target.value })} rows={2} />
                <Textarea label="Answer" value={faq.answer} onChange={(event) => updateFaq(index, { ...faq, answer: event.target.value })} rows={3} />
                <div className="sm:col-span-2"><Button type="button" variant="ghost" size="sm" onClick={() => onUpdate('faqs', product.faqs.filter((_, current) => current !== index))}>Remove FAQ</Button></div>
              </fieldset>
            ))}
            {product.faqs.length === 0 && <p className="border border-dashed border-border px-3 py-4 text-small text-foreground-subtle">No FAQs defined.</p>}
          </div>
        </div>
      </EditorSection>

      <EditorSection code="07 // SEARCH METADATA" title="Search metadata" description="Optional metadata fields extend Product without requiring publication or canonical URL generation.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Input label="SEO title" value={product.seoTitle ?? ''} onChange={(event) => onUpdate('seoTitle', event.target.value || undefined)} /><Input label="Canonical path" value={product.canonicalPath ?? ''} onChange={(event) => onUpdate('canonicalPath', event.target.value || undefined)} hint="Path only, for example /product/model-slug." /><div className="sm:col-span-2"><Textarea label="SEO description" value={product.seoDescription ?? ''} onChange={(event) => onUpdate('seoDescription', event.target.value || undefined)} rows={3} /></div></div>
      </EditorSection>
    </div>
  );
}

function EditorSection({ code, title, description, children }: { code: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`product-editor-${code.replace(/[^a-z0-9]/gi, '-')}`} className="border border-border bg-surface p-4 sm:p-6">
      <div className="mb-5 border-b border-border pb-4"><TechnicalCode>{code}</TechnicalCode><h2 id={`product-editor-${code.replace(/[^a-z0-9]/gi, '-')}`} className="mt-1 font-display text-lg text-foreground">{title}</h2><p className="mt-1 text-small text-foreground-muted">{description}</p></div>
      {children}
    </section>
  );
}

function parseLines(value: string): string[] {
  return value.split('\n').map((line) => line.trim()).filter(Boolean);
}

function moveItem<T>(items: T[], from: number, to: number, onMove: (items: T[]) => void) {
  if (to < 0 || to >= items.length || from === to) return;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  onMove(next);
}
