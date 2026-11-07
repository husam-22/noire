'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Container, Section } from '@/components/layout';
import { Reveal } from '@/components/motion';
import {
  Eyebrow,
  Accordion,
  RatingDisplay,
  TechnicalCode,
} from '@/components/ui';
import { formatDate } from '@/lib/utils';
import type { Product, Review } from '@/types';

interface ProductFaqReviewsSectionProps {
  product: Product;
  reviews: Review[];
}

export function ProductFaqReviewsSection({
  product,
  reviews,
}: ProductFaqReviewsSectionProps) {
  const hasFaqs = Boolean(product.faqs && product.faqs.length > 0);
  const hasReviews = Boolean(reviews && reviews.length > 0);

  if (!hasFaqs && !hasReviews) {
    return null;
  }

  const accordionItems = (product.faqs || []).map((faq, idx) => ({
    id: `faq-${idx + 1}`,
    index: String(idx + 1).padStart(2, '0'),
    title: faq.question,
    content: <p className="leading-relaxed">{faq.answer}</p>,
  }));

  return (
    <Section
      id="faq"
      spacing="lg"
      tone="default"
      borderBottom
      aria-labelledby="pdp-faq-heading"
    >
      <Container size="wide">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14">
          {/* Left Column: Verified Client Field Reports (if reviews exist) or Rating Summary */}
          <Reveal className={hasFaqs ? 'lg:col-span-5' : 'lg:col-span-12'}>
            <div className="space-y-6">
              <div className="space-y-3 border-b border-border pb-6">
                <Eyebrow index="04" tone="accent">
                  CLIENT REPORTS
                </Eyebrow>
                <h2 className="font-display text-h2 tracking-tight text-foreground">
                  Client reviews
                </h2>
                {hasReviews && (
                  <p className="text-small text-foreground-muted">
                    Published reports for {product.modelNumber}.
                  </p>
                )}
              </div>

              {hasReviews ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <article
                      key={review.id}
                      className="space-y-4 border border-border bg-surface p-6"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                        <RatingDisplay rating={review.rating} />
                        {review.verifiedPurchase && (
                          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-success">
                            <CheckCircle2
                              className="h-3 w-3"
                              aria-hidden="true"
                            />
                            <span>Verified Serial Owner</span>
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-display text-base font-medium text-foreground">
                          &ldquo;{review.title}&rdquo;
                        </h3>
                        <p className="text-small leading-relaxed text-foreground-muted">
                          {review.body}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
                        <div>
                          <span className="text-foreground">
                            {review.authorName}
                          </span>
                          {review.authorRole && (
                            <span> · {review.authorRole}</span>
                          )}
                          <span> ({review.authorLocation})</span>
                        </div>
                        <span>{formatDate(review.createdAt)}</span>
                      </div>

                      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent">
                        CONFIGURATION // {review.variantPurchased}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="border border-border bg-surface p-6">
                  <TechnicalCode className="block">
                    REVIEWS // NONE YET
                  </TechnicalCode>
                  <p className="mt-2 text-small leading-relaxed text-foreground-muted">
                    This instrument has no verified client reviews yet.
                  </p>
                </div>
              )}
            </div>
          </Reveal>

          {/* Right Column: Accessible Engineering FAQ Accordion */}
          {hasFaqs && (
            <Reveal
              delay={0.08}
              className={hasReviews ? 'lg:col-span-7' : 'lg:col-span-7'}
            >
              <div className="space-y-6">
                <div className="space-y-3 border-b border-border pb-6">
                  <Eyebrow index="05" tone="accent">
                    TECHNICAL INQUIRIES
                  </Eyebrow>
                  <h2
                    id="pdp-faq-heading"
                    className="font-display text-h2 tracking-tight text-foreground"
                  >
                    Frequently Asked{' '}
                    <span className="font-normal italic text-foreground-muted">
                      Engineering Questions.
                    </span>
                  </h2>
                </div>

                <Accordion
                  items={accordionItems}
                  defaultOpenIds={
                    accordionItems[0] ? [accordionItems[0].id] : []
                  }
                  allowMultiple
                />
              </div>
            </Reveal>
          )}
        </div>
      </Container>
    </Section>
  );
}
