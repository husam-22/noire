'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MapPin, PencilLine, Plus, Trash2 } from 'lucide-react';
import type { Address } from '@/types';
import type { CustomerAddressInput, CustomerProfileRecord } from '@/lib/account/contracts';
import { deleteAddressAction, saveAddressAction } from '@/lib/actions/account';
import { Button, Checkbox, EmptyState, Input, Modal, TechnicalCode } from '@/components/ui';
import { useToast } from '@/components/ui/toast';

type AddressDraft = Required<Omit<CustomerAddressInput, 'id'>> & { id?: string };

function emptyDraft(profile: CustomerProfileRecord, label: string): AddressDraft {
  return {
    label,
    firstName: profile.firstName ?? '',
    lastName: profile.lastName ?? '',
    company: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phone: profile.phone ?? '',
    isDefaultShipping: false,
    isDefaultBilling: false,
  };
}

function draftFromAddress(address: Address): AddressDraft {
  return {
    id: address.id,
    label: address.label,
    firstName: address.firstName,
    lastName: address.lastName,
    company: address.company ?? '',
    line1: address.line1,
    line2: address.line2 ?? '',
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    phone: address.phone,
    isDefaultShipping: address.isDefaultShipping,
    isDefaultBilling: address.isDefaultBilling,
  };
}

export function AccountAddresses({
  addresses,
  profile,
}: {
  addresses: Address[];
  profile: CustomerProfileRecord;
}) {
  const t = useTranslations('account.addresses');
  const router = useRouter();
  const { addToast } = useToast();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draft, setDraft] = useState<AddressDraft>(() => emptyDraft(profile, t('defaultLabel')));
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openCreate = () => {
    setDraft({ ...emptyDraft(profile, t('defaultLabel')), isDefaultShipping: addresses.length === 0, isDefaultBilling: addresses.length === 0 });
    setError('');
    setIsEditorOpen(true);
  };

  const openEdit = (address: Address) => {
    setDraft(draftFromAddress(address));
    setError('');
    setIsEditorOpen(true);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    const payload: CustomerAddressInput = {
      ...draft,
      label: draft.label.trim() || t('fallbackLabel'),
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      company: draft.company.trim() || undefined,
      line1: draft.line1.trim(),
      line2: draft.line2.trim() || undefined,
      city: draft.city.trim(),
      state: draft.state.trim(),
      postalCode: draft.postalCode.trim(),
      country: draft.country.trim(),
      phone: draft.phone.trim(),
    };
    const result = await saveAddressAction(payload);
    setIsSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setIsEditorOpen(false);
    addToast({
      type: 'success',
      title: draft.id ? t('toastUpdated') : t('toastSaved'),
      description: t('toastBody'),
    });
    router.refresh();
  };

  const handleDelete = async (address: Address) => {
    if (!window.confirm(t('confirmRemove', { label: address.label }))) return;
    setDeletingId(address.id);
    const result = await deleteAddressAction(address.id);
    setDeletingId(null);
    if (!result.ok) {
      addToast({ type: 'error', title: t('toastRemoveFailed'), description: result.error });
      return;
    }
    addToast({ type: 'info', title: t('toastRemoved') });
    router.refresh();
  };

  return (
    <section id="delivery-register" aria-labelledby="delivery-register-heading" className="scroll-mt-28 space-y-5 sm:space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <TechnicalCode>{t('code')}</TechnicalCode>
          <h2 id="delivery-register-heading" className="mt-2 font-display text-2xl text-foreground sm:text-3xl">
            {t('title')}
          </h2>
          <p className="mt-2 max-w-2xl text-small leading-relaxed text-foreground-muted">
            {t('intro')}
          </p>
        </div>
        <Button type="button" variant="outline" size="md" leftIcon={<Plus className="h-3.5 w-3.5" aria-hidden="true" />} onClick={openCreate}>
          {t('add')}
        </Button>
      </div>

      {addresses.length > 0 ? (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id} className="flex min-w-0 flex-col border border-border bg-surface p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
                <div className="min-w-0">
                  <TechnicalCode>{address.label}</TechnicalCode>
                  <p className="mt-1.5 break-words font-display text-base text-foreground">
                    {address.firstName} {address.lastName}
                  </p>
                </div>
                <MapPin className="h-4 w-4 shrink-0 text-foreground-subtle" aria-hidden="true" />
              </div>
              <address className="mt-3 flex-1 not-italic text-small leading-relaxed text-foreground-muted">
                {address.company && <span className="block">{address.company}</span>}
                <span className="block break-words">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ''}
                </span>
                <span className="block break-words">
                  {[address.city, address.state, address.postalCode].filter(Boolean).join(', ')}
                </span>
                <span className="block">{address.country}</span>
                {address.phone && <span className="mt-1 block font-mono text-[10px]">{address.phone}</span>}
              </address>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                {address.isDefaultShipping && (
                  <span className="border border-accent/40 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-accent">{t('defaultShipping')}</span>
                )}
                {address.isDefaultBilling && (
                  <span className="border border-border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-muted">{t('defaultBilling')}</span>
                )}
                <span className="ms-auto flex items-center gap-1">
                  <Button type="button" variant="ghost" size="sm" leftIcon={<PencilLine className="h-3 w-3" aria-hidden="true" />} onClick={() => openEdit(address)}>
                    {t('edit')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    isLoading={deletingId === address.id}
                    leftIcon={<Trash2 className="h-3 w-3" aria-hidden="true" />}
                    onClick={() => handleDelete(address)}
                  >
                    {t('remove')}
                  </Button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          code={t('emptyCode')}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
          primaryAction={<Button type="button" variant="secondary" size="md" onClick={openCreate}>{t('add')}</Button>}
          className="p-5 sm:p-8"
        />
      )}

      <Modal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={draft.id ? t('editTitle') : t('addTitle')}
        code={t('modalCode')}
        size="lg"
        footer={
          <>
            <Button type="button" variant="secondary" size="md" onClick={() => setIsEditorOpen(false)}>{t('cancel')}</Button>
            <Button type="submit" form="account-address-form" variant="primary" size="md" isLoading={isSaving}>
              {t('save')}
            </Button>
          </>
        }
      >
        <form id="account-address-form" onSubmit={handleSave} className="space-y-5">
          {error && (
            <p role="alert" className="border border-error/40 bg-error/5 p-3 text-small text-error">
              {error}
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={t('fields.label')} value={draft.label} onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))} />
            <Input label={t('fields.phone')} type="tel" autoComplete="tel" value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} />
            <Input label={t('fields.firstName')} autoComplete="given-name" value={draft.firstName} onChange={(event) => setDraft((current) => ({ ...current, firstName: event.target.value }))} />
            <Input label={t('fields.lastName')} autoComplete="family-name" value={draft.lastName} onChange={(event) => setDraft((current) => ({ ...current, lastName: event.target.value }))} />
            <Input label={t('fields.company')} autoComplete="organization" value={draft.company} onChange={(event) => setDraft((current) => ({ ...current, company: event.target.value }))} />
            <Input label={t('fields.country')} autoComplete="country-name" value={draft.country} onChange={(event) => setDraft((current) => ({ ...current, country: event.target.value }))} />
            <Input label={t('fields.line1')} autoComplete="address-line1" value={draft.line1} onChange={(event) => setDraft((current) => ({ ...current, line1: event.target.value }))} />
            <Input label={t('fields.line2')} autoComplete="address-line2" value={draft.line2} onChange={(event) => setDraft((current) => ({ ...current, line2: event.target.value }))} />
            <Input label={t('fields.city')} autoComplete="address-level2" value={draft.city} onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))} />
            <Input label={t('fields.state')} autoComplete="address-level1" value={draft.state} onChange={(event) => setDraft((current) => ({ ...current, state: event.target.value }))} />
            <Input label={t('fields.postalCode')} autoComplete="postal-code" value={draft.postalCode} onChange={(event) => setDraft((current) => ({ ...current, postalCode: event.target.value }))} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Checkbox
              checked={draft.isDefaultShipping}
              onChange={(checked) => setDraft((current) => ({ ...current, isDefaultShipping: checked }))}
              label={t('fields.defaultShipping')}
              className="min-h-11 border border-border p-3"
            />
            <Checkbox
              checked={draft.isDefaultBilling}
              onChange={(checked) => setDraft((current) => ({ ...current, isDefaultBilling: checked }))}
              label={t('fields.defaultBilling')}
              className="min-h-11 border border-border p-3"
            />
          </div>
        </form>
      </Modal>
    </section>
  );
}
