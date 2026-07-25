-- Add strong_skills column to user_roadmaps personalization if not exists
-- The personalization jsonb column already exists, so we just need to ensure the structure is correct

-- Ensure weekly_reports table has the required columns
ALTER TABLE public.weekly_reports
 ADD COLUMN IF NOT EXISTS assessment_score integer,
 ADD COLUMN IF NOT EXISTS skill_scores jsonb,
 ADD COLUMN IF NOT EXISTS weak_skills text[],
 ADD COLUMN IF NOT EXISTS strong_skills text[],
 ADD COLUMN IF NOT EXISTS overall_score integer,
 ADD COLUMN IF NOT EXISTS week_summary text,
 ADD COLUMN IF NOT EXISTS next_week_focus text[];

-- Create index for faster weekly report lookups
CREATE INDEX IF NOT EXISTS weekly_reports_user_week_idx ON public.weekly_reports(user_id, week_index);

-- Create activity_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_logs_user_action_idx ON public.activity_logs(user_id, action);

-- Ensure RLS is enabled on activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for activity_logs
DROP POLICY IF EXISTS "activity_logs_owner" ON public.activity_logs;
CREATE POLICY "activity_logs_owner" ON public.activity_logs 
  FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.activity_logs TO authenticated;
GRANT ALL ON public.weekly_reports TO authenticated;
