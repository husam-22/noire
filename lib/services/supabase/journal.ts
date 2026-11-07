import 'server-only';

import type { JournalArticle } from '@/types';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { toServiceError } from '@/lib/commerce/errors';
import { mapJournalArticle } from './mappers';

export async function getJournalArticles(limit = 12): Promise<JournalArticle[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('journal_articles')
    .select('*')
    .eq('status', 'active')
    .order('featured', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) throw toServiceError(error);
  return (data ?? []).map(mapJournalArticle);
}

export async function getJournalArticleBySlug(slugOrId: string): Promise<JournalArticle | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('journal_articles')
    .select('*')
    .eq('status', 'active')
    .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
    .limit(1)
    .maybeSingle();
  if (error) throw toServiceError(error);
  return data ? mapJournalArticle(data) : null;
}
