import { adminGetOrder } from '@/lib/services/supabase/admin';
import { AdminOrderDossier } from '@/components/admin';

export const dynamic = 'force-dynamic';

export default async function AdminOrderDossierPage({ params }: { params: { orderId: string } }) {
  const order = await adminGetOrder(params.orderId);
  return <AdminOrderDossier order={order} />;
}
