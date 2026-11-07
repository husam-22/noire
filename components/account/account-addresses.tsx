'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, PencilLine, Plus, Trash2 } from 'lucide-react';
import type { Address } from '@/types';
import type { CustomerAddressInput, CustomerProfileRecord } from '@/lib/account/contracts';
import { deleteAddressAction, saveAddressAction } from '@/lib/actions/account';
import { Button, Checkbox, EmptyState, Input, Modal, TechnicalCode } from '@/components/ui';
import { useToast } from '@/components/ui/toast';

type AddressDraft = Required<Omit<CustomerAddressInput, 'id'>> & { id?: string };

function emptyDraft(profile: CustomerProfileRecord): AddressDraft {
  return {
    label: 'Home',
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
  const router = useRouter();
  const { addToast } = useToast();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draft, setDraft] = useState<AddressDraft>(() => emptyDraft(profile));
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openCreate = () => {
    setDraft({ ...emptyDraft(profile), isDefaultShipping: addresses.length === 0, isDefaultBilling: addresses.length === 0 });
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
      label: draft.label.trim() || 'Address',
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
      title: draft.id ? 'Address updated' : 'Address saved',
      description: 'Your address book has been updated.',
    });
    router.refresh();
  };

  const handleDelete = async (address: Address) => {
    if (!window.confirm(`Remove the address "${address.label}"?`)) return;
    setDeletingId(address.id);
    const result = await deleteAddressAction(address.id);
    setDeletingId(null);
    if (!result.ok) {
      addToast({ type: 'error', title: 'Could not remove address', description: result.error });
      return;
    }
    addToast({ type: 'info', title: 'Address removed' });
    router.refresh();
  };

  return (
    <section id="delivery-register" aria-labelledby="delivery-register-heading" className="scroll-mt-28 space-y-5 sm:space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <TechnicalCode>Address book // 04</TechnicalCode>
          <h2 id="delivery-register-heading" className="mt-2 font-display text-2xl text-foreground sm:text-3xl">
            Delivery Addresses
          </h2>
          <p className="mt-2 max-w-2xl text-small leading-relaxed text-foreground-muted">
            Saved addresses are kept on your account and offered at checkout. Your default address is pre-selected.
          </p>
        </div>
        <Button type="button" variant="outline" size="md" leftIcon={<Plus className="h-3.5 w-3.5" aria-hidden="true" />} onClick={openCreate}>
          Add address
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
                  <span className="border border-accent/40 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-accent">Default shipping</span>
                )}
                {address.isDefaultBilling && (
                  <span className="border border-border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-muted">Default billing</span>
                )}
                <span className="ms-auto flex items-center gap-1">
                  <Button type="button" variant="ghost" size="sm" leftIcon={<PencilLine className="h-3 w-3" aria-hidden="true" />} onClick={() => openEdit(address)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    isLoading={deletingId === address.id}
                    leftIcon={<Trash2 className="h-3 w-3" aria-hidden="true" />}
                    onClick={() => handleDelete(address)}
                  >
                    Remove
                  </Button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          code="ADDRESS BOOK // EMPTY"
          title="No saved addresses."
          description="Add a delivery address to speed up checkout. You can keep several and choose a default."
          icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
          primaryAction={<Button type="button" variant="secondary" size="md" onClick={openCreate}>Add address</Button>}
          className="p-5 sm:p-8"
        />
      )}

      <Modal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={draft.id ? 'Edit address' : 'Add address'}
        code="ADDRESS BOOK"
        size="lg"
        footer={
          <>
            <Button type="button" variant="secondary" size="md" onClick={() => setIsEditorOpen(false)}>Cancel</Button>
            <Button type="submit" form="account-address-form" variant="primary" size="md" isLoading={isSaving}>
              Save address
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
            <Input label="Label (Home, Studio…)" value={draft.label} onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))} />
            <Input label="Phone" type="tel" autoComplete="tel" value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} />
            <Input label="First name" autoComplete="given-name" value={draft.firstName} onChange={(event) => setDraft((current) => ({ ...current, firstName: event.target.value }))} />
            <Input label="Last name" autoComplete="family-name" value={draft.lastName} onChange={(event) => setDraft((current) => ({ ...current, lastName: event.target.value }))} />
            <Input label="Company (optional)" autoComplete="organization" value={draft.company} onChange={(event) => setDraft((current) => ({ ...current, company: event.target.value }))} />
            <Input label="Country / region" autoComplete="country-name" value={draft.country} onChange={(event) => setDraft((current) => ({ ...current, country: event.target.value }))} />
            <Input label="Street address" autoComplete="address-line1" value={draft.line1} onChange={(event) => setDraft((current) => ({ ...current, line1: event.target.value }))} />
            <Input label="Address line 2 (optional)" autoComplete="address-line2" value={draft.line2} onChange={(event) => setDraft((current) => ({ ...current, line2: event.target.value }))} />
            <Input label="City" autoComplete="address-level2" value={draft.city} onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))} />
            <Input label="State / province / region" autoComplete="address-level1" value={draft.state} onChange={(event) => setDraft((current) => ({ ...current, state: event.target.value }))} />
            <Input label="Postal code" autoComplete="postal-code" value={draft.postalCode} onChange={(event) => setDraft((current) => ({ ...current, postalCode: event.target.value }))} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Checkbox
              checked={draft.isDefaultShipping}
              onChange={(checked) => setDraft((current) => ({ ...current, isDefaultShipping: checked }))}
              label="Default shipping address"
              className="min-h-11 border border-border p-3"
            />
            <Checkbox
              checked={draft.isDefaultBilling}
              onChange={(checked) => setDraft((current) => ({ ...current, isDefaultBilling: checked }))}
              label="Default billing address"
              className="min-h-11 border border-border p-3"
            />
          </div>
        </form>
      </Modal>
    </section>
  );
}
