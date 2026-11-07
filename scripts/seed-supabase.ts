/**
 * NOIRÉ — Supabase seed.
 *
 * Loads the fixture catalog (products, categories, collections, journal,
 * shipping methods, demo discounts) plus the Arabic catalog translations from
 * `messages/ar.json` into a Supabase project. Idempotent: every write is an
 * upsert keyed on the fixture id, so it is safe to re-run after editing fixtures.
 *
 * Usage:
 *   cp .env.example .env.local   # fill NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *   npm run db:seed
 *
 * No service-role key at hand? `npm run db:seed:sql` writes the same data as
 * idempotent SQL (supabase/seed.sql) you can paste into the SQL Editor.
 *
 * Optional: SEED_ADMIN_EMAIL=you@example.com promotes that (already signed-up)
 * user to the `admin` role.
 */
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { buildSeedBatches } from './seed-rows';

loadEnv({ path: '.env.local' });
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('✖ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (see .env.example).');
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`→ Seeding ${url}`);

  // 1–7. Catalog, relations, translations, journal, shipping, discounts, settings (FK-safe order).
  for (const batch of buildSeedBatches()) {
    if (batch.rows.length === 0) {
      console.log(`– ${batch.table} (nothing to seed)`);
      continue;
    }
    // Each batch is homogeneous; the union table name defeats supabase-js' generics, hence the cast.
    const table = supabase.from(batch.table as 'settings');
    const { error } = await table.upsert(batch.rows as never, { onConflict: batch.conflict });
    if (error) throw new Error(`${batch.table} failed: ${error.message}`);
    console.log(`✔ ${batch.table} (${batch.rows.length})`);
  }

  // 8. Optional admin promotion
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('email', adminEmail)
      .select('id');
    if (error) throw error;
    if (!data?.length) {
      console.warn(`⚠ SEED_ADMIN_EMAIL=${adminEmail} has no profile yet — sign up once, then re-run the seed.`);
    } else {
      console.log(`✔ promoted ${adminEmail} to admin`);
    }
  }

  console.log('✓ Seed complete.');
}

main().catch((error) => {
  console.error('✖ Seed failed:', error);
  process.exit(1);
});
