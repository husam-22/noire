'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Send } from 'lucide-react';
import type { CustomerPreferencesRecord, PrivateDispatchDiscipline } from '@/lib/account/contracts';
import { updatePreferencesAction } from '@/lib/actions/account';
import { Button, Checkbox, TechnicalCode } from '@/components/ui';
import { useToast } from '@/components/ui/toast';

const DISCIPLINES: PrivateDispatchDiscipline[] = ['acoustic-systems', 'desk-architecture', 'transit-field', 'lighting'];

function defaults(email: string): CustomerPreferencesRecord {
  return {
    email,
    newsletter: false,
    privateReleases: false,
    smsUpdates: false,
    preferredCurrency: 'USD',
    disciplines: [],
  };
}

export function AccountPreferences({
  email,
  preferences,
}: {
  email: string;
  preferences: CustomerPreferencesRecord | null;
}) {
  const t = useTranslations('account.preferences');
  const router = useRouter();
  const { addToast } = useToast();
  const [draft, setDraft] = useState<CustomerPreferencesRecord>(preferences ?? defaults(email));
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const update = (patch: Partial<CustomerPreferencesRecord>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setIsDirty(true);
  };

  const toggleDiscipline = (discipline: PrivateDispatchDiscipline, checked: boolean) => {
    const next = checked
      ? draft.disciplines.includes(discipline)
        ? draft.disciplines
        : [...draft.disciplines, discipline]
      : draft.disciplines.filter((item) => item !== discipline);
    update({ disciplines: next });
  };

  const save = async () => {
    setIsSaving(true);
    const result = await updatePreferencesAction({ ...draft, email });
    setIsSaving(false);
    if (!result.ok) {
      addToast({ type: 'error', title: t('toastFailed'), description: result.error });
      return;
    }
    setDraft(result.data);
    setIsDirty(false);
    addToast({ type: 'success', title: t('toastSaved') });
    router.refresh();
  };

  return (
    <section id="private-dispatch" aria-labelledby="private-dispatch-heading" className="scroll-mt-28 space-y-5 sm:space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <TechnicalCode>{t('code')}</TechnicalCode>
          <h2 id="private-dispatch-heading" className="mt-2 font-display text-2xl text-foreground sm:text-3xl">
            {t('title')}
          </h2>
        </div>
        <span className="border border-border px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.11em] text-foreground-subtle">
          {isDirty ? t('unsaved') : t('saved')}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="min-w-0 border border-border bg-surface p-4 sm:p-6 lg:col-span-5">
          <TechnicalCode>{t('contactCode')}</TechnicalCode>
          <h3 className="mt-2 font-display text-xl text-foreground">{t('contactTitle')}</h3>
          <dl className="mt-4 border-y border-border py-4">
            <dt className="font-mono text-[8px] uppercase tracking-[0.12em] text-foreground-subtle">{t('email')}</dt>
            <dd className="mt-2 break-all text-small text-foreground">{email}</dd>
          </dl>
          <fieldset className="mt-4 space-y-3">
            <legend className="sr-only">{t('legend')}</legend>
            <Checkbox
              checked={draft.newsletter}
              onChange={(checked) => update({ newsletter: checked })}
              label={t('newsletter')}
              description={t('newsletterDesc')}
              className="min-h-11 border border-border p-3"
            />
            <Checkbox
              checked={draft.privateReleases}
              onChange={(checked) => update({ privateReleases: checked })}
              label={t('privateReleases')}
              description={t('privateReleasesDesc')}
              className="min-h-11 border border-border p-3"
            />
            <Checkbox
              checked={draft.smsUpdates}
              onChange={(checked) => update({ smsUpdates: checked })}
              label={t('sms')}
              description={t('smsDesc')}
              className="min-h-11 border border-border p-3"
            />
          </fieldset>
        </div>

        <div className="min-w-0 border border-border bg-surface p-4 sm:p-6 lg:col-span-7">
          <div className="flex items-start gap-3 border-b border-border pb-4">
            <Send className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <div>
              <TechnicalCode>{t('interestsCode')}</TechnicalCode>
              <h3 className="mt-2 font-display text-xl text-foreground">{t('interestsTitle')}</h3>
              <p className="mt-1.5 text-small leading-relaxed text-foreground-muted">
                {t('interestsIntro')}
              </p>
            </div>
          </div>

          <fieldset className="mt-4 grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
            <legend className="sr-only">{t('interestsLegend')}</legend>
            {DISCIPLINES.map((discipline) => (
              <Checkbox
                key={discipline}
                checked={draft.disciplines.includes(discipline)}
                onChange={(checked) => toggleDiscipline(discipline, checked)}
                label={t(`disciplines.${discipline}`)}
                description={t(`disciplines.${discipline}Desc`)}
                className="min-h-11 border border-border p-3"
              />
            ))}
          </fieldset>

          <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p aria-live="polite" className="text-[10px] leading-relaxed text-foreground-subtle">
              {t('selected', { count: draft.disciplines.length })}
            </p>
            <Button type="button" variant="primary" size="md" isLoading={isSaving} disabled={!isDirty} onClick={save}>
              {t('save')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
