/**
 * NOIRÉ — service layer entrypoint (server only).
 *
 * All reads and writes go to Supabase. Server Components should prefer
 * `@/lib/services/localized` (locale-aware catalog copy); Client Components
 * must go through the server actions in `@/lib/actions/*`.
 */
import 'server-only';

export * from '@/lib/services/supabase/catalog';
export * from '@/lib/services/supabase/journal';
export * from '@/lib/services/supabase/content';
export * from '@/lib/services/supabase/commerce';
export * from '@/lib/services/supabase/search';
