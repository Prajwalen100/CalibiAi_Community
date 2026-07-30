-- ============================================================
-- 021_lock_day_submissions
--
-- Make roadmap-day completion strict:
--
--   1. `roadmap_task_awards` was already unique per
--      (user_roadmap_id, day, task_type). This migration adds a
--      companion table `roadmap_quiz_completions` with the same shape
--      so quizzes cannot be retaken for points either.
--
--   2. Adds `roadmap_article_reads` so we can gate day completion on
--      the "Detailed Article for This Day" being opened at least once.
--
--   3. Adds a `submitted` boolean flag on `roadmap_task_awards` that
--      the API sets to `true` the moment a submission is saved. The
--      API then refuses further calls (whether `check` or `submit`),
--      which is what actually prevents extra LLM invocations.
--
--   4. Views: `roadmap_day_completion_state` returns one row per
--      (user_roadmap_id, day) with a boolean per requirement so the
--      day page can render the "Mark Complete" gate with a single
--      query.
--
-- All statements use IF NOT EXISTS / DO $$ ... $$ so this file is safe
-- to run multiple times.
-- ============================================================

-- 1. Freeze task awards once submitted -----------------------------------
ALTER TABLE public.roadmap_task_awards
  ADD COLUMN IF NOT EXISTS submitted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

-- Existing rows were created via the /api/ai/task-review submit path, so
-- treat them as already submitted (they hold a best_score + latest
-- assessment reference).
UPDATE public.roadmap_task_awards
   SET submitted = true,
       submitted_at = COALESCE(submitted_at, updated_at)
 WHERE latest_assessment_id IS NOT NULL
   AND submitted = false;

-- 2. Quiz completions (one per day, per roadmap) --------------------------
CREATE TABLE IF NOT EXISTS public.roadmap_quiz_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_roadmap_id uuid NOT NULL REFERENCES public.user_roadmaps(id) ON DELETE CASCADE,
  day integer NOT NULL CHECK (day BETWEEN 1 AND 45),
  best_score integer NOT NULL CHECK (best_score BETWEEN 0 AND 100),
  total_questions integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_roadmap_id, day)
);
ALTER TABLE public.roadmap_quiz_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "roadmap_quiz_completions_own" ON public.roadmap_quiz_completions;
CREATE POLICY "roadmap_quiz_completions_own"
  ON public.roadmap_quiz_completions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT ON public.roadmap_quiz_completions TO authenticated;

CREATE INDEX IF NOT EXISTS roadmap_quiz_completions_user_day_idx
  ON public.roadmap_quiz_completions(user_id, day);

-- 3. Article reads (one per day, per roadmap) -----------------------------
CREATE TABLE IF NOT EXISTS public.roadmap_article_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_roadmap_id uuid NOT NULL REFERENCES public.user_roadmaps(id) ON DELETE CASCADE,
  day integer NOT NULL CHECK (day BETWEEN 1 AND 45),
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_roadmap_id, day)
);
ALTER TABLE public.roadmap_article_reads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "roadmap_article_reads_own" ON public.roadmap_article_reads;
CREATE POLICY "roadmap_article_reads_own"
  ON public.roadmap_article_reads FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT ON public.roadmap_article_reads TO authenticated;

CREATE INDEX IF NOT EXISTS roadmap_article_reads_user_day_idx
  ON public.roadmap_article_reads(user_id, day);

-- 4. Day-level completion view --------------------------------------------
-- Returns one row per (user_id, user_roadmap_id, day) with a boolean per
-- requirement. Consumers should filter by (user_id, day) — RLS is enforced
-- through the invoking user's roadmap ownership so no extra policy is needed.
CREATE OR REPLACE VIEW public.roadmap_day_completion_state
WITH (security_invoker = true) AS
WITH tasks AS (
  SELECT
    a.user_id,
    a.user_roadmap_id,
    a.day,
    bool_or(a.task_type = 'practical_task' AND a.submitted) AS practical_submitted,
    bool_or(a.task_type = 'mini_project'   AND a.submitted) AS mini_submitted,
    bool_or(a.task_type = 'assignment'     AND a.submitted) AS assignment_submitted,
    max(CASE WHEN a.task_type = 'practical_task' THEN a.best_score END) AS practical_score,
    max(CASE WHEN a.task_type = 'mini_project'   THEN a.best_score END) AS mini_score,
    max(CASE WHEN a.task_type = 'assignment'     THEN a.best_score END) AS assignment_score
  FROM public.roadmap_task_awards a
  GROUP BY a.user_id, a.user_roadmap_id, a.day
),
quizzes AS (
  SELECT user_id, user_roadmap_id, day, best_score AS quiz_score
  FROM public.roadmap_quiz_completions
),
reads AS (
  SELECT user_id, user_roadmap_id, day
  FROM public.roadmap_article_reads
)
SELECT
  COALESCE(t.user_id, q.user_id, r.user_id) AS user_id,
  COALESCE(t.user_roadmap_id, q.user_roadmap_id, r.user_roadmap_id) AS user_roadmap_id,
  COALESCE(t.day, q.day, r.day) AS day,
  COALESCE(t.practical_submitted,  false) AS practical_submitted,
  COALESCE(t.mini_submitted,       false) AS mini_submitted,
  COALESCE(t.assignment_submitted, false) AS assignment_submitted,
  t.practical_score,
  t.mini_score,
  t.assignment_score,
  (q.user_id IS NOT NULL) AS quiz_submitted,
  q.quiz_score,
  (r.user_id IS NOT NULL) AS article_read
FROM tasks t
FULL OUTER JOIN quizzes q
  ON t.user_roadmap_id = q.user_roadmap_id AND t.day = q.day AND t.user_id = q.user_id
FULL OUTER JOIN reads r
  ON COALESCE(t.user_roadmap_id, q.user_roadmap_id) = r.user_roadmap_id
 AND COALESCE(t.day, q.day) = r.day
 AND COALESCE(t.user_id, q.user_id) = r.user_id;

GRANT SELECT ON public.roadmap_day_completion_state TO authenticated;
