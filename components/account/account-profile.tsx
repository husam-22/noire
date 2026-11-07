'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContactRound, PencilLine } from 'lucide-react';
import type { CustomerProfileRecord, CustomerProfileUpdate } from '@/lib/account/contracts';
import { updateProfileAction } from '@/lib/actions/account';
import { formatOrderDate } from '@/lib/account/order-utils';
import { Button, Input, Modal, TechnicalCode } from '@/components/ui';
import { useToast } from '@/components/ui/toast';

function displayValue(value: string | undefined): string {
  return value?.trim() ? value : 'NOT PROVIDED';
}

export function AccountProfile({ profile }: { profile: CustomerProfileRecord }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<CustomerProfileUpdate>({
    firstName: profile.firstName ?? '',
    lastName: profile.lastName ?? '',
    email: profile.email,
    phone: profile.phone ?? '',
  });

  const clientCode = profile.clientCode || 'PENDING';
  const memberSince = profile.memberSince ? formatOrderDate(profile.memberSince) : 'NOT RECORDED';
  const fullName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim();

  const beginEditing = () => {
    setDraft({
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      email: profile.email,
      phone: profile.phone ?? '',
    });
    setError('');
    setIsEditorOpen(true);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    const result = await updateProfileAction({
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      email: profile.email,
      phone: (draft.phone ?? '').trim(),
    });
    setIsSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setIsEditorOpen(false);
    addToast({ type: 'success', title: 'Profile updated' });
    router.refresh();
  };

  return (
    <section id="client-profile" aria-labelledby="client-profile-heading" className="scroll-mt-28 space-y-5 sm:space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <TechnicalCode>Profile // 05</TechnicalCode>
          <h2 id="client-profile-heading" className="mt-2 font-display text-2xl text-foreground sm:text-3xl">
            Profile
          </h2>
        </div>
        <Button
          type="button"
          variant="outline"
          size="md"
          leftIcon={<PencilLine className="h-3.5 w-3.5" aria-hidden="true" />}
          onClick={beginEditing}
        >
          Edit profile
        </Button>
      </div>

      <div className="border border-border bg-surface p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-background text-foreground-muted" aria-hidden="true">
              <ContactRound className="h-4 w-4" />
            </span>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-foreground-subtle">Account holder</p>
              <p className="mt-1 font-display text-lg text-foreground">
                {fullName || 'Add your name'}
              </p>
            </div>
          </div>
          <span className="border border-border px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.11em] text-foreground-subtle">
            Verified by email
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <ProfileField label="First name" value={displayValue(profile.firstName)} />
          <ProfileField label="Last name" value={displayValue(profile.lastName)} />
          <ProfileField label="Email" value={displayValue(profile.email)} />
          <ProfileField label="Phone" value={displayValue(profile.phone)} />
          <ProfileField label="Client code" value={clientCode} />
          <ProfileField label="Member since" value={memberSince} />
        </dl>
      </div>

      <p className="border-s border-border-strong/50 ps-4 text-[10px] leading-relaxed text-foreground-muted">
        Your email address is your sign-in identity and cannot be changed here. Contact us if you need to move your account to a new address.
      </p>

      <Modal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title="Edit profile"
        code="PROFILE"
        size="md"
        footer={
          <>
            <Button type="button" variant="secondary" size="md" onClick={() => setIsEditorOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="account-profile-form" variant="primary" size="md" isLoading={isSaving}>
              Save changes
            </Button>
          </>
        }
      >
        <form id="account-profile-form" onSubmit={handleSave} className="space-y-4">
          {error && (
            <p role="alert" className="border border-error/40 bg-error/5 p-3 text-small text-error">
              {error}
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="First name" autoComplete="given-name" value={draft.firstName} onChange={(event) => setDraft((current) => ({ ...current, firstName: event.target.value }))} />
            <Input label="Last name" autoComplete="family-name" value={draft.lastName} onChange={(event) => setDraft((current) => ({ ...current, lastName: event.target.value }))} />
            <Input label="Email" type="email" value={profile.email} disabled readOnly />
            <Input label="Phone" type="tel" autoComplete="tel" value={draft.phone ?? ''} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} />
          </div>
        </form>
      </Modal>
    </section>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-b border-border-subtle pb-3">
      <dt className="font-mono text-[8px] uppercase tracking-[0.12em] text-foreground-subtle">{label}</dt>
      <dd className="mt-1.5 break-words text-small text-foreground">{value}</dd>
    </div>
  );
}
