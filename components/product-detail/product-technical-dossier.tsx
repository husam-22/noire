import React from 'react';
import { Container, Section } from '@/components/layout';
import { Reveal } from '@/components/motion';
import { Eyebrow, TechnicalCode } from '@/components/ui';
import { useTranslations } from 'next-intl';
import type { Product, ProductSpecification } from '@/types';

interface ProductTechnicalDossierProps {
  product: Product;
}

export function ProductTechnicalDossier({
  product,
}: ProductTechnicalDossierProps) {
  const t = useTranslations('productDetail.specs');
  if (!product.specifications || product.specifications.length === 0) {
    return null;
  }

  // Group specifications by their existing `group` field while preserving order
  const groupedSpecs: Array<{
    groupName: string;
    items: ProductSpecification[];
  }> = [];

  product.specifications.forEach((spec) => {
    const existingGroup = groupedSpecs.find((g) => g.groupName === spec.group);
    if (existingGroup) {
      existingGroup.items.push(spec);
    } else {
      groupedSpecs.push({
        groupName: spec.group,
        items: [spec],
      });
    }
  });

  return (
    <Section
      id="specifications"
      spacing="lg"
      tone="muted"
      borderBottom
      aria-labelledby="pdp-specs-heading"
    >
      <Container size="wide">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left 4 Columns: Dossier Header & Calibration Metadata */}
          <Reveal className="space-y-6 lg:col-span-4 lg:sticky lg:top-28">
            <div className="space-y-3 border-b border-border pb-6">
              <Eyebrow index="03" tone="accent">
                {t('eyebrow')}
              </Eyebrow>
              <h2
                id="pdp-specs-heading"
                className="font-display text-h1 tracking-tighter text-foreground"
              >
                {t('title')}{' '}
                <span className="font-normal italic text-foreground-muted">
                  {t('titleAccent')}
                </span>
              </h2>
              <p className="text-small leading-relaxed text-foreground-muted">
                {t('intro', { name: product.name, model: product.modelNumber })}
              </p>
            </div>

            {/* Reference Summary Box */}
            <div className="space-y-3 border border-border bg-surface p-5 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <span className="text-[10px] uppercase tracking-[0.14em] text-foreground-subtle">
                  {t('model')}
                </span>
                <span className="text-foreground">{product.modelNumber}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <span className="text-[10px] uppercase tracking-[0.14em] text-foreground-subtle">
                  {t('sku')}
                </span>
                <span className="text-foreground">{product.sku}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <span className="text-[10px] uppercase tracking-[0.14em] text-foreground-subtle">
                  {t('year')}
                </span>
                <span className="text-foreground">{product.releaseYear}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.14em] text-foreground-subtle">
                  {t('warranty')}
                </span>
                <span className="text-accent">
                  {t('years', { count: product.warrantyYears })}
                </span>
              </div>
            </div>
          </Reveal>

          {/* Right 8 Columns: Numbered Specification Dossier Modules */}
          <div className="space-y-8 lg:col-span-8">
            {groupedSpecs.map((group, groupIdx) => {
              const indexStr = String(groupIdx + 1).padStart(2, '0');
              return (
                <Reveal
                  key={group.groupName}
                  delay={groupIdx * 0.05}
                  className="border border-border bg-surface"
                >
                  {/* Group Header Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-muted/40 px-5 py-4 sm:px-7">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-xs font-medium text-accent">
                        {indexStr}
                      </span>
                      <h3 className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-foreground">
                        {group.groupName}
                      </h3>
                    </div>
                    <TechnicalCode>
                      {t('parameters', { count: String(group.items.length).padStart(2, '0') })}
                    </TechnicalCode>
                  </div>

                  {/* Specification Rows */}
                  <dl className="divide-y divide-border">
                    {group.items.map((spec) => (
                      <div
                        key={spec.label}
                        className="grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-12 sm:gap-6 sm:px-7 sm:py-5"
                      >
                        <dt className="font-mono text-xs uppercase tracking-[0.1em] text-foreground-muted sm:col-span-5">
                          {spec.label}
                        </dt>
                        <dd className="break-words font-sans text-small leading-relaxed text-foreground sm:col-span-7">
                          {spec.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Reveal>
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
}
