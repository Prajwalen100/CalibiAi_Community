-- Personalized Learning Engine: onboarding state and durable learning records.
-- Existing profiles.role is an application authorization enum, so learning_role stores
-- the stable curriculum role without weakening authorization semantics.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_step integer NOT NULL DEFAULT 1 CHECK (onboarding_step BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS education_level text,
  ADD COLUMN IF NOT EXISTS experience_level text,
  ADD COLUMN IF NOT EXISTS weekly_hours integer DEFAULT 10 CHECK (weekly_hours BETWEEN 3 AND 40),
  ADD COLUMN IF NOT EXISTS learning_role text CHECK (learning_role IN ('genai_engineer','ai_engineer','ai_automation_engineer','data_science_engineer')),
  ADD COLUMN IF NOT EXISTS github_username text,
  ADD COLUMN IF NOT EXISTS github_connected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resume_skills jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.activity_logs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 action text NOT NULL, metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.assessment_results (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 role text NOT NULL, status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted','abandoned')),
 answers jsonb NOT NULL DEFAULT '{}'::jsonb, aggregate_score numeric, created_at timestamptz NOT NULL DEFAULT now(), submitted_at timestamptz
);
CREATE INDEX IF NOT EXISTS assessment_results_user_status_idx ON public.assessment_results(user_id, status);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_logs_own" ON public.activity_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "assessment_results_own" ON public.assessment_results FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
