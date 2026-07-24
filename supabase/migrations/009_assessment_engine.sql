ALTER TABLE public.assessment_results
 ADD COLUMN IF NOT EXISTS attempt_number integer NOT NULL DEFAULT 1,
 ADD COLUMN IF NOT EXISTS seed text,
 ADD COLUMN IF NOT EXISTS question_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
 ADD COLUMN IF NOT EXISTS overall_score integer,
 ADD COLUMN IF NOT EXISTS level text CHECK (level IN ('beginner','intermediate')),
 ADD COLUMN IF NOT EXISTS answer_results jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS assessment_attempt_number_idx ON public.assessment_results(user_id, role, attempt_number);
CREATE TABLE IF NOT EXISTS public.skill_scores (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), assessment_result_id uuid NOT NULL REFERENCES public.assessment_results(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, skill text NOT NULL, score integer NOT NULL CHECK (score BETWEEN 0 AND 100), band text NOT NULL CHECK (band IN ('weak','developing','strong')), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(assessment_result_id, skill));
CREATE TABLE IF NOT EXISTS public.knowledge_graph (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), assessment_result_id uuid NOT NULL UNIQUE REFERENCES public.assessment_results(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, graph jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.skill_scores ENABLE ROW LEVEL SECURITY; ALTER TABLE public.knowledge_graph ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skill_scores_own" ON public.skill_scores FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE POLICY "knowledge_graph_own" ON public.knowledge_graph FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
