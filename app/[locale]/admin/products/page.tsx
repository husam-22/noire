import { adminGetProducts } from '@/lib/services/supabase/admin';
import { getCategories } from '@/lib/services/supabase/catalog';
import { AdminProductsWorkspace } from '@/components/admin';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([adminGetProducts(), getCategories()]);
  return <AdminProductsWorkspace products={products} categories={categories} />;
}
