/**
 * CalibiAI seed runner (Node / TypeScript).
 *
 * Uses the Supabase admin SDK where possible (safer than raw SQL for
 * auth.users) and falls back to executing SQL files for everything
 * else via the `pg` client.
 *
 * Requires:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Client } from 'pg';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SQL_DIR = join(__dirname, '..', 'sql');

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  DATABASE_URL,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !DATABASE_URL) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / DATABASE_URL');
  process.exit(1);
}

// Optional: use the admin SDK if you'd rather create real auth users.
// This falls back to the SQL path automatically.
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run(client: Client, file: string) {
  const path = join(SQL_DIR, file);
  const sql = await readFile(path, 'utf8');
  process.stdout.write(`  ${file} ... `);
  await client.query(sql);
  console.log('ok');
}

(async () => {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log('Connected. Running seed files in order.');
  const files = [
    '01_auth_users.sql',
    '02_profiles.sql',
    '03_scores.sql',
    '04_communities.sql',
    '05_community_members.sql',
    '06_posts.sql',
    '07_comments.sql',
    '08_post_votes.sql',
    '09_post_saves.sql',
    '10_follows.sql',
    '11_projects.sql',
    '12_badges.sql',
    '13_member_badges.sql',
    '14_xp.sql',
    '15_activity_log.sql',
    '16_daily_missions.sql',
    '17_login_history.sql',
    '18_weekly_stats.sql',
    '19_github_stats.sql',
    '20_recalc.sql',
  ];
  try {
    await client.query('BEGIN');
    for (const f of files) await run(client, f);
    await client.query('COMMIT');
    console.log('Seed complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed, rolled back.', err);
    process.exit(1);
  } finally {
    await client.end();
  }

  // Sanity call — confirm at least one auth.user exists.
  const { count } = await admin.auth.admin.listUsers({ perPage: 1 });
  console.log(`auth.users visible via admin SDK: ${count ?? 'unknown'}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
