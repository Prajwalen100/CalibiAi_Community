# Roadmap Mapping Engine

Maps the **existing** roadmap JSONs to users and derives every dashboard figure from one place.

**No roadmap content was created, duplicated, or modified.** All 8 files in `content/roadmap/` are byte-for-byte untouched — verified by `git status content/roadmap/` returning empty.

---

## 1. The bug this work uncovered

Before anything else: every `roadmap_progress` query in the codebase filtered by `user_id` **only**, never by `user_roadmap_id`.

Both stages number their days `1..45`. The moment a user held Beginner *and* Intermediate:

- **Progress double-counted** — 45 Beginner completions + 10 Intermediate read as 55/45.
- **Locks leaked across stages** — a completed Beginner Day 3 unlocked Intermediate Day 3, bypassing the pacing rule. This also defeated the `getRoadmapDayAccess` *security* guard, which is what stops a learner opening `/roadmap/day/N` by typing the URL.
- **Writes hit both stages** — `update(...).eq("day", N)` marked Day N complete in *every* stage at once.

This would have corrupted data for the first user who finished Beginner. Every read and write is now scoped to the active `user_roadmap_id`:

| Site | Fix |
|---|---|
| `lib/learning/day-access.ts` | Security guard now resolves the active stage before reading progress |
| `app/roadmap/day/[day]/page.tsx` | Read + 3 writes scoped (the completion write resolves the stage *inside* the `"use server"` action, which can't capture render scope) |
| `app/dashboard/page.tsx`, `app/roadmap/page.tsx` | Read through the engine |
| `lib/score/recalculate.ts` | Completion count scoped — was inflating scores |
| `app/network/page.tsx` | Now uses the **whole journey**, since "Complete AI Roadmap" gates Network entry |

---

## 2. Architecture

```
lib/roadmap/
  types.ts     Shared types. No fs, no Supabase.
  config.ts    Every tunable. No magic numbers anywhere else.
  engine.ts    Pure journey maths — fully unit tested in isolation.
  loader.ts    Dynamic, cached, validated loader for the existing JSONs.
  service.ts   Assignment, stage-scoped progress, auto-promotion, milestones.
  scoring.ts   Stage score bands.
  settings.ts  Admin-configurable threshold (DB → env → default).
```

`engine.ts` is deliberately I/O-free, which is why all 36 of its rules are testable without a database.

### Key model decision: derive, never store

Stage day numbers stay **native to each JSON** (`1..45`). The overall day (`1..90`) and week are *always computed* via `stageOffset`. Nothing overall is persisted, so the two stages **cannot** drift out of sync — and every JSON lookup remains a direct index with no de-offsetting.

---

## 3. Journey behaviour

| Flow | Journey | Stage days | Overall days | Overall weeks |
|---|---|---|---|---|
| Beginner entry | 2 stages | 1–45 each | 1–90 | 1–14 |
| ↳ after promotion | Intermediate | 1–45 | **46–90** | **8–14** |
| Direct Intermediate | 1 stage | 1–45 | 1–45 | 1–7 |

### A spec conflict I resolved

You specified Week **8–14** after Beginner completion, i.e. 14 total weeks. Strict day math gives `ceil(90/7) = 13` weeks, placing day 46 in **week 7** — a week straddling both stages.

I implemented **stage-concatenated weeks** (7 + 7 = 14). This matches your spec and is more meaningful: Intermediate Day 1 is "Week 1 of Intermediate" / "Week 8 overall", never a half-week shared with Beginner. Documented in `stageWeekOffset()`.

### Auto-promotion

At Beginner 100%, `maybePromoteStage()` archives the finished assignment and activates Intermediate against the **same** `roadmaps` catalog row (updated, not inserted). No new user, no duplicate roadmap record.

It archives *before* inserting because `one_active_learning_roadmap` is a unique index on `(user_id, role) WHERE status='active'`. If the insert fails, the archive is rolled back so a learner is never left with no active stage.

---

## 4. Placement threshold

`score < threshold → Beginner`, `>= → Intermediate`. Resolved **DB setting → env var → default 60**, never hardcoded.

This replaces the old rule:

```ts
overall >= 70 && strong.length >= 6 && weak.length <= 1
```

which made placement depend on how many skills a role's assessment file happened to cover — a learner could score 95 and still be placed Beginner.

---

## 5. Score banding

The additive engine (`lib/score/calculate.ts`) is **unchanged**. Its raw 0–1000 result is projected into the band the current stage allows:

| Stage | Band |
|---|---|
| Beginner | 150 → 650 |
| Intermediate (promoted) | 650 → 1000 |
| Intermediate (direct) | 350–500 → 1000, floor scaled by placement score |

Two guarantees, both under test:
- A Beginner at maximum (650) never exceeds a fresh Intermediate's floor (650).
- **Promotion never lowers a score** — a subtle failure mode I explicitly tested for.

A direct-Intermediate learner's floor *interpolates* with their placement score (350 at threshold → 500 at 100), rather than being handed the promoted learner's 650, which they haven't earned.

> **Worth flagging:** Network unlock requires 850. Under these bands that's only reachable in the Intermediate stage. That reads as intended — Network is for production-ready engineers — but it's a real behavioural change, so confirm it matches your intent.

---

## 6. Database (migration 025)

Mapping/pointer fields **only**. No roadmap content in the database.

- `user_roadmaps`: `entry_stage`, `roadmap_stage`, `roadmap_file`, `stage_index`, `overall_journey_days`, `stage_completed_at`, `assessment_score`
- `profiles`: journey summary (`current_overall_day`, `beginner_completed`, `roadmap_completed`, `roadmap_stage_override`, …)
- `app_settings`: admin-editable threshold + auto-promotion toggle
- `roadmap_milestones`: certificate hooks

Idempotent, and backfills existing rows so they behave exactly as before.

---

## 7. Admin — `/admin/roadmap`

Threshold, auto-promotion toggle, per-learner stage override, and a **read-only** inventory of the 8 existing JSONs. There is deliberately **no create/duplicate affordance** — roadmaps are authored in the repository.

Verified live against a running server: all 8 files listed, threshold reads 60, and `grep -ci "create roadmap"` returns 0.

---

## 8. Certificates — what I did instead

You said "use the existing certificate flow." **There is no certificate code, table, route, or component anywhere in the repo** — the only matches are marketing copy (`"no certificates, just proof"`).

Rather than invent a feature you didn't scope, I emit milestones (`beginner_completed`, `intermediate_completed`, `production_ready`) into `roadmap_milestones` + the activity log. A real certificate flow can consume these later with no rework. Say the word and I'll build the issuance UI.

---

## 9. UI: values only

| Card | Before | After |
|---|---|---|
| Subtitle | `{plan.roadmap.title} • {level} Level` | `{journeyTitle} • {stage} Stage` |
| Days Completed | stage `x / 45` | overall `x / 90` |
| Current Week | stage `Week n of 7` | overall `Week n of 14` |
| Today's Focus | `days.find(...)` | `selectTodaysFocus()` |
| Recommended | `days.slice(0, 8)` | `selectRecommendedActions()` — anchored on the current day, not always Day 1 |

**Structure unchanged.** JSX element census on `app/roadmap/page.tsx` is byte-identical; on the dashboard the only delta is a removed *type annotation* (`Partial<GeneratedRoadmap>`), not markup. Desktop computed styles verified identical at ≥1024px by the cascade checker from the previous task.

---

## 10. Verification

```
Build        ✓ Compiled successfully (Turbopack)
TypeScript   ✓ 0 errors
Tests        ✓ 238 passed (25 files) — 74 new
Lint         2 errors (both pre-existing in scroll-reveal.tsx)
Desktop      ✓ identical computed styles at >=1024px
Roadmap JSON ✓ 0 modified, 0 created
Runtime      ✓ /admin/roadmap renders, lists all 8 files, auth-gated (307)
```

New tests include full journey simulations against the **real** JSONs: Beginner day 1 → 45 → promotion → day 46–90 → completion, plus direct-Intermediate, score separation, and cache-identity assertions.

### Deploy note

Apply migration `025_roadmap_journey_mapping.sql` **before** deploying. The code degrades gracefully if it's missing (settings fall back to the default threshold, `entry_stage` falls back to `level`), but stage overrides and the journey summary need the columns.
