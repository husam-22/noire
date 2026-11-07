import { adminGetProduct } from '@/lib/services/supabase/admin';
import { getCategories } from '@/lib/services/supabase/catalog';
import { AdminProductEditor } from '@/components/admin';

export const dynamic = 'force-dynamic';

export default async function AdminProductEditorPage({ params }: { params: { productId: string } }) {
  const isNew = params.productId === 'new';
  const [product, categories] = await Promise.all([
    isNew ? Promise.resolve(null) : adminGetProduct(params.productId),
    getCategories(),
  ]);
  // `null` = new product draft; `undefined` = requested product does not exist.
  const initialProduct = isNew ? null : product ?? undefined;
  return <AdminProductEditor initialProduct={initialProduct} categories={categories} />;
}
