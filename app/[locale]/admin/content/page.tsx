import { adminGetJournalArticles, adminGetProducts } from '@/lib/services/supabase/admin';
import { getCollections } from '@/lib/services/supabase/catalog';
import { getStorefrontContent } from '@/lib/services/supabase/content';
import { AdminContentWorkspace } from '@/components/admin';

export const dynamic = 'force-dynamic';

export default async function AdminContentPage() {
  const [collections, products, articles, content] = await Promise.all([
    getCollections(),
    adminGetProducts(),
    adminGetJournalArticles(),
    getStorefrontContent(),
  ]);
  return (
    <AdminContentWorkspace
      collections={collections}
      products={products}
      articles={articles}
      initial={{
        announcement: content.announcement,
        featuredCollectionId: content.featuredCollectionId ?? collections[0]?.id ?? null,
        featuredProductIds: products.filter((product) => product.featured).map((product) => product.id),
        featuredArticleIds: articles.filter((article) => article.featured).map((article) => article.id),
      }}
    />
  );
}
