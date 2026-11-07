import { adminGetCustomer } from '@/lib/services/supabase/admin';
import { AdminCustomerDossier } from '@/components/admin';

export const dynamic = 'force-dynamic';

export default async function AdminCustomerDossierPage({ params }: { params: { customerId: string } }) {
  const result = await adminGetCustomer(params.customerId);
  return <AdminCustomerDossier customer={result?.customer ?? null} orders={result?.orders ?? []} />;
}
