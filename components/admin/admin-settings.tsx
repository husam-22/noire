'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    if (!draft.storeName.trim()) { setSaveError('Enter a store name.'); return; }
    if (!Number.isFinite(numericThreshold) || numericThreshold < 0) { setSaveError('Enter a valid free-shipping threshold (0 disables it).'); return; }
    if (!draft.cashOnDeliveryEnabled && !draft.bankTransferEnabled) { setSaveError('Keep at least one payment method enabled.'); return; }
    if (draft.bankTransferEnabled && !draft.bankTransferInstructions.trim()) { setSaveError('Add bank transfer instructions so customers know where to send payment.'); return; }
    if (draft.supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.supportEmail)) { setSaveError('Enter a valid support email address.'); return; }

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
      addToast({ type: 'error', title: 'Could not save settings', description: result.error });
      return;
    }
    addToast({ type: 'success', title: 'Settings saved', description: 'Checkout and the storefront use the new values immediately.' });
    router.refresh();
  };

  const reset = () => { setDraft(initial); setThreshold(String(initial.freeShippingThreshold)); setSaveError(null); };

  return (
    <main id="main-content" className="min-w-0">
      <AdminPageHeader
        eyebrow="OPERATIONS // 07 · SETTINGS"
        title="Store settings"
        description="Store identity, payment methods and shipping. Saved values apply to the live storefront."
        actions={<><Button type="button" variant="ghost" size="sm" leftIcon={<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />} disabled={!isDirty || isSaving} onClick={reset}>Discard</Button><Button type="button" variant="primary" size="md" leftIcon={<Check className="h-3.5 w-3.5" aria-hidden="true" />} disabled={!isDirty} isLoading={isSaving} onClick={() => void save()}>Save settings</Button></>}
      />
      {saveError && <p role="alert" className="mb-4 border border-danger/30 bg-danger-surface px-3 py-2 text-small text-danger">{saveError}</p>}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SettingsSection icon={<Store className="h-4 w-4" aria-hidden="true" />} code="STORE // IDENTITY" title="Store identity">
          <div className="space-y-4">
            <Input label="Store name" value={draft.storeName} onChange={(event) => update('storeName', event.target.value)} required />
            <Input label="Currency" value={draft.currency} readOnly hint="All prices and orders are recorded in this currency." />
            <Input label="Support email" type="email" value={draft.supportEmail} onChange={(event) => update('supportEmail', event.target.value)} placeholder="care@example.com" hint="Shown to customers on confirmations and in their account." />
            <Input label="Support phone / WhatsApp" value={draft.supportPhone} onChange={(event) => update('supportPhone', event.target.value)} placeholder="+967 …" />
          </div>
        </SettingsSection>

        <SettingsSection icon={<WalletCards className="h-4 w-4" aria-hidden="true" />} code="CHECKOUT // PAYMENT" title="Payment methods">
          <p className="mb-4 text-[10px] leading-relaxed text-foreground-muted">No card processor is connected. Customers choose one of the methods below at checkout and you confirm payment from the order page.</p>
          <div className="space-y-3">
            <Checkbox className="min-h-11 items-center" checked={draft.cashOnDeliveryEnabled} onChange={(checked) => update('cashOnDeliveryEnabled', checked)} label="Cash on delivery" description="The courier collects payment when the order is handed over." />
            <Checkbox className="min-h-11 items-center" checked={draft.bankTransferEnabled} onChange={(checked) => update('bankTransferEnabled', checked)} label="Bank transfer" description="Customers transfer the total and quote their order number as reference." />
            <Textarea label="Bank transfer instructions" value={draft.bankTransferInstructions} onChange={(event) => update('bankTransferInstructions', event.target.value.slice(0, 600))} rows={5} disabled={!draft.bankTransferEnabled} placeholder={'Bank name\nAccount name\nIBAN / account number\nAny note for the customer'} hint="Shown on the order confirmation page and in the customer's account for bank-transfer orders." />
          </div>
        </SettingsSection>

        <SettingsSection icon={<MapPin className="h-4 w-4" aria-hidden="true" />} code="FULFILLMENT // SHIPPING" title="Shipping">
          <div className="mb-4"><Input label="Free shipping above (USD)" type="number" min="0" step="1" value={threshold} onChange={(event) => setThreshold(event.target.value)} hint="Orders at or above this subtotal ship free. Set 0 to disable." /></div>
          <div className="mb-2 flex items-center justify-between gap-3"><span className="font-mono text-[9px] uppercase tracking-[0.1em] text-foreground-subtle">Shipping methods</span><Badge variant="outline">{shippingMethods.length} active</Badge></div>
          {shippingMethods.length ? (
            <ul className="divide-y divide-border border-y border-border">
              {shippingMethods.map((method) => <li key={method.id} className="flex flex-wrap items-start justify-between gap-3 py-3"><span className="min-w-0"><span className="block text-small text-foreground">{method.name}</span><span className="mt-1 block text-[10px] text-foreground-muted">{method.description}</span><span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.1em] text-foreground-subtle">{method.carrier} · {method.estimatedWindow}</span></span><span className="font-mono text-[10px] tabular-nums text-foreground">{method.baseCost === 0 ? 'Free' : formatPrice(method.baseCost)}</span></li>)}
            </ul>
          ) : <p className="text-small text-foreground-muted">No shipping methods configured — checkout cannot complete until one exists.</p>}
          <p className="mt-3 text-[10px] leading-relaxed text-foreground-subtle">Shipping methods are managed in the database (table <code className="font-mono">shipping_methods</code>). Tracking numbers are entered per order when you mark it as shipped.</p>
        </SettingsSection>

        <SettingsSection icon={<Mail className="h-4 w-4" aria-hidden="true" />} code="NOTIFICATIONS" title="Email & notifications">
          <SettingRow label="Sign-in emails" value="Supabase Auth" note="Magic links are delivered by the Supabase project's email service. Configure custom SMTP in the Supabase dashboard for higher volume." />
          <SettingRow label="Order emails" value="Not configured" note="Order confirmations are shown on-site and in the customer's account. Transactional email can be added later." />
          <SettingRow label="Newsletter" value="Stored in the database" note="Sign-ups from the Private Dispatch form are saved to the newsletter_subscribers table." />
        </SettingsSection>

        <SettingsSection icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />} code="ACCESS" title="Access & security">
          <SettingRow label="Signed in as" value={adminEmail ?? 'Unknown'} note="Admin access requires the admin or staff role on the profile." />
          <SettingRow label="Data" value="Supabase Postgres" note="Every page of the site reads and writes the production database. Row-level security scopes customers to their own data." />
          <SettingRow label="Roles" value="customer · staff · admin" note="Promote accounts by setting profiles.role; the change applies after the user signs in again." />
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
