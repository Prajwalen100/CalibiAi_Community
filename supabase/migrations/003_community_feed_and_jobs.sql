-- Community feed reliability and dedicated job postings
-- Run this after 002_community.sql.

-- ============================================================
-- SAFE PUBLIC AUTHOR DIRECTORY
-- ============================================================
-- `comm_posts.user_id` references auth.users, while profile information lives
-- in public.profiles. PostgREST cannot infer a relationship through auth.users,
-- so queries such as comm_posts(..., profiles(...)) fail with PGRST200 and
-- return no rows. Expose only the non-sensitive author fields needed by the
-- community UI through a view instead of making email/phone public.
CREATE OR REPLACE VIEW public.comm_public_profiles
WITH (security_invoker = false) AS
SELECT user_id, username, full_name, target_role
FROM public.profiles;

GRANT SELECT ON public.comm_public_profiles TO anon, authenticated;

-- ============================================================
-- DEDICATED JOB POSTINGS
-- ============================================================
-- Jobs intentionally have their own table. They no longer share the general
-- community post composer or appear in the discussion feed.
CREATE TABLE IF NOT EXISTS public.comm_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  company_name text NOT NULL,
  company_website text,
  description text NOT NULL,
  employment_type text NOT NULL,
  workplace_type text NOT NULL DEFAULT 'remote',
  location text,
  skills_required text[] NOT NULL DEFAULT '{}',
  compensation text NOT NULL,
  experience_required text NOT NULL,
  contact_email text,
  application_url text,
  application_deadline timestamptz,
  status text NOT NULL DEFAULT 'open',
  is_legacy boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT comm_jobs_title_check CHECK (length(trim(title)) > 2),
  CONSTRAINT comm_jobs_company_check CHECK (length(trim(company_name)) > 1),
  CONSTRAINT comm_jobs_description_check CHECK (length(trim(description)) > 19),
  CONSTRAINT comm_jobs_skills_check CHECK (cardinality(skills_required) > 0),
  CONSTRAINT comm_jobs_compensation_check CHECK (length(trim(compensation)) > 1),
  CONSTRAINT comm_jobs_experience_check CHECK (length(trim(experience_required)) > 0),
  CONSTRAINT comm_jobs_contact_email_check CHECK (is_legacy OR (contact_email IS NOT NULL AND length(trim(contact_email)) > 3)),
  CONSTRAINT comm_jobs_employment_type_check CHECK (employment_type IN ('internship', 'full_time', 'part_time', 'contract', 'freelance')),
  CONSTRAINT comm_jobs_workplace_type_check CHECK (workplace_type IN ('remote', 'hybrid', 'on_site')),
  CONSTRAINT comm_jobs_status_check CHECK (status IN ('open', 'closed'))
);

DROP TRIGGER IF EXISTS comm_jobs_updated_at ON public.comm_jobs;
CREATE TRIGGER comm_jobs_updated_at
  BEFORE UPDATE ON public.comm_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.comm_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comm_jobs_public_read" ON public.comm_jobs;
CREATE POLICY "comm_jobs_public_read" ON public.comm_jobs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "comm_jobs_insert_own" ON public.comm_jobs;
CREATE POLICY "comm_jobs_insert_own" ON public.comm_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comm_jobs_update_own" ON public.comm_jobs;
CREATE POLICY "comm_jobs_update_own" ON public.comm_jobs
  FOR UPDATE USING (auth.uid() = user_id OR public.current_user_role() = 'admin')
  WITH CHECK (auth.uid() = user_id OR public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "comm_jobs_delete_own" ON public.comm_jobs;
CREATE POLICY "comm_jobs_delete_own" ON public.comm_jobs
  FOR DELETE USING (auth.uid() = user_id OR public.current_user_role() = 'admin');

-- Preserve existing job entries from the original shared-post design. Older
-- listings may not contain contact details; the job detail page clearly marks
-- those as legacy listings while new postings require a contact email.
INSERT INTO public.comm_jobs (
  id, user_id, title, company_name, description, employment_type, workplace_type,
  location, skills_required, compensation, experience_required, status, is_legacy, created_at, updated_at
)
SELECT
  p.id,
  p.user_id,
  p.title,
  COALESCE(NULLIF(trim(p.job_company), ''), 'Not specified'),
  p.content,
  CASE
    WHEN p.job_type IN ('internship', 'full_time', 'freelance') THEN p.job_type
    ELSE 'full_time'
  END,
  'remote',
  NULLIF(trim(p.job_location), ''),
  '{}',
  'Not specified',
  'Not specified',
  'open',
  true,
  p.created_at,
  p.updated_at
FROM public.comm_posts AS p
WHERE p.post_type = 'job'
  AND NOT EXISTS (SELECT 1 FROM public.comm_jobs AS j WHERE j.id = p.id);
