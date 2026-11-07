import { adminGetProducts } from '@/lib/services/supabase/admin';
import { AdminInventoryWorkspace } from '@/components/admin';

export const dynamic = 'force-dynamic';

export default async function AdminInventoryPage() {
  const products = await adminGetProducts();
  return <AdminInventoryWorkspace products={products} />;
}
