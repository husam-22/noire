import 'server-only';

import { cache } from 'react';
import { createSupabaseServerClient } from './server';
import type { Database } from '@/types/supabase';

export type AppRole = Database['public']['Enums']['app_role'];

export interface AuthContext {
  userId: string;
  email: string | null;
  role: AppRole;
}

/**
 * Resolves the signed-in user and their role for the current request.
 * Memoised per request via React `cache` so layouts, pages, and actions share one lookup.
 */
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const claimRole = (user.app_metadata?.role as AppRole | undefined) ?? 'customer';
  return { userId: user.id, email: user.email ?? null, role: claimRole };
});

export class UnauthorizedError extends Error {
  constructor(message = 'Authentication required.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Insufficient privileges.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/** Throws unless the current request is authenticated. */
export async function requireUser(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) throw new UnauthorizedError();
  return ctx;
}

/** Throws unless the current request belongs to staff or an admin. Use in every admin server action. */
export async function requireStaff(): Promise<AuthContext> {
  const ctx = await requireUser();
  if (ctx.role !== 'admin' && ctx.role !== 'staff') throw new ForbiddenError();
  return ctx;
}

export async function requireAdmin(): Promise<AuthContext> {
  const ctx = await requireUser();
  if (ctx.role !== 'admin') throw new ForbiddenError();
  return ctx;
}
