import { adminGetCustomers } from '@/lib/services/supabase/admin';
import { AdminCustomersWorkspace } from '@/components/admin';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  const customers = await adminGetCustomers();
  return <AdminCustomersWorkspace customers={customers} />;
}
