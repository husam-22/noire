// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

async function loadEnvModule() {
  vi.resetModules();
  return import('@/lib/env');
}

describe('lib/env', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it('reports missing public Supabase config and fails closed', async () => {
    const env = await loadEnvModule();
    expect(env.hasSupabasePublicConfig()).toBe(false);
    expect(() => env.assertSupabaseConfigured()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it('accepts a configured Supabase project', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';
    const env = await loadEnvModule();
    expect(env.hasSupabasePublicConfig()).toBe(true);
    expect(() => env.assertSupabaseConfigured()).not.toThrow();
  });

  it('ignores blank credentials', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = '   ';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
    const env = await loadEnvModule();
    expect(env.hasSupabasePublicConfig()).toBe(false);
  });

  it('throws for missing server secrets instead of returning undefined', async () => {
    const env = await loadEnvModule();
    expect(() => env.requireServerEnv('SUPABASE_SERVICE_ROLE_KEY')).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
    expect(env.requireServerEnv('SUPABASE_SERVICE_ROLE_KEY')).toBe('service');
  });
});
