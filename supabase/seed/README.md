# CalibiAI Seed Data

Production-grade seed that turns an empty Supabase project into a
realistic AI-learning platform with **300 users, 20 communities,
400 posts, 2,000 comments, 12,000 likes, 1,500 bookmarks, 600 projects,
a natural follower graph, gamification, leaderboards and 12 months
of historical activity.**

## Layout

```
supabase/seed/
  scripts/                # Deterministic generator + one-shot runners
    generate_seed.py      # Rebuilds every SQL + JSON artifact
    seed_supabase.sh      # psql-based orchestrator (dev)
    seed_supabase.ts      # Node/TS orchestrator using service role
  sql/                    # Ordered SQL, safe to `\i` individually
    00_reset.sql
    01_auth_users.sql
    02_profiles.sql
    ...
    20_recalc.sql
    99_seed_all.sql       # Runs all of the above in a transaction
  json/                   # Same data, snapshot as JSON for tests / mocks
  storage/                # Bucket scaffolding + .gitkeep placeholders
  docs/                   # ER map, FK map, RLS notes, index recs, ...
```

## Prerequisites

1. Run every migration first, **including** the new
   `supabase/migrations/020_seed_support_tables.sql` this seed ships
   with (activity log, missions, login history, weekly stats,
   GitHub snapshot, materialized leaderboards, profile enrichment).
2. Have a service-role connection string handy. The seed writes into
   `auth.users`, which requires elevated privileges.

## One-shot local dev

```bash
# From repo root
supabase db reset                # runs migrations 001..020
cd supabase/seed/scripts
./seed_supabase.sh               # runs 99_seed_all.sql via psql
```

Or with the Supabase JS admin SDK:

```bash
SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=...  \
  npx tsx seed_supabase.ts
```

## Regenerating the data

```bash
cd supabase/seed/scripts
python3 generate_seed.py         # rewrites sql/, json/, docs/
```

The generator is deterministic (seeded RNG), so diffs stay small
across runs.

## Data quality guarantees

- **No Lorem Ipsum** — every string comes from a hand-crafted template
  personalised per user (topic, role, city, college).
- **No duplicate names / usernames / emails / project titles / post titles.**
- **Bell-curve talent scores** and **realistic activity buckets**
  (see `docs/activity_distribution.md`).
- **Deterministic UUIDs** — re-running the generator produces the same
  identifiers, so foreign keys stay stable across seed runs.
