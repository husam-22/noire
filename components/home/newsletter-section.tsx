'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check } from 'lucide-react';
import { Container } from '@/components/layout';
import { subscribeNewsletterAction } from '@/lib/actions/newsletter';
import { Reveal } from '@/components/motion';
import {
  Eyebrow,
  Input,
  Button,
  TechnicalCode,
  useToast,
} from '@/components/ui';

export function NewsletterSection() {
  const t = useTranslations('home.newsletter');
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [disciplineInterest, setDisciplineInterest] = useState<
    'all' | 'acoustic' | 'architectural'
  >('all');
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const validateEmail = (value: string): string | undefined => {
    const trimmed = value.trim();
    if (!trimmed) {
      return t('errors.empty');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return t('errors.invalid');
    }
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim();
    const validationError = validateEmail(trimmed);
    if (validationError) {
      setError(validationError);
      addToast({
        type: 'error',
        title: t('errors.invalidTitle'),
        description: validationError,
      });
      return;
    }

    setError(undefined);
    setIsSubmitting(true);
    const result = await subscribeNewsletterAction(trimmed, `home:${disciplineInterest}`);
    setIsSubmitting(false);

    if (!result.ok) {
      const message = t('errors.failed');
      setError(message);
      addToast({
        type: 'error',
        title: t('errors.failedTitle'),
        description: message,
      });
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
    <section
      id="private-dispatch"
      aria-labelledby="newsletter-heading"
      className="relative border-b border-border bg-background pt-16 text-foreground sm:pt-24"
    >
      <Container size="wide">
        {/* Upper Alabaster / Obsidian Bridge Card */}
        <Reveal className="surface-obsidian border border-border bg-background p-6 text-foreground sm:p-10 lg:p-14">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left 6 Columns: Editorial Framing */}
            <div className="space-y-5 lg:col-span-6">
              <div className="flex flex-wrap items-center gap-3">
                <Eyebrow index="10" tone="accent">
                  {t('eyebrow')}
                </Eyebrow>
                <TechnicalCode>{t('badge')}</TechnicalCode>
              </div>

              <h2
                id="newsletter-heading"
                className="font-display text-h1 tracking-tighter text-foreground"
              >
                {t.rich('title', {
                  em: (chunks) => (
                    <span className="font-normal italic text-foreground-muted">{chunks}</span>
                  ),
                })}
              </h2>

              <p className="max-w-xl text-small leading-relaxed text-foreground-muted">
                {t('body')}
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground-subtle">
                <span>{t('promiseFrequency')}</span>
                <span>•</span>
                <span>{t('promisePrivacy')}</span>
              </div>
            </div>

            {/* Right 6 Columns: Validated Interactive Form or Confirmed Dossier */}
            <div className="lg:col-span-6">
              {isSubscribed ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="space-y-5 border border-accent/50 bg-surface p-6 sm:p-8"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
                    <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-accent">
                      <Check className="h-4 w-4" aria-hidden="true" />
                      <span>{t('subscribed')}</span>
                    </span>
                    <span className="border border-border bg-background px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground">
                      {t('subscribedBadge')}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-display text-h3 tracking-tight text-foreground">
                      {t('subscribedTitle')}
                    </h3>
                    <p className="text-small leading-relaxed text-foreground-muted">
                      {t.rich('subscribedBody', {
                        preference: t(`preferences.${disciplineInterest}`),
                        em: (chunks) => <span className="uppercase text-accent">{chunks}</span>,
                      })}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-subtle">
                    <span>{t('unsubscribeNote')}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSubscribed(false);
                        setEmail('');
                      }}
                      className="text-foreground underline underline-offset-4 transition-colors hover:text-accent"
                    >
                      {t('addAnother')}
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className="space-y-5 border border-border bg-surface p-6 sm:p-8"
                >
                  <div className="flex items-center justify-between border-b border-border pb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-muted">
                    <span>{t('formTitle')}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
                      {t('formBadge')}
                    </span>
                  </div>

                  {/* Discipline Preference Pills */}
                  <div className="space-y-2">
                    <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-muted">
                      {t('disciplineFocus')}
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { id: 'all', label: t('options.all') },
                          { id: 'acoustic', label: t('options.acoustic') },
                          { id: 'architectural', label: t('options.architectural') },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setDisciplineInterest(opt.id)}
                          className={`border py-2 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
                            disciplineInterest === opt.id
                              ? 'border-foreground bg-foreground text-background'
                              : 'border-border bg-background text-foreground-muted hover:border-foreground/50 hover:text-foreground'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Email Input using Reusable Primitive */}
                  <Input
                    label={t('emailLabel')}
                    codeLabel={t('badge')}
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(undefined);
                    }}
                    error={error}
                    hint={t('emailHint')}
                    disabled={isSubmitting}
                    required
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={isSubmitting}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    {t('submit')}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </Reveal>
      </Container>

      {/* Architectural Connector Band into Section 11 (GlobalFooter) */}
      <div className="surface-obsidian mt-16 border-t border-border bg-background py-4 text-foreground sm:mt-24">
        <Container size="wide">
          <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground-subtle">
            <span>{t('connectorIndex')}</span>
            <span>{t('connectorBrand')}</span>
          </div>
        </Container>
      </div>
    </section>
  );
}
