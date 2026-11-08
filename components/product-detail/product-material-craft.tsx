import React from 'react';
import { Layers, ShieldCheck, Compass } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Container, Section } from '@/components/layout';
import { Reveal, StaggerContainer, StaggerItem } from '@/components/motion';
import { Eyebrow, TechnicalCode } from '@/components/ui';
import type { Product } from '@/types';

interface ProductMaterialCraftProps {
  product: Product;
}

export function ProductMaterialCraft({ product }: ProductMaterialCraftProps) {
  const t = useTranslations('productDetail.materials');
  if (!product.materials || product.materials.length === 0) {
    return null;
  }

  return (
    <Section
      id="material-craft"
      spacing="lg"
      tone="default"
      borderBottom
      aria-labelledby="pdp-material-heading"
    >
      <Container size="wide">
        {/* Section Header */}
        <Reveal className="mb-12 grid grid-cols-1 items-end gap-6 border-b border-border pb-8 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-7">
            <div className="flex flex-wrap items-center gap-3">
              <Eyebrow index="02" tone="accent">
                {t('eyebrow')}
              </Eyebrow>
              <TechnicalCode>{t('bom', { sku: product.sku })}</TechnicalCode>
            </div>
            <h2
              id="pdp-material-heading"
              className="font-display text-h1 tracking-tighter text-foreground"
            >
              {t('title')}{' '}
              <span className="font-normal italic text-foreground-muted">
                {t('titleAccent')}
              </span>
            </h2>
          </div>

          <div className="lg:col-span-5 lg:text-end">
            <p className="ms-auto max-w-md text-small leading-relaxed text-foreground-muted">
              {t('intro')}
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left 7 Columns: Primary Material Bill of Materials (BOM) Cards */}
          <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7">
            {product.materials.map((material, idx) => (
              <StaggerItem
                key={material}
                className="flex flex-col justify-between border border-border bg-surface p-6 transition-colors hover:border-foreground/50"
              >
                <div className="flex items-center justify-between border-b border-border pb-3 font-mono text-[10px] uppercase tracking-[0.16em]">
                  <span className="text-accent">
                    {t('substrate', { index: idx + 1 })}
                  </span>
                  <Layers
                    className="h-3.5 w-3.5 text-foreground-subtle"
                    aria-hidden="true"
                  />
                </div>

                <div className="my-6">
                  <h3 className="font-display text-h3 tracking-tight text-foreground">
                    {material}
                  </h3>
                </div>

                <div className="flex items-center justify-between border-t border-border/70 pt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
                  <span>{t('specifiedFor', { model: product.modelNumber.split(' // ')[0] })}</span>
                  <span>{t('verified')}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Right 5 Columns: Surface Finish Treatments & Durability Ledger */}
          <Reveal
            delay={0.08}
            className="flex flex-col justify-between border border-border bg-surface p-6 sm:p-8 lg:col-span-5"
          >
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
                  {t('finishesLabel')}
                </span>
                <h3 className="mt-1 font-display text-h3 tracking-tight text-foreground">
                  {t('finishesTitle')}
                </h3>
              </div>

              <div className="divide-y divide-border">
                {product.colors.map((color) => (
                  <div
                    key={color.id}
                    className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-1 h-5 w-5 shrink-0 rounded-full border border-black/20 dark:border-white/25"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div>
                        <span className="block font-display text-base font-medium text-foreground">
                          {color.name}
                        </span>
                        <span className="block text-caption text-foreground-muted">
                          {color.finish}
                        </span>
                      </div>
                    </div>

                    <span className="shrink-0 border border-border bg-surface-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
                      {product.sku}-{color.skuSuffix}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Engineering & Durability Footer */}
            <div className="mt-8 grid grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-2">
              <div className="flex items-start gap-2.5">
                <Compass
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                  aria-hidden="true"
                />
                <div>
                  <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-foreground">
                    {t('origin')}
                  </span>
                  <span className="text-caption text-foreground-muted">
                    {product.designedIn} ({product.releaseYear})
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <ShieldCheck
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                  aria-hidden="true"
                />
                <div>
                  <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-foreground">
                    {t('warranty')}
                  </span>
                  <span className="text-caption text-foreground-muted">
                    {t('warrantyValue', { years: product.warrantyYears })}
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
