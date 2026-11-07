import { adminGetDiscounts } from '@/lib/services/supabase/admin';
import { AdminDiscountsWorkspace } from '@/components/admin';

export const dynamic = 'force-dynamic';

export default async function AdminDiscountsPage() {
  const discounts = await adminGetDiscounts();
  return <AdminDiscountsWorkspace discounts={discounts} />;
}
