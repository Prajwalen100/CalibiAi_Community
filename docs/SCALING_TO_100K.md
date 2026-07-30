# CalibiAI Community — System Design: 0 → 100K Users

> A deep-dive plan to fix the community-page latency and prepare the platform
> to serve 100,000 monthly active users without re-architecting.

---

## 1. Diagnosis: Why every Community page is slow right now

Looking at the screenshot — `localhost:3000/community/showcase` shows the breadcrumb but a blank body (the page is still waiting on data). The root cause is structural, not a missing migration.

### What every request is doing today

```
User → Next.js (Vercel/Node)
       └─ /community/layout.tsx        force-dynamic, runs 5 SQL queries
       └─ /community/showcase/page.tsx force-dynamic, runs 1 SQL query
       └─ PostCard.map → N more queries per card (attachCommunityProfiles, mappers)
       └─ Total: 6–15 Supabase round-trips, every request, no cache, no CDN
```

Hard evidence in the code:

| File | Issue |
| --- | --- |
| `app/community/layout.tsx:13` | `export const dynamic = "force-dynamic"` on the shared layout. |
| `app/community/showcase/page.tsx:11` | `export const dynamic = "force-dynamic"`. |
| `app/community/{ask,challenges,communities,events,jobs,leaderboard,...}/page.tsx` | Same — **80 pages** in `app/community/**` are force-dynamic. |
| `app/community/layout.tsx:42–88` | Layout runs `getUser()` + `profiles` + 4 parallel queries on every request. |
| `app/community/layout.tsx:69–83` | Each `attachCommunityProfiles` does an extra N-row `profiles` lookup. |

### What this means at 100K users

If 100K users open **one community page per day** (a conservative floor for an active social feed), the per-day volume is:

| Tier | Estimated volume | Today (force-dynamic) | Implied Postgres QPS |
| --- | --- | --- | --- |
| 0 → 1K DAU (now) | ~1K page views/day | 6–15 queries each | ~0.1 QPS — fine |
| 1K → 10K DAU | ~50K page views/day | same | ~5 QPS avg, ~30 QPS peak |
| 10K → 100K DAU | ~500K page views/day | same | ~50 QPS avg, **~300 QPS peak** |

**Postgres on Supabase free/pro tier tops out at ~100–200 QPS for `select`s with joins.** The system as written will saturate the DB long before 100K MAU.

The current design also has a **N+1 fan-out** in the feed: each post triggers a profile lookup, so 30 posts = 31 queries. The leaderboard sidebar query (`comm_xp order by xp desc limit 5`) and the events query are also unindexed hot paths at scale.

---

## 2. Target architecture (0 → 100K MAU, ~10K DAU peak)

A pragmatic single-region architecture that doesn't require Kubernetes. All components are either Supabase-managed, Vercel-managed, or single-purpose Next.js route handlers.

```
                     ┌────────────────────────┐
                     │  Users (browser)       │
                     │  + React hydration     │
                     └──────────┬─────────────┘
                                │  TLS
                  ┌─────────────▼──────────────┐
                  │  Vercel Edge / CDN         │  ← static + ISR + auth-gated HTML
                  │  (Next.js App Router)      │
                  └─────────────┬──────────────┘
                                │  signed JWT
            ┌───────────────────┼──────────────────────────┐
            │                   │                          │
   ┌────────▼────────┐  ┌───────▼─────────┐  ┌─────────────▼────────────┐
   │  Vercel         │  │  Upstash Redis  │  │  Supabase (Postgres +    │
   │  Serverless     │  │  (cache,        │  │  Auth + Storage + RLS)   │
   │  Functions      │  │  rate limits,   │  │                          │
   │  (Node runtime) │  │  pub/sub,       │  │  - pgbouncer (6543)      │
   └────────┬────────┘  │  leaderboard    │  │  - read replica (5432)   │
            │           │  ZSETs)         │  │  - storage (S3-backed)   │
            │           └───────┬─────────┘  └────────────┬─────────────┘
            │                   │                         │
            └────────────────┐  │  ┌──────────────────────┘
                             │  │  │
                       ┌─────▼──▼──▼──────┐
                       │  Webhooks /      │
                       │  Realtime channel│
                       │  (Supabase RT)   │
                       └──────────────────┘
```

Three principles:

1. **Cache the public read path aggressively.** Most of the community is read-heavy (10:1 read:write typical for social). Move reads to ISR + Redis.
2. **Push personalization to the client.** Don't re-render the whole layout per-user. Use a static shell + island components that fetch their own data with React Query/SWR.
3. **Never block the request on a write path's read replica.** All writes hit the primary via service-role; reads come from a hot replica (or Redis).

---

## 3. Phase plan with effort and payoff

### Phase 0 — Stop the bleeding (1–2 days, **0 → 1K users, eliminates 80% of current latency**)

These are surgical, low-risk changes. They alone will fix the blank-page problem the user is seeing.

#### 3.0.1 Replace `force-dynamic` with ISR + revalidate

```ts
// app/community/showcase/page.tsx
// before
export const dynamic = "force-dynamic";

// after
export const revalidate = 60; // refresh at most every 60s
```

Apply to the **public** pages first (no per-user data on first paint):

| Path | Suggested `revalidate` |
| --- | --- |
| `/community/showcase` | 60s |
| `/community/challenges` | 60s |
| `/community/events` | 60s |
| `/community/leaderboard` | 30s |
| `/community/communities` | 300s |
| `/community/jobs/opportunities` | 120s |
| `/community/mentors` | 300s |

Keep `force-dynamic` only for pages that **truly** must be per-user on first paint: `/community/notifications`, `/community/jobs/manage`, `/community/post/[id]` if the user state (saved/upvoted) needs to render server-side.

#### 3.0.2 Stop running the layout's sidebar queries on every request

Two options, pick one:

**Option A (lowest risk):** Add `unstable_cache` to the sidebar fetches with a 60s TTL keyed on `user.id`.

```ts
// app/community/layout.tsx
import { unstable_cache } from "next/cache";

const getSidebarLeaderboard = unstable_cache(
  async () => {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("comm_xp")
      .select("user_id, xp, level")
      .order("xp", { ascending: false })
      .limit(5);
    return data ?? [];
  },
  ["sidebar-leaderboard"],
  { revalidate: 60, tags: ["sidebar"] },
);
```

**Option B (better):** Make the leaderboard + events + challenge sidebars **client components** that fetch `/api/community/sidebar` after hydration. The static layout renders in <50ms; the sidebars populate progressively.

**Recommended:** Do both — server-side cache the data, AND mount it on the client so the page is interactive immediately. The user sees the breadcrumb, nav, and a skeleton; the sidebars stream in.

#### 3.0.3 Fix the N+1 in feed pages

`attachCommunityProfiles` runs a `profiles` query for every user_id in a feed. Replace it with a single `IN (...)` query, or use the Supabase view that already denormalizes profile fields.

```ts
// lib/community/public-profiles.ts
// before
projects = await attachCommunityProfiles(supabase, data); // N+1

// after
const userIds = [...new Set(data.map(d => d.user_id))];
const { data: profileRows } = await supabase
  .from("profiles")
  .select("user_id, full_name, username, avatar_id, avatar_url")
  .in("user_id", userIds);
const byId = new Map(profileRows.map(p => [p.user_id, p]));
data.forEach(row => { row.profiles = byId.get(row.user_id) ?? null; });
```

1 query instead of N+1. Add an index: `create index if not exists comm_posts_user_id_idx on comm_posts (user_id);` (already exists per `022_community_profile_performance.sql`).

#### 3.0.4 Add missing indexes (cheap, high impact)

Verify these exist (some already do, per migration 022):

```sql
-- Already added by 022:
comm_posts_user_created_idx           ON comm_posts(user_id, created_at DESC)
comm_follows_following_idx            ON comm_follows(following_id)
comm_member_badges_user_idx           ON comm_member_badges(user_id)
comm_xp_leaderboard_idx               ON comm_xp(xp DESC, user_id)
comm_events_upcoming_idx              ON comm_events(event_date ASC)
comm_posts_challenge_deadline_idx     ON comm_posts(challenge_deadline ASC) WHERE ...

-- Add in 024:
comm_posts_post_type_created_idx      ON comm_posts(post_type, created_at DESC)
comm_posts_upvotes_idx                ON comm_posts(upvotes DESC) WHERE post_type = 'showcase'
comm_post_comments_post_created_idx   ON comm_post_comments(post_id, created_at DESC)
comm_post_votes_user_post_unique      ON comm_post_votes(user_id, post_id)  -- for fast "did I upvote" lookups
comm_members_user_idx                 ON comm_members(user_id)
student_ai_qa_user_created_idx        ON student_ai_qa(user_id, created_at DESC)
```

**Effort:** 2 days. **Payoff:** ~10× improvement in feed query latency; goes from blank-page to <500ms p95.

---

### Phase 1 — Add a real cache layer (1 week, **1K → 10K users**)

#### 3.1.1 Add Upstash Redis (serverless, pay-per-request)

Upstash works with Vercel edge/serverless with no infra. Use it for:

| Use case | Key pattern | TTL | Eviction |
| --- | --- | --- | --- |
| Sidebar data | `sidebar:{kind}:v1` | 60–300s | TTL |
| Feed pages | `feed:{userId}:home:v3` | 30s | TTL |
| Per-post detail | `post:{postId}:v1` | 30s | TTL + invalidate on write |
| Profile cards | `profile:{userId}:v1` | 5min | TTL + invalidate on profile update |
| Leaderboard top 100 | `lb:top100:v1` | 30s | TTL |
| Rate limits | `rl:{userId}:{action}:{windowSec}` | window | TTL |

For the leaderboard, also use a Redis **Sorted Set** as a write-through cache:

```ts
// On XP update
await redis.zadd("lb:global", { score: newXp, member: userId });
// On read
const top = await redis.zrange("lb:global", 0, 99, { rev: true, withScores: true });
```

This makes the leaderboard read O(log N + 100) instead of a Postgres sort.

#### 3.1.2 Cache the feed in `unstable_cache` with tag-based invalidation

```ts
// app/community/page.tsx
import { unstable_cache } from "next/cache";

const getHomeFeed = unstable_cache(
  async (tab: string) => fetchFeed(tab),
  ["home-feed"],
  { revalidate: 30, tags: ["feed:home"] }
);

// On a new post
import { revalidateTag } from "next/cache";
revalidateTag("feed:home");
```

This is built into Next.js — no extra service to operate.

#### 3.1.3 Move personalization to a client island

The "your XP, your joined communities, your saved posts" data is per-user. Don't refetch the whole layout for it. Render a `<UserPersonalizationIsland userId={...} />` client component that does its own SWR fetch on mount.

This is the single biggest architectural change. It decouples the static shell (cacheable for 100K users) from the per-user bits (1 DB call, 50ms).

**Effort:** 1 week. **Payoff:** p95 latency on community pages from 800ms to <150ms; 10× throughput on the same Vercel + Supabase plan.

---

### Phase 2 — Optimize the write path (1 week, **10K → 30K users**)

#### 3.2.1 Connection pooling

Today every Vercel function creates a fresh Supabase client. On the free/pro tier, Supabase caps at **60 direct connections**. Switch the service-role client to use the pooler:

```ts
// lib/supabase/admin.ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const pooledUrl = supabaseUrl!.replace(":5432", ":6543"); // pgbouncer
return createClient(pooledUrl, serviceRoleKey, { auth: { persistSession: false } });
```

Use port **6543 (pgbouncer transaction mode)** for everything except realtime + storage uploads.

#### 3.2.2 Materialized views for hot reads

Add a Postgres materialized view that pre-joins the home feed, refreshed every 30s:

```sql
-- 024_feed_materialized_view.sql
create materialized view public.comm_home_feed_v1 as
select
  p.id, p.title, p.content, p.post_type, p.upvotes, p.created_at, p.user_id,
  pr.full_name, pr.username, pr.avatar_id, pr.avatar_url
from public.comm_posts p
left join public.profiles pr on pr.user_id = p.user_id
where p.post_type in ('discussion', 'showcase', 'question')
order by p.created_at desc
limit 500;

create unique index comm_home_feed_v1_id_idx on public.comm_home_feed_v1(id);
create index comm_home_feed_v1_type_created_idx on public.comm_home_feed_v1(post_type, created_at desc);

-- Refresh every 30s via pg_cron (Supabase has this built in)
select cron.schedule('refresh-home-feed', '*/30 seconds',
  'refresh materialized view concurrently public.comm_home_feed_v1');
```

The feed query becomes a simple `select * from comm_home_feed_v1 where post_type = $1 order by created_at desc limit 30` — single index scan, no joins, sub-10ms.

#### 3.2.3 Realtime fan-out via Supabase + Redis pub/sub

For "new post" notifications and live leaderboard updates, use Supabase Realtime + a Redis pub/sub channel to invalidate caches. This is the textbook CQRS-lite split.

#### 3.2.4 Move image uploads off the request path

`lib/community/image-upload.ts` writes to Supabase Storage. Use a **signed upload URL** pattern: client asks for a signed URL, uploads directly to S3-compatible storage, then notifies the server with the key. The server never holds the bytes.

**Effort:** 1 week. **Payoff:** 5× write throughput, 3× faster post-creation UX.

---

### Phase 3 — Multi-region + database scaling (2 weeks, **30K → 100K users**)

#### 3.3.1 Read replicas

Supabase Pro supports read replicas (currently us-east, eu-west, ap-southeast). Point ISR reads at the nearest replica:

```ts
const readClient = createClient(
  process.env.SUPABASE_READ_REPLICA_URL!,
  process.env.SUPABASE_ANON_KEY!,
  { db: { schema: "public" } },
);
```

Write client stays on the primary via service-role.

#### 3.3.2 Edge caching with Vercel + `stale-while-revalidate`

Public pages (`/community/leaderboard`, `/community/showcase`, `/community/jobs/opportunities`) become **fully static** with `revalidate = 60`. Vercel serves the cached HTML from 30+ POPs globally. Combined with ISR tags, content stays fresh.

```ts
// app/community/leaderboard/page.tsx
export const revalidate = 30;
```

#### 3.3.3 Full-text search with Postgres `tsvector` (or Meilisearch)

The current `search` page is presumably a `ilike %query%` query. At 100K users with 500K posts, that's a full table scan. Add:

```sql
-- 025_search_index.sql
alter table public.comm_posts
  add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) stored;

create index comm_posts_search_idx on public.comm_posts using gin(search_vector);
```

For richer search (typo tolerance, ranking, faceting), bolt on **Meilisearch** or **Typesense** as a sidecar; both run on a $5/mo 1GB VM and index 1M+ documents easily.

#### 3.3.4 Observability — the unglamorous but essential bit

You can't scale what you can't see. Add before 30K users:

| Tool | What it shows | Cost |
| --- | --- | --- |
| **Vercel Analytics** | p50/p95/p99 latency, cache hit ratio per route | Included |
| **Sentry** | JS + server-side errors with stack traces | Free tier is plenty |
| **Supabase Logs** | Slow query log, connection count | Included |
| **Logflare / Better Stack** | Aggregated logs from Vercel + Supabase | Free tier |
| **Grafana Cloud** (optional) | Dashboards for Redis, QPS, error rate | Free tier |

The KPI to watch: **`vitals.community.p95_latency`** and **`db.community.cache_hit_ratio`**. Set alerts at p95 > 1s and cache hit < 80%.

**Effort:** 2 weeks. **Payoff:** Linear scalability to 100K MAU on a single Supabase Pro plan.

---

## 4. Cost projection (Supabase Pro + Vercel Pro + Upstash)

| Component | Tier | Monthly cost |
| --- | --- | --- |
| Supabase Pro | 100K MAU fits well within Pro limits (8GB DB, 250GB egress) | $25 |
| Vercel Pro | 1 TB bandwidth, 1M function invocations/day | $20 |
| Upstash Redis | 10K commands/day free, then $0.20/100K | $5–$20 |
| Meilisearch Cloud (if added) | Free for 100K docs, then $30 | $0–$30 |
| Sentry / Better Stack | Free tier | $0 |
| **Total** | | **$50–$95/month at 100K MAU** |

This is the realistic floor. A 100K-MAU social community with a static-shell + ISR + Redis + materialized views architecture costs under $100/month of infra — because the cache hit ratio is what makes the difference, and ISR gives you 95%+ hit ratios essentially for free on Vercel.

---

## 5. Quick wins to ship this week

If you only have 2 days, do these five things in order:

1. **Remove `force-dynamic` from `/community/showcase`, `/community/challenges`, `/community/events`, `/community/communities`, `/community/jobs/opportunities`, `/community/leaderboard`, `/community/mentors`.** Add `export const revalidate = 60;` (or 30 for leaderboard). Five-minute change, ~80% latency reduction on those pages.

2. **Wrap the layout's sidebar queries in `unstable_cache(..., { revalidate: 60, tags: ["sidebar"] })`.** Twenty-minute change. The whole layout renders in <50ms for anonymous users.

3. **Replace `attachCommunityProfiles` with a single `IN (...)` query.** Half-hour change. Cuts feed query time from O(N) to O(1) DB round-trips.

4. **Add the four missing Postgres indexes** (post_type+created_at, upvotes, comments post+created, votes user+post unique). One migration file. Permanent perf floor.

5. **Make `comm_xp` leaderboard a Redis sorted set** (read path only — keep Postgres as source of truth). One service module. Eliminates the leaderboard hot path.

Together these are a 1-day fix that takes the system from "blank page" to "sub-200ms p95" for the 80% case. The remaining work (Phases 1–3) layers on top to make it scale to 100K.

---

## 6. What NOT to do at this scale

- **Don't add Kafka, Kubernetes, or microservices.** You have one Next.js app, one Postgres, one Redis. That's enough for 100K. YAGNI.
- **Don't move to GraphQL.** The data shapes are simple; Supabase auto-generated REST is fine. Re-evaluate at 500K MAU.
- **Don't shard Postgres yet.** 100K MAU fits in 8GB. Sharding is a 1M-MAU problem.
- **Don't pre-optimize the AI Lab path.** It already runs per-user (it's a write path with a heavy LLM call). Optimizing the 5-second LLM call is irrelevant — nobody hits it 100×/sec.
- **Don't build a custom CDN.** Vercel's edge network + ISR is a CDN for Next.js. Use it.

---

## 7. One-page summary

| | Today | After Phase 0 (1–2 days) | After Phase 1 (1 week) | After Phase 3 (1 month) |
| --- | --- | --- | --- | --- |
| Latency p95 (community page) | 1500–3000ms | 400–600ms | 150–250ms | 80–150ms |
| DB QPS at 10K DAU | 50–150 | 10–30 | 3–8 | 1–3 |
| Cost at 100K MAU | n/a (would crash) | $50 | $60 | $95 |
| Cache hit ratio | 0% | 60% | 90% | 95% |
| Pages force-dynamic | 80 | 20 | 5 | 0 |
| Regions | 1 | 1 | 1 | 3 (read replicas) |

Ship Phase 0 today. The screenshot is the symptom; the fix is structural, not a missing migration.
