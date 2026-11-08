'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, BookOpen, Clock } from 'lucide-react';
import { Container, Section } from '@/components/layout';
import { Reveal, StaggerContainer, StaggerItem } from '@/components/motion';
import { Eyebrow, TechnicalCode, Modal } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import type { JournalArticle } from '@/types';

interface JournalSectionProps {
  articles: JournalArticle[];
}

export function JournalSection({ articles }: JournalSectionProps) {
  const t = useTranslations('home.journal');
  const [selectedArticle, setSelectedArticle] =
    useState<JournalArticle | null>(null);

  if (!articles.length) return null;

  const leadArticle = articles[0];
  const secondaryArticles = articles.slice(1, 4);

  return (
    <Section
      id="journal"
      spacing="lg"
      tone="muted"
      borderBottom
      aria-labelledby="journal-heading"
    >
      <Container size="wide">
        {/* Top Magazine Masthead */}
        <Reveal className="mb-12 flex flex-col justify-between gap-6 border-b border-border pb-8 lg:flex-row lg:items-end">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Eyebrow index="09" tone="accent">
                {t('eyebrow')}
              </Eyebrow>
              <TechnicalCode>{t('issn')}</TechnicalCode>
            </div>
            <h2
              id="journal-heading"
              className="font-display text-h1 tracking-tighter text-foreground"
            >
              {t.rich('title', {
                em: (chunks) => (
                  <span className="font-normal italic text-foreground-muted">{chunks}</span>
                ),
              })}
            </h2>
          </div>

          <div className="flex flex-col items-start gap-2 lg:items-end lg:text-end">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground-subtle">
              {t('publishedBy')}
            </span>
            <button
              type="button"
              onClick={() => setSelectedArticle(leadArticle)}
              className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-foreground underline underline-offset-8 transition-colors hover:text-accent"
            >
              <BookOpen className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              <span>
                {t('readCurrentIssue', { issue: leadArticle.issueNumber.split(' // ')[0] })}
              </span>
            </button>
          </div>
        </Reveal>

        {/* Asymmetrical 12-Column Magazine Spread */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left 7 Columns: Lead Feature Article (Issue 14) */}
          <Reveal className="group border border-border bg-surface lg:col-span-7">
            {/* Issue Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-muted sm:px-7">
              <span className="text-accent">{leadArticle.issueNumber}</span>
              <span>CATEGORY // {leadArticle.category.toUpperCase()}</span>
            </div>

            {/* Lead Editorial Plate */}
            <div
              onClick={() => setSelectedArticle(leadArticle)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedArticle(leadArticle);
                }
              }}
              aria-label={t('readLead', { title: leadArticle.title })}
              className="relative aspect-[16/10] w-full cursor-pointer overflow-hidden border-b border-border bg-surface-muted"
            >
              <img
                src={leadArticle.coverImage}
                alt={leadArticle.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-noire-out group-hover:scale-105"
              />
              <div className="absolute start-4 top-4 border border-border bg-background/90 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground backdrop-blur-sm sm:start-6 sm:top-6">
                {t('leadMonograph')}
              </div>
            </div>

            {/* Lead Article Body */}
            <div className="space-y-6 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-subtle">
                <span>{t('published', { date: formatDate(leadArticle.publishedAt) })}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3 text-accent" aria-hidden="true" />
                  <span>{t('minRead', { minutes: leadArticle.readingTimeMinutes })}</span>
                </span>
              </div>

              <div className="space-y-3">
                <h3 className="font-display text-h2 tracking-tight text-foreground transition-colors group-hover:text-accent">
                  <button
                    type="button"
                    onClick={() => setSelectedArticle(leadArticle)}
                    className="text-start"
                  >
                    {leadArticle.title}
                  </button>
                </h3>
                <p className="text-body leading-relaxed text-foreground-muted">
                  {leadArticle.excerpt}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
                <div>
                  <span className="block font-mono text-[11px] uppercase tracking-[0.12em] text-foreground">
                    {leadArticle.author.name}
                  </span>
                  <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
                    {leadArticle.author.role}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedArticle(leadArticle)}
                  className="inline-flex items-center gap-2 border border-foreground bg-foreground px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-background transition-opacity hover:opacity-90"
                >
                  <span>{t('readFull')}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </Reveal>

          {/* Right 5 Columns: Indexed Monograph Stack (Issues 13, 12, 11) */}
          <StaggerContainer className="divide-y divide-border border border-border bg-surface lg:col-span-5">
            {secondaryArticles.map((article) => (
              <StaggerItem
                key={article.id}
                className="group p-5 transition-colors hover:bg-background/70 sm:p-6"
              >
                <div className="grid grid-cols-12 gap-4 sm:gap-5">
                  {/* Article Plate (4 Columns) */}
                  <div
                    onClick={() => setSelectedArticle(article)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedArticle(article);
                      }
                    }}
                    aria-label={t('read', { title: article.title })}
                    className="col-span-4 aspect-[4/5] cursor-pointer overflow-hidden border border-border bg-surface-muted"
                  >
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 ease-noire-out group-hover:scale-105"
                    />
                  </div>

                  {/* Article Metadata & Title (8 Columns) */}
                  <div className="col-span-8 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
                        <span className="text-accent">
                          {article.issueNumber.split(' // ')[0]}
                        </span>
                        <span className="text-foreground-subtle">
                          {article.category}
                        </span>
                      </div>

                      <h3 className="font-display text-lg font-medium leading-snug tracking-tight text-foreground transition-colors group-hover:text-accent">
                        <button
                          type="button"
                          onClick={() => setSelectedArticle(article)}
                          className="text-start"
                        >
                          {article.title}
                        </button>
                      </h3>

                      <p className="line-clamp-2 text-caption leading-relaxed text-foreground-muted">
                        {article.excerpt}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
                      <span>
                        {formatDate(article.publishedAt)} •{' '}
                        {t('minRead', { minutes: article.readingTimeMinutes })}
                      </span>

                      <button
                        type="button"
                        onClick={() => setSelectedArticle(article)}
                        className="inline-flex items-center gap-1 text-foreground transition-colors group-hover:text-accent"
                      >
                        <span>{t('read')}</span>
                        <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>

        {/* Interactive Monograph Reader Modal */}
        {selectedArticle && (
          <Modal
            isOpen={Boolean(selectedArticle)}
            onClose={() => setSelectedArticle(null)}
            title={selectedArticle.title}
            code={`${selectedArticle.issueNumber} • ${t('minRead', { minutes: selectedArticle.readingTimeMinutes })}`}
            size="lg"
          >
            <article className="space-y-6">
              <div className="aspect-[16/9] w-full overflow-hidden border border-border bg-surface-muted">
                <img
                  src={selectedArticle.coverImage}
                  alt={selectedArticle.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="space-y-2 border-b border-border pb-5">
                <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
                  <span>{selectedArticle.category}</span>
                  <span>•</span>
                  <span>{t('published', { date: formatDate(selectedArticle.publishedAt) })}</span>
                  <span>•</span>
                  <span>{t('minRead', { minutes: selectedArticle.readingTimeMinutes })}</span>
                </div>

                <h2 className="font-display text-h2 tracking-tight text-foreground">
                  {selectedArticle.title}
                </h2>
                <p className="text-small text-foreground-muted">
                  {selectedArticle.subtitle}
                </p>
                <p className="pt-1 font-mono text-xs text-foreground">
                  {t('byAuthor', { name: selectedArticle.author.name, role: selectedArticle.author.role })}
                </p>
              </div>

              <div className="space-y-4 text-body leading-relaxed text-foreground-muted">
                {selectedArticle.content.map((paragraph, index) => (
                  <p
                    key={index}
                    className={
                      index === 0 ? 'font-medium text-foreground' : ''
                    }
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </article>
          </Modal>
        )}
      </Container>
    </Section>
  );
}
