import { adminGetOrders } from '@/lib/services/supabase/admin';
import { AdminOrdersWorkspace } from '@/components/admin';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const orders = await adminGetOrders();
  return <AdminOrdersWorkspace orders={orders} />;
}
