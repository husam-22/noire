'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Check, Mail, MapPin, RotateCcw, ShieldCheck, Store, WalletCards } from 'lucide-react';
import { Badge, Button, Checkbox, Input, TechnicalCode, Textarea, useToast } from '@/components/ui';
import { AdminPageHeader, AdminSurface } from '@/components/admin/admin-primitives';
import { saveAdminSettings } from '@/lib/admin/actions';
import { formatPrice } from '@/lib/utils';
import type { ShippingMethod } from '@/types';

export interface AdminSettingsState {
  storeName: string;
  currency: string;
  supportEmail: string;
  supportPhone: string;
  freeShippingThreshold: number;
  cashOnDeliveryEnabled: boolean;
  bankTransferEnabled: boolean;
  bankTransferInstructions: string;
}

interface AdminSettingsWorkspaceProps {
  initial: AdminSettingsState;
  shippingMethods: ShippingMethod[];
  adminEmail: string | null;
}

export function AdminSettingsWorkspace({ initial, shippingMethods, adminEmail }: AdminSettingsWorkspaceProps) {
  const router = useRouter();
  const t = useTranslations('admin.settings');
  const { addToast } = useToast();
  const [draft, setDraft] = useState<AdminSettingsState>(initial);
  const [threshold, setThreshold] = useState(String(initial.freeShippingThreshold));
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isDirty = useMemo(
    () => JSON.stringify({ ...draft, freeShippingThreshold: Number(threshold) }) !== JSON.stringify(initial),
    [draft, threshold, initial]
  );

  const update = <K extends keyof AdminSettingsState>(key: K, value: AdminSettingsState[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    setSaveError(null);
    const numericThreshold = Number(threshold);
    if (!draft.storeName.trim()) { setSaveError(t('errName')); return; }
    if (!Number.isFinite(numericThreshold) || numericThreshold < 0) { setSaveError(t('errThreshold')); return; }
    if (!draft.cashOnDeliveryEnabled && !draft.bankTransferEnabled) { setSaveError(t('errPayment')); return; }
    if (draft.bankTransferEnabled && !draft.bankTransferInstructions.trim()) { setSaveError(t('errBank')); return; }
    if (draft.supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.supportEmail)) { setSaveError(t('errEmail')); return; }

    setIsSaving(true);
    const result = await saveAdminSettings({
      'store.name': draft.storeName.trim(),
      'store.support_email': draft.supportEmail.trim(),
      'store.support_phone': draft.supportPhone.trim(),
      'store.free_shipping_threshold': numericThreshold,
      'payments.cash_on_delivery_enabled': draft.cashOnDeliveryEnabled,
      'payments.bank_transfer_enabled': draft.bankTransferEnabled,
      'payments.bank_transfer_instructions': draft.bankTransferInstructions.trim(),
    });
    setIsSaving(false);
    if (!result.ok) {
      setSaveError(result.error);
      addToast({ type: 'error', title: t('toastError'), description: result.error });
      return;
    }
    addToast({ type: 'success', title: t('toastSaved'), description: t('toastSavedBody') });
    router.refresh();
  };

  const reset = () => { setDraft(initial); setThreshold(String(initial.freeShippingThreshold)); setSaveError(null); };

  return (
    <main id="main-content" className="min-w-0">
      <AdminPageHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        actions={<><Button type="button" variant="ghost" size="sm" leftIcon={<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />} disabled={!isDirty || isSaving} onClick={reset}>{t('discard')}</Button><Button type="button" variant="primary" size="md" leftIcon={<Check className="h-3.5 w-3.5" aria-hidden="true" />} disabled={!isDirty} isLoading={isSaving} onClick={() => void save()}>{t('save')}</Button></>}
      />
      {saveError && <p role="alert" className="mb-4 border border-danger/30 bg-danger-surface px-3 py-2 text-small text-danger">{saveError}</p>}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SettingsSection icon={<Store className="h-4 w-4" aria-hidden="true" />} code={t('identityCode')} title={t('identityTitle')}>
          <div className="space-y-4">
            <Input label={t('storeName')} value={draft.storeName} onChange={(event) => update('storeName', event.target.value)} required />
            <Input label={t('currency')} value={draft.currency} readOnly hint={t('currencyHint')} />
            <Input label={t('supportEmail')} type="email" value={draft.supportEmail} onChange={(event) => update('supportEmail', event.target.value)} placeholder="care@example.com" hint={t('supportEmailHint')} />
            <Input label={t('supportPhone')} value={draft.supportPhone} onChange={(event) => update('supportPhone', event.target.value)} placeholder="+967 …" />
          </div>
        </SettingsSection>

        <SettingsSection icon={<WalletCards className="h-4 w-4" aria-hidden="true" />} code={t('paymentCode')} title={t('paymentTitle')}>
          <p className="mb-4 text-[10px] leading-relaxed text-foreground-muted">{t('paymentNote')}</p>
          <div className="space-y-3">
            <Checkbox className="min-h-11 items-center" checked={draft.cashOnDeliveryEnabled} onChange={(checked) => update('cashOnDeliveryEnabled', checked)} label={t('cod')} description={t('codDescription')} />
            <Checkbox className="min-h-11 items-center" checked={draft.bankTransferEnabled} onChange={(checked) => update('bankTransferEnabled', checked)} label={t('bank')} description={t('bankDescription')} />
            <Textarea label={t('bankInstructions')} value={draft.bankTransferInstructions} onChange={(event) => update('bankTransferInstructions', event.target.value.slice(0, 600))} rows={5} disabled={!draft.bankTransferEnabled} placeholder={t('bankPlaceholder')} hint={t('bankHint')} />
          </div>
        </SettingsSection>

        <SettingsSection icon={<MapPin className="h-4 w-4" aria-hidden="true" />} code={t('shippingCode')} title={t('shippingTitle')}>
          <div className="mb-4"><Input label={t('freeAbove')} type="number" min="0" step="1" value={threshold} onChange={(event) => setThreshold(event.target.value)} hint={t('freeAboveHint')} /></div>
          <div className="mb-2 flex items-center justify-between gap-3"><span className="font-mono text-[9px] uppercase tracking-[0.1em] text-foreground-subtle">{t('shippingMethods')}</span><Badge variant="outline">{t('activeCount', { count: shippingMethods.length })}</Badge></div>
          {shippingMethods.length ? (
            <ul className="divide-y divide-border border-y border-border">
              {shippingMethods.map((method) => <li key={method.id} className="flex flex-wrap items-start justify-between gap-3 py-3"><span className="min-w-0"><span className="block text-small text-foreground">{method.name}</span><span className="mt-1 block text-[10px] text-foreground-muted">{method.description}</span><span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">{method.carrier} · {method.estimatedWindow}</span></span><span className="font-mono text-[10px] tabular-nums text-foreground">{method.baseCost === 0 ? t('free') : formatPrice(method.baseCost)}</span></li>)}
            </ul>
          ) : <p className="text-small text-foreground-muted">{t('noMethods')}</p>}
          <p className="mt-3 text-[10px] leading-relaxed text-foreground-subtle">{t.rich('methodsNote', { code: (chunks) => <code className="font-mono">{chunks}</code> })}</p>
        </SettingsSection>

        <SettingsSection icon={<Mail className="h-4 w-4" aria-hidden="true" />} code={t('notificationsCode')} title={t('notificationsTitle')}>
          <SettingRow label={t('signInEmails')} value={t('signInEmailsValue')} note={t('signInEmailsNote')} />
          <SettingRow label={t('orderEmails')} value={t('orderEmailsValue')} note={t('orderEmailsNote')} />
          <SettingRow label={t('newsletter')} value={t('newsletterValue')} note={t('newsletterNote')} />
        </SettingsSection>

        <SettingsSection icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />} code={t('accessCode')} title={t('accessTitle')}>
          <SettingRow label={t('signedInAs')} value={adminEmail ?? t('unknown')} note={t('signedInNote')} />
          <SettingRow label={t('data')} value={t('dataValue')} note={t('dataNote')} />
          <SettingRow label={t('roles')} value={t('rolesValue')} note={t('rolesNote')} />
        </SettingsSection>
      </div>
    </main>
  );
}

function SettingsSection({ icon, code, title, children }: { icon: React.ReactNode; code: string; title: string; children: React.ReactNode }) {
  return (
    <AdminSurface className="p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-3 border-b border-border pb-3"><span className="text-accent">{icon}</span><div><TechnicalCode>{code}</TechnicalCode><h2 className="mt-1 font-display text-lg text-foreground">{title}</h2></div></div>
      {children}
    </AdminSurface>
  );
}

function SettingRow({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-border py-3 last:border-0 sm:grid-cols-[minmax(120px,0.7fr)_minmax(0,1fr)] sm:gap-4"><dt className="font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">{label}</dt><dd className="min-w-0"><span className="break-words text-small text-foreground">{value}</span><span className="mt-1 block text-[10px] leading-relaxed text-foreground-muted">{note}</span></dd></div>
  );
}
