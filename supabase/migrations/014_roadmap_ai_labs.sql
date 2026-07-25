-- Durable AI lab attempts and idempotent best-score awards for every roadmap task.
CREATE TABLE IF NOT EXISTS public.roadmap_task_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_roadmap_id uuid NOT NULL REFERENCES public.user_roadmaps(id) ON DELETE CASCADE,
  role text NOT NULL,
  level text NOT NULL CHECK (level IN ('beginner', 'intermediate')),
  day integer NOT NULL CHECK (day BETWEEN 1 AND 45),
  task_type text NOT NULL CHECK (task_type IN ('practical_task', 'mini_project', 'assignment')),
  task_description text NOT NULL,
  submission_language text NOT NULL,
  submission text NOT NULL,
  explanation text NOT NULL DEFAULT '',
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  passed boolean NOT NULL,
  points_awarded integer NOT NULL DEFAULT 0 CHECK (points_awarded BETWEEN 0 AND 5),
  feedback text NOT NULL,
  strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  improvements jsonb NOT NULL DEFAULT '[]'::jsonb,
  correctness_issues jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_enriched boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS roadmap_task_assessments_user_day_idx
  ON public.roadmap_task_assessments(user_id, user_roadmap_id, day, task_type, created_at DESC);

-- One award row per roadmap/day/task prevents unlimited points from retries.
-- A better retry can earn only the positive difference from the prior best.
CREATE TABLE IF NOT EXISTS public.roadmap_task_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_roadmap_id uuid NOT NULL REFERENCES public.user_roadmaps(id) ON DELETE CASCADE,
  day integer NOT NULL CHECK (day BETWEEN 1 AND 45),
  task_type text NOT NULL CHECK (task_type IN ('practical_task', 'mini_project', 'assignment')),
  best_score integer NOT NULL DEFAULT 0 CHECK (best_score BETWEEN 0 AND 100),
  points_awarded integer NOT NULL DEFAULT 0 CHECK (points_awarded BETWEEN 0 AND 5),
  latest_assessment_id uuid REFERENCES public.roadmap_task_assessments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_roadmap_id, day, task_type)
);

DROP TRIGGER IF EXISTS roadmap_task_awards_updated_at ON public.roadmap_task_awards;
CREATE TRIGGER roadmap_task_awards_updated_at
  BEFORE UPDATE ON public.roadmap_task_awards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.roadmap_task_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_task_awards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "roadmap_task_assessments_own" ON public.roadmap_task_assessments;
CREATE POLICY "roadmap_task_assessments_own"
  ON public.roadmap_task_assessments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "roadmap_task_awards_own" ON public.roadmap_task_awards;
CREATE POLICY "roadmap_task_awards_own"
  ON public.roadmap_task_awards FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT ON public.roadmap_task_assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.roadmap_task_awards TO authenticated;

-- Tracks how many durable lab-award points have already been incorporated into
-- the completion pillar. Keeping this separate prevents retries from double
-- counting and lets an interrupted request reconcile on the next submission.
CREATE TABLE IF NOT EXISTS public.roadmap_lab_score_state (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  applied_points integer NOT NULL DEFAULT 0 CHECK (applied_points >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.roadmap_lab_score_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "roadmap_lab_score_state_own_read" ON public.roadmap_lab_score_state;
CREATE POLICY "roadmap_lab_score_state_own_read"
  ON public.roadmap_lab_score_state FOR SELECT
  USING (auth.uid() = user_id);
GRANT SELECT ON public.roadmap_lab_score_state TO authenticated;

-- Atomically add only newly earned lab points to the existing completion score.
-- This preserves assessment/progress points already in that pillar and caps it
-- at 100, while the complete CalibiAI score remains capped at 1000.
CREATE OR REPLACE FUNCTION public.apply_roadmap_lab_points(p_user_id uuid)
RETURNS TABLE(points_added integer, total_score integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_applied integer;
  v_awarded integer;
  v_pending integer;
  v_completion integer;
  v_total integer;
  v_points_added integer;
  v_new_total integer;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.roadmap_lab_score_state(user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT applied_points INTO v_applied
  FROM public.roadmap_lab_score_state
  WHERE user_id = p_user_id
  FOR UPDATE;

  SELECT COALESCE(SUM(points_awarded), 0)::integer INTO v_awarded
  FROM public.roadmap_task_awards
  WHERE user_id = p_user_id;

  v_pending := GREATEST(0, v_awarded - v_applied);

  INSERT INTO public.scores(user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT completion_pts, total INTO v_completion, v_total
  FROM public.scores
  WHERE user_id = p_user_id
  FOR UPDATE;

  v_points_added := LEAST(v_pending, GREATEST(0, 100 - v_completion), GREATEST(0, 1000 - v_total));
  v_new_total := LEAST(1000, v_total + v_points_added);

  UPDATE public.scores
  SET completion_pts = v_completion + v_points_added,
      total = v_new_total,
      tier = CASE
        WHEN v_new_total >= 801 THEN 'platinum'::public.score_tier
        WHEN v_new_total >= 551 THEN 'gold'::public.score_tier
        WHEN v_new_total >= 301 THEN 'silver'::public.score_tier
        ELSE 'bronze'::public.score_tier
      END,
      last_calculated_at = now()
  WHERE user_id = p_user_id;

  UPDATE public.roadmap_lab_score_state
  SET applied_points = v_awarded,
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT v_points_added, v_new_total;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_roadmap_lab_points(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_roadmap_lab_points(uuid) TO authenticated;
