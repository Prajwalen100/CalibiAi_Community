-- Per-user reading progress for curriculum modules (phases/* lessons)

CREATE TABLE IF NOT EXISTS public.curriculum_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id text NOT NULL,
  phase_id text NOT NULL,
  progress_pct integer NOT NULL DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  completed boolean NOT NULL DEFAULT false,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id),
  CONSTRAINT curriculum_progress_module_id_check CHECK (length(trim(module_id)) > 2)
);

DROP TRIGGER IF EXISTS curriculum_progress_updated_at ON public.curriculum_progress;
CREATE TRIGGER curriculum_progress_updated_at
  BEFORE UPDATE ON public.curriculum_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS curriculum_progress_user_idx ON public.curriculum_progress(user_id);
CREATE INDEX IF NOT EXISTS curriculum_progress_phase_idx ON public.curriculum_progress(user_id, phase_id);

ALTER TABLE public.curriculum_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "curriculum_progress_select_own" ON public.curriculum_progress;
CREATE POLICY "curriculum_progress_select_own" ON public.curriculum_progress
  FOR SELECT USING (auth.uid() = user_id OR public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "curriculum_progress_insert_own" ON public.curriculum_progress;
CREATE POLICY "curriculum_progress_insert_own" ON public.curriculum_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "curriculum_progress_update_own" ON public.curriculum_progress;
CREATE POLICY "curriculum_progress_update_own" ON public.curriculum_progress
  FOR UPDATE USING (auth.uid() = user_id OR public.current_user_role() = 'admin')
  WITH CHECK (auth.uid() = user_id OR public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "curriculum_progress_delete_own" ON public.curriculum_progress;
CREATE POLICY "curriculum_progress_delete_own" ON public.curriculum_progress
  FOR DELETE USING (auth.uid() = user_id OR public.current_user_role() = 'admin');
