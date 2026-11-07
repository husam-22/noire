import { adminGetShippingMethods } from '@/lib/services/supabase/admin';
import { getStorefrontContent } from '@/lib/services/supabase/content';
import { getAuthContext } from '@/lib/supabase/auth';
import { AdminSettingsWorkspace } from '@/components/admin';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const [content, shippingMethods, auth] = await Promise.all([
    getStorefrontContent(),
    adminGetShippingMethods(),
    getAuthContext(),
  ]);
  return (
    <AdminSettingsWorkspace
      initial={{
        storeName: content.storeName,
        currency: content.currency,
        supportEmail: content.supportEmail,
        supportPhone: content.supportPhone,
        freeShippingThreshold: content.freeShippingThreshold,
        cashOnDeliveryEnabled: content.cashOnDeliveryEnabled,
        bankTransferEnabled: content.bankTransferEnabled,
        bankTransferInstructions: content.bankTransferInstructions,
      }}
      shippingMethods={shippingMethods}
      adminEmail={auth?.email ?? null}
    />
  );
}
