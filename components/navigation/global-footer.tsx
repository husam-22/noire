'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { subscribeNewsletterAction } from '@/lib/actions/newsletter';
import { Link } from '@/i18n/navigation';
import { ArrowUpRight, ArrowRight, Check } from 'lucide-react';
import { Container } from '@/components/layout';
import {
  Button,
  Input,
  Eyebrow,
  Heading,
  Text,
  TechnicalCode,
  useToast,
} from '@/components/ui';
import type { Category, Collection } from '@/types';

export interface GlobalFooterProps {
  categories: Category[];
  collections: Collection[];
}

export function GlobalFooter({ categories, collections }: GlobalFooterProps) {
  const { addToast } = useToast();
  const t = useTranslations('footer');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();

    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError(t('emailInvalid'));
      return;
    }

    setEmailError('');
    setIsSubmitting(true);
    const result = await subscribeNewsletterAction(trimmed, 'footer');
    setIsSubmitting(false);

    if (!result.ok) {
      setEmailError(t('subscribeFailed'));
      return;
    }

    setIsSubscribed(true);
    setEmail('');
    addToast({
      type: 'success',
      title: t('toastTitle'),
      description: t('toastDescription'),
    });
  };

  return (
    <footer
      aria-label={t('aria')}
      className="surface-obsidian border-t border-border bg-background text-foreground"
    >
      {/* Band 01: Editorial Brand Statement & Private Client Newsletter */}
      <div className="border-b border-border py-14 md:py-20">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Left 7 Columns: Brand Manifesto & Studio Coordinates */}
            <div className="flex flex-col justify-between space-y-8 lg:col-span-7">
              <div className="space-y-4">
                <Eyebrow index="00" tone="accent">
                  {t('houseCode')}
                </Eyebrow>
                <Heading
                  as="h2"
                  size="h2"
                  className="max-w-2xl tracking-tight text-foreground"
                >
                  {t('manifestoTitle')}
                </Heading>
                <Text size="body" tone="muted" measure>
                  {t('manifestoBody')}
                </Text>
              </div>

              {/* Studio Coordinates */}
              <div className="grid grid-cols-1 gap-6 border-t border-border pt-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <TechnicalCode>{'ATELIER 01 // ZURICH'}</TechnicalCode>
                  <p className="font-display text-sm font-medium text-foreground">
                    Bahnhofstrasse 64, 8001 Zürich
                  </p>
                  <p className="font-mono text-[11px] text-foreground-subtle">
                    47.3769° N, 8.5417° E · {t('anechoicChamber')}
                  </p>
                </div>
                <div className="space-y-1">
                  <TechnicalCode>{'ATELIER 02 // TOKYO'}</TechnicalCode>
                  <p className="font-display text-sm font-medium text-foreground">
                    5-7-21 Minami-Aoyama, Minato-ku
                  </p>
                  <p className="font-mono text-[11px] text-foreground-subtle">
                    35.6620° N, 139.7126° E · {t('tactileLab')}
                  </p>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Private Client Monograph Dispatch */}
            <div className="flex flex-col justify-between border border-border bg-surface p-6 sm:p-8 lg:col-span-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <TechnicalCode>{t('monographCode')}</TechnicalCode>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
                    {t('quarterlyIssue')}
                  </span>
                </div>
                <h3 className="font-display text-xl font-medium tracking-tight text-foreground">
                  {t('newsletterTitle')}
                </h3>
                <p className="text-small text-foreground-muted">
                  {t('newsletterBody')}
                </p>
              </div>

              <form
                onSubmit={handleSubscribe}
                noValidate
                className="mt-8 space-y-4"
              >
                <Input
                  type="email"
                  variant="editorial"
                  label={t('emailLabel')}
                  codeLabel={t('emailCode')}
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  error={emailError}
                />

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
                    {t('privacyNote')}
                  </span>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSubmitting}
                    rightIcon={
                      isSubscribed ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5" />
                      )
                    }
                  >
                    {isSubscribed ? t('subscribed') : t('subscribe')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </Container>
      </div>

      {/* Band 02: Indexed Architectural Navigation Matrix */}
      <div className="border-b border-border">
        <Container>
          <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-12 lg:divide-x">
            {/* 01. Shop Departments (3 Cols) */}
            <div className="py-10 sm:pe-6 lg:col-span-3 lg:py-12 lg:pe-8">
              <div className="mb-5 flex items-center justify-between">
                <span className="font-mono text-label uppercase text-accent">
                  {t('shopCode')}
                </span>
                <TechnicalCode>[06]</TechnicalCode>
              </div>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/shop"
                    className="noire-link font-sans text-small text-foreground transition-colors hover:text-accent"
                  >
                    {t('completeArchive')}
                  </Link>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/shop?category=${cat.slug}`}
                      className="group flex items-center justify-between text-small text-foreground-muted transition-colors hover:text-foreground"
                    >
                      <span>{cat.name}</span>
                      <span className="font-mono text-[10px] text-foreground-subtle group-hover:text-accent">
                        {cat.indexNumber}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* 02. Collections & Journal (3 Cols) */}
            <div className="py-10 sm:ps-6 lg:col-span-3 lg:px-8 lg:py-12">
              <div className="mb-5 flex items-center justify-between">
                <span className="font-mono text-label uppercase text-accent">
                  {t('collectionsCode')}
                </span>
                <TechnicalCode>[07]</TechnicalCode>
              </div>
              <ul className="space-y-2.5">
                {collections.map((col) => (
                  <li key={col.id}>
                    <Link
                      href={`/shop?collection=${col.slug}`}
                      className="noire-link text-small text-foreground-muted transition-colors hover:text-foreground"
                    >
                      {col.title}
                    </Link>
                  </li>
                ))}
                <li className="pt-2">
                  <p className="border-t border-border pt-3 text-[10px] leading-relaxed text-foreground-subtle">
                    {t('journalNote')}
                  </p>
                </li>
              </ul>
            </div>

            {/* 03. Support & Ownership (3 Cols) */}
            <div className="py-10 sm:pe-6 lg:col-span-3 lg:px-8 lg:py-12">
              <div className="mb-5 flex items-center justify-between">
                <span className="font-mono text-label uppercase text-accent">
                  {t('supportIndex')}
                </span>
                <TechnicalCode>{t('care')}</TechnicalCode>
              </div>
              <p className="mb-4 text-[10px] leading-relaxed text-foreground-subtle">
                {t('careNote')}
              </p>
              <ul className="space-y-2.5">
                {[
                  { label: t('linkAccount'), href: '/account' },
                  { label: t('linkWishlist'), href: '/wishlist' },
                  { label: t('linkShipping'), href: '/cart' },
                ].map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="noire-link text-small text-foreground-muted transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* 04. Company & Governance (3 Cols) */}
            <div className="py-10 sm:ps-6 lg:col-span-3 lg:py-12 lg:ps-8">
              <div className="mb-5 flex items-center justify-between">
                <span className="font-mono text-label uppercase text-accent">
                  {t('companyIndex')}
                </span>
                <TechnicalCode>{t('house')}</TechnicalCode>
              </div>
              <p className="max-w-xs text-small leading-relaxed text-foreground-subtle">
                {t('houseNote')}
              </p>
            </div>
          </div>
        </Container>
      </div>

      {/* Band 03: Monumental Wordmark, Social Channels & Legal Colophon */}
      <Container className="py-10 md:py-14">
        <div className="flex flex-col justify-between gap-8 border-b border-border pb-10 md:flex-row md:items-end">
          {/* Monumental Architectural Wordmark */}
          <div>
            <TechnicalCode className="mb-2 block">
              {t('serializedCode')}
            </TechnicalCode>
            <p
              aria-hidden="true"
              className="select-none font-display text-[clamp(2.5rem,10vw,8.5rem)] font-semibold leading-[0.86] tracking-[0.18em] text-foreground"
            >
              NOIRÉ
            </p>
          </div>

          {/* Social Channels */}
          <div className="flex flex-wrap items-center gap-3">
            {[
              { label: 'Instagram', href: 'https://instagram.com' },
              { label: 'Are.na', href: 'https://are.na' },
              { label: 'X // Twitter', href: 'https://x.com' },
              { label: 'Vimeo', href: 'https://vimeo.com' },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 border border-border bg-surface px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-foreground-muted transition-colors hover:border-foreground hover:text-foreground"
              >
                <span>{social.label}</span>
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        {/* Legal Links & Copyright */}
        <div className="mt-8 flex flex-col justify-between gap-4 font-mono text-[11px] text-foreground-subtle md:flex-row md:items-center">
          <p>{t('copyright', { year: 2026 })}</p>

          <p className="max-w-md text-[10px] leading-relaxed md:text-end">
            {t('legalNote')}
          </p>
        </div>
      </Container>
    </footer>
  );
}
