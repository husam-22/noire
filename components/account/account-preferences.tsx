'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import type { CustomerPreferencesRecord, PrivateDispatchDiscipline } from '@/lib/account/contracts';
import { updatePreferencesAction } from '@/lib/actions/account';
import { Button, Checkbox, TechnicalCode } from '@/components/ui';
import { useToast } from '@/components/ui/toast';

const DISCIPLINES: Array<{
  id: PrivateDispatchDiscipline;
  label: string;
  description: string;
}> = [
  { id: 'acoustic-systems', label: 'Acoustic Systems', description: 'Listening instruments and studio reference' },
  { id: 'desk-architecture', label: 'Desk Architecture', description: 'Tactile input and workspace systems' },
  { id: 'transit-field', label: 'Transit & Field', description: 'Portable instruments and field hardware' },
  { id: 'lighting', label: 'Lighting', description: 'Architectural and ambient illumination' },
];

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
      addToast({ type: 'error', title: 'Could not save preferences', description: result.error });
      return;
    }
    setDraft(result.data);
    setIsDirty(false);
    addToast({ type: 'success', title: 'Preferences saved' });
    router.refresh();
  };

  return (
    <section id="private-dispatch" aria-labelledby="private-dispatch-heading" className="scroll-mt-28 space-y-5 sm:space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <TechnicalCode>Communication // 06</TechnicalCode>
          <h2 id="private-dispatch-heading" className="mt-2 font-display text-2xl text-foreground sm:text-3xl">
            Communication Preferences
          </h2>
        </div>
        <span className="border border-border px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.11em] text-foreground-subtle">
          {isDirty ? 'Unsaved changes' : 'Saved to your account'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="min-w-0 border border-border bg-surface p-4 sm:p-6 lg:col-span-5">
          <TechnicalCode>Contact</TechnicalCode>
          <h3 className="mt-2 font-display text-xl text-foreground">Where we reach you</h3>
          <dl className="mt-4 border-y border-border py-4">
            <dt className="font-mono text-[8px] uppercase tracking-[0.12em] text-foreground-subtle">Email</dt>
            <dd className="mt-2 break-all text-small text-foreground">{email}</dd>
          </dl>
          <fieldset className="mt-4 space-y-3">
            <legend className="sr-only">Email and SMS preferences</legend>
            <Checkbox
              checked={draft.newsletter}
              onChange={(checked) => update({ newsletter: checked })}
              label="Monthly newsletter"
              description="Release notes and monographs, once a month."
              className="min-h-11 border border-border p-3"
            />
            <Checkbox
              checked={draft.privateReleases}
              onChange={(checked) => update({ privateReleases: checked })}
              label="Private release notices"
              description="Early access to numbered batches before public listing."
              className="min-h-11 border border-border p-3"
            />
            <Checkbox
              checked={draft.smsUpdates}
              onChange={(checked) => update({ smsUpdates: checked })}
              label="SMS order updates"
              description="Confirmation and dispatch notices by text message."
              className="min-h-11 border border-border p-3"
            />
          </fieldset>
        </div>

        <div className="min-w-0 border border-border bg-surface p-4 sm:p-6 lg:col-span-7">
          <div className="flex items-start gap-3 border-b border-border pb-4">
            <Send className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <div>
              <TechnicalCode>Interests</TechnicalCode>
              <h3 className="mt-2 font-display text-xl text-foreground">Disciplines</h3>
              <p className="mt-1.5 text-small leading-relaxed text-foreground-muted">
                Tell us which categories you care about so release notices stay relevant.
              </p>
            </div>
          </div>

          <fieldset className="mt-4 grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
            <legend className="sr-only">Discipline interests</legend>
            {DISCIPLINES.map((discipline) => (
              <Checkbox
                key={discipline.id}
                checked={draft.disciplines.includes(discipline.id)}
                onChange={(checked) => toggleDiscipline(discipline.id, checked)}
                label={discipline.label}
                description={discipline.description}
                className="min-h-11 border border-border p-3"
              />
            ))}
          </fieldset>

          <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p aria-live="polite" className="text-[10px] leading-relaxed text-foreground-subtle">
              {`${draft.disciplines.length} interest${draft.disciplines.length === 1 ? '' : 's'} selected`}
            </p>
            <Button type="button" variant="primary" size="md" isLoading={isSaving} disabled={!isDirty} onClick={save}>
              Save preferences
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
