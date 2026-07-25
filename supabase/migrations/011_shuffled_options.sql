-- Add shuffled_questions column for storing shuffled options per attempt
ALTER TABLE public.assessment_results
 ADD COLUMN IF NOT EXISTS shuffled_questions jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS assessment_shuffled_questions_idx ON public.assessment_results USING gin (shuffled_questions);

-- Update function to include shuffled_questions
CREATE OR REPLACE FUNCTION public.update_user_score_from_assessment(
  p_user_id uuid,
  p_assessment_score integer,
  p_points integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_completion_pts integer;
  current_total integer;
  new_completion_pts integer;
  new_total integer;
BEGIN
  -- Get current values
  SELECT completion_pts, total INTO current_completion_pts, current_total
  FROM public.scores
  WHERE user_id = p_user_id;

  -- Calculate new values (use max to prevent decreasing score on retry)
  new_completion_pts := GREATEST(current_completion_pts, p_points);
  new_total := COALESCE(current_total, 0) - COALESCE(current_completion_pts, 0) + new_completion_pts;

  -- Update scores table
  UPDATE public.scores
  SET 
    completion_pts = new_completion_pts,
    total = new_total,
    last_calculated_at = now()
  WHERE user_id = p_user_id;
END;
$$;
