import React from 'react';
import { Container, Section } from '@/components/layout';
import { Reveal, ImageReveal } from '@/components/motion';
import { Eyebrow, TechnicalCode } from '@/components/ui';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface ProductStorySectionProps {
  product: Product;
}

export function ProductStorySection({ product }: ProductStorySectionProps) {
  const t = useTranslations('productDetail.story');
  return (
    <Section
      id="editorial-story"
      spacing="lg"
      tone="obsidian"
      borderBottom
      aria-labelledby="pdp-story-heading"
    >
      <Container size="wide">
        {/* Top Monograph Lead Essay */}
        <Reveal className="mb-16 grid grid-cols-1 gap-8 border-b border-border pb-12 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-4 lg:col-span-4">
            <Eyebrow index="01" tone="accent">
              {t('eyebrow')}
            </Eyebrow>
            <TechnicalCode className="block">
              {t('code', { model: product.modelNumber })}
            </TechnicalCode>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-foreground-muted">
              {t('edition', { origin: product.designedIn, year: product.releaseYear })}
            </p>
          </div>

          <div className="space-y-6 lg:col-span-8">
            <h2
              id="pdp-story-heading"
              className="font-display text-h1 tracking-tighter text-foreground"
            >
              {product.editorialDescription}
            </h2>

            {/* Key Engineering Highlights Strip */}
            {product.highlights.length > 0 && (
              <div className="grid grid-cols-1 gap-4 border-t border-border pt-6 sm:grid-cols-2">
                {product.highlights.map((highlight, idx) => (
                  <div
                    key={highlight}
                    className="flex items-start gap-3 border-s border-accent/60 ps-4"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
                      0{idx + 1}
                    </span>
                    <span className="text-small text-foreground-muted">
                      {highlight}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Reveal>

        {/* Story Blocks Sequence */}
        {product.storyBlocks.length > 0 && (
          <div className="space-y-20">
            {product.storyBlocks.map((block, index) => {
              const isReversed =
                block.layout === 'split-right' || index % 2 === 1;

              return (
                <article
                  key={block.id}
                  className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14"
                >
                  {/* Story Image Plate (7 Columns) */}
                  <div
                    className={cn(
                      'lg:col-span-7',
                      isReversed && 'lg:order-2'
                    )}
                  >
                    <div className="border border-border bg-surface p-3 sm:p-4">
                      <div className="mb-2.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-muted">
                        <span>{block.eyebrow}</span>
                        <span>{t('figure', { index: index + 1 })}</span>
                      </div>

                      <ImageReveal className="aspect-[16/11] w-full bg-surface-muted">
                        <img
                          src={block.image}
                          alt={block.imageAlt}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </ImageReveal>

                      {block.caption && (
                        <p className="mt-2.5 font-mono text-[11px] text-foreground-subtle">
                          {block.caption}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Story Text & Quantitative Metrics (5 Columns) */}
                  <Reveal
                    delay={0.08}
                    className={cn(
                      'space-y-6 lg:col-span-5',
                      isReversed && 'lg:order-1'
                    )}
                  >
                    <div className="space-y-3">
                      <span className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
                        {block.eyebrow}
                      </span>
                      <h3 className="font-display text-h1 tracking-tight text-foreground">
                        {block.title}
                      </h3>
                    </div>

                    <p className="max-w-reading text-body-lg leading-relaxed text-foreground-muted">
                      {block.description}
                    </p>

                    {/* Quantitative Engineering Metrics if present */}
                    {block.metrics && block.metrics.length > 0 && (
                      <div className="grid grid-cols-3 gap-4 border-t border-border pt-6">
                        {block.metrics.map((metric) => (
                          <div
                            key={metric.label}
                            className="border-s border-border ps-3"
                          >
                            <div className="font-display text-h2 tracking-tight text-foreground">
                              {metric.value}
                              {metric.unit && (
                                <span className="ms-0.5 font-mono text-xs text-accent">
                                  {metric.unit}
                                </span>
                              )}
                            </div>
                            <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
                              {metric.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Reveal>
                </article>
              );
            })}
          </div>
        )}
      </Container>
    </Section>
  );
}
