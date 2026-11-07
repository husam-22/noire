// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

async function loadEnvModule() {
  vi.resetModules();
  return import('@/lib/env');
}

describe('lib/env', () => {
  beforeEach(() => {
    delete process.env.NOIRE_DATA_SOURCE;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it('defaults to the mock data source', async () => {
    const env = await loadEnvModule();
    expect(env.getDataSource()).toBe('mock');
    expect(env.hasSupabasePublicConfig()).toBe(false);
  });

  it('falls back to mock when supabase is requested without credentials', async () => {
    process.env.NOIRE_DATA_SOURCE = 'supabase';
    const env = await loadEnvModule();
    expect(env.getDataSource()).toBe('mock');
  });

  it('selects supabase when credentials are present', async () => {
    process.env.NOIRE_DATA_SOURCE = 'supabase';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://demo.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';
    const env = await loadEnvModule();
    expect(env.getDataSource()).toBe('supabase');
    expect(env.hasSupabasePublicConfig()).toBe(true);
  });

  it('throws for missing server secrets instead of returning undefined', async () => {
    const env = await loadEnvModule();
    expect(() => env.requireServerEnv('SUPABASE_SERVICE_ROLE_KEY')).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
    expect(env.requireServerEnv('SUPABASE_SERVICE_ROLE_KEY')).toBe('service');
  });
});
