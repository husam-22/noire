import 'server-only';

import type { SearchSuggestionResult } from '@/types';
import type { Enums } from '@/types/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { toServiceError } from '@/lib/commerce/errors';
import { getCategories, getCollections, getFeaturedProducts, getProducts } from './catalog';
import { getJournalArticles } from './journal';
import { mapJournalArticle } from './mappers';

type Locale = Enums<'locale_code'>;

function escapeLike(value: string): string {
  return value.replace(/[%_\\,.()]/g, (match) => `\\${match}`);
}

/** Global search across products (full-text), categories, collections and journal articles. */
export async function searchCatalog(query: string, locale: Locale = 'en'): Promise<SearchSuggestionResult> {
  const q = query.trim();
  if (!q) {
    const [products, categories, collections, articles] = await Promise.all([
      getFeaturedProducts(4, locale),
      getCategories(locale),
      getCollections(locale),
      getJournalArticles(2),
    ]);
    return { query: '', products, categories: categories.slice(0, 4), collections: collections.slice(0, 2), articles, totalMatches: 0 };
  }

  const supabase = createSupabaseServerClient();
  const pattern = `%${escapeLike(q.toLowerCase())}%`;
  const [productPage, categories, collections, articleRows] = await Promise.all([
    getProducts({ query: q, limit: 8 }, locale),
    getCategories(locale),
    getCollections(locale),
    supabase
      .from('journal_articles')
      .select('*')
      .eq('status', 'active')
      .or(`title.ilike.${pattern},category.ilike.${pattern},excerpt.ilike.${pattern}`)
      .limit(4),
  ]);
  if (articleRows.error) throw toServiceError(articleRows.error);

  const needle = q.toLowerCase();
  const matchedCategories = categories.filter(
    (c) => c.name.toLowerCase().includes(needle) || c.description.toLowerCase().includes(needle)
  );
  const matchedCollections = collections.filter(
    (c) => c.title.toLowerCase().includes(needle) || c.subtitle.toLowerCase().includes(needle)
  );
  const articles = (articleRows.data ?? []).map(mapJournalArticle);

  return {
    query: q,
    products: productPage.items,
    categories: matchedCategories,
    collections: matchedCollections,
    articles,
    totalMatches: productPage.total + matchedCategories.length + matchedCollections.length + articles.length,
  };
}
