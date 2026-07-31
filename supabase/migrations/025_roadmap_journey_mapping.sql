-- Roadmap journey mapping.
--
-- Adds ONLY mapping/pointer fields. No roadmap content is copied into the
-- database: the existing JSON files in content/roadmap/ remain the single
-- source of truth, and these columns just record which file a learner is on
-- and how far through the journey they are.
--
-- Every statement is idempotent so the migration is safe to re-run.

-- ── Runtime settings (admin-configurable placement threshold) ──────────────
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Settings are read through the service-role client only. No RLS policy is
-- granted to `authenticated`, so learners can neither read nor edit them.

INSERT INTO public.app_settings (key, value)
VALUES
  ('roadmap.placement_threshold', '60'::jsonb),
  ('roadmap.auto_promotion_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ── Journey mapping on user_roadmaps ───────────────────────────────────────
-- `level` already exists and stores the stage ('beginner' | 'intermediate').
-- These columns describe the journey that stage belongs to.
ALTER TABLE public.user_roadmaps
  -- The stage the learner ENTERED at. Durable: it defines whether the journey
  -- is 45 or 90 days and never changes when they are promoted.
  ADD COLUMN IF NOT EXISTS entry_stage text
    CHECK (entry_stage IN ('beginner', 'intermediate')),
  -- Which stage this row represents. Mirrors `level`; named explicitly so the
  -- engine never has to infer intent from an overloaded column.
  ADD COLUMN IF NOT EXISTS roadmap_stage text
    CHECK (roadmap_stage IN ('beginner', 'intermediate')),
  -- Filename of the source JSON, e.g. roadmap_ai_engineer_beginner.json.
  -- A pointer, not content.
  ADD COLUMN IF NOT EXISTS roadmap_file text,
  -- 1 for the first stage, 2 for the second. Orders a learner's stages.
  ADD COLUMN IF NOT EXISTS stage_index integer NOT NULL DEFAULT 1,
  -- Total days across every stage of this journey (45 or 90). Denormalised
  -- for cheap reads; the engine always recomputes it from the JSONs.
  ADD COLUMN IF NOT EXISTS overall_journey_days integer,
  ADD COLUMN IF NOT EXISTS stage_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS assessment_score integer;

-- Backfill existing rows so they behave exactly as before this migration.
UPDATE public.user_roadmaps
SET entry_stage = COALESCE(entry_stage, level),
    roadmap_stage = COALESCE(roadmap_stage, level)
WHERE entry_stage IS NULL OR roadmap_stage IS NULL;

-- ── Journey summary on profiles ────────────────────────────────────────────
-- Denormalised mapping fields for fast dashboard reads and admin filtering.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS roadmap_entry_stage text
    CHECK (roadmap_entry_stage IN ('beginner', 'intermediate')),
  ADD COLUMN IF NOT EXISTS roadmap_stage text
    CHECK (roadmap_stage IN ('beginner', 'intermediate')),
  ADD COLUMN IF NOT EXISTS overall_journey_days integer,
  ADD COLUMN IF NOT EXISTS current_overall_day integer,
  ADD COLUMN IF NOT EXISTS current_stage_day integer,
  ADD COLUMN IF NOT EXISTS current_overall_week integer,
  ADD COLUMN IF NOT EXISTS current_stage_week integer,
  ADD COLUMN IF NOT EXISTS beginner_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS intermediate_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS roadmap_completed boolean NOT NULL DEFAULT false,
  -- Set by an admin to pin a learner to a stage, overriding the assessment.
  ADD COLUMN IF NOT EXISTS roadmap_stage_override text
    CHECK (roadmap_stage_override IN ('beginner', 'intermediate'));

-- ── Journey milestones (certificate hooks) ─────────────────────────────────
-- Records stage completion so a certificate flow can consume it later. Stores
-- the event only — no certificate rendering or content here.
CREATE TABLE IF NOT EXISTS public.roadmap_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone text NOT NULL
    CHECK (milestone IN ('beginner_completed', 'intermediate_completed', 'production_ready')),
  role text,
  stage text CHECK (stage IN ('beginner', 'intermediate')),
  user_roadmap_id uuid REFERENCES public.user_roadmaps(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  achieved_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, milestone)
);

ALTER TABLE public.roadmap_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "roadmap_milestones_own_read" ON public.roadmap_milestones;
CREATE POLICY "roadmap_milestones_own_read"
  ON public.roadmap_milestones FOR SELECT
  USING (auth.uid() = user_id);

GRANT SELECT ON public.roadmap_milestones TO authenticated;

CREATE INDEX IF NOT EXISTS roadmap_milestones_user_idx
  ON public.roadmap_milestones(user_id);

-- ── Indexes supporting stage-scoped progress reads ─────────────────────────
-- Progress is now always filtered by the ACTIVE user_roadmap_id, because both
-- stages number their days 1..45 and would otherwise collide.
CREATE INDEX IF NOT EXISTS roadmap_progress_user_roadmap_idx
  ON public.roadmap_progress(user_id, user_roadmap_id);

CREATE INDEX IF NOT EXISTS user_roadmaps_user_status_idx
  ON public.user_roadmaps(user_id, status);
