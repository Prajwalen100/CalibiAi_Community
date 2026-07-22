-- Employer accounts, company profiles, and application pipeline enhancements
-- Run this after 004_squads_events_applications.sql (and 005 if present).

-- ============================================================
-- EXTEND app_role WITH employer
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'employer'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'employer';
  END IF;
END $$;

-- ============================================================
-- EMPLOYER / COMPANY PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.employer_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  company_logo_url text,
  email text NOT NULL,
  website text,
  location text,
  location_type text NOT NULL DEFAULT 'remote',
  company_size text NOT NULL DEFAULT '1-10',
  pan_number text,
  about text,
  sector text,
  hiring_contact_name text,
  phone text,
  onboarding_complete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employer_company_name_check CHECK (length(trim(company_name)) > 1),
  CONSTRAINT employer_email_check CHECK (length(trim(email)) > 3),
  CONSTRAINT employer_location_type_check CHECK (
    location_type IN ('remote', 'hybrid', 'on_site', 'multi_location', 'other')
  ),
  CONSTRAINT employer_company_size_check CHECK (
    company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')
  )
);

DROP TRIGGER IF EXISTS employer_profiles_updated_at ON public.employer_profiles;
CREATE TRIGGER employer_profiles_updated_at
  BEFORE UPDATE ON public.employer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employer_profiles_public_read" ON public.employer_profiles;
CREATE POLICY "employer_profiles_public_read" ON public.employer_profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "employer_profiles_insert_own" ON public.employer_profiles;
CREATE POLICY "employer_profiles_insert_own" ON public.employer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "employer_profiles_update_own" ON public.employer_profiles;
CREATE POLICY "employer_profiles_update_own" ON public.employer_profiles
  FOR UPDATE USING (auth.uid() = user_id OR public.current_user_role() = 'admin')
  WITH CHECK (auth.uid() = user_id OR public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "employer_profiles_delete_own" ON public.employer_profiles;
CREATE POLICY "employer_profiles_delete_own" ON public.employer_profiles
  FOR DELETE USING (auth.uid() = user_id OR public.current_user_role() = 'admin');

-- ============================================================
-- LINK JOBS TO EMPLOYER COMPANY (optional enrichment)
-- ============================================================
ALTER TABLE public.comm_jobs
  ADD COLUMN IF NOT EXISTS employer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS company_logo_url text,
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'job';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'comm_jobs_category_check'
  ) THEN
    ALTER TABLE public.comm_jobs
      ADD CONSTRAINT comm_jobs_category_check
      CHECK (category IN ('job', 'freelance', 'internship', 'opportunity'));
  END IF;
END $$;

-- Backfill employer_user_id from existing posters
UPDATE public.comm_jobs
SET employer_user_id = user_id
WHERE employer_user_id IS NULL;

-- ============================================================
-- APPLICATION NOTES / PIPELINE MESSAGES (employer side)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comm_application_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.comm_job_applications(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  is_internal boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT comm_app_notes_body_check CHECK (length(trim(body)) > 0)
);

CREATE INDEX IF NOT EXISTS comm_app_notes_app_idx ON public.comm_application_notes(application_id);

ALTER TABLE public.comm_application_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comm_app_notes_select" ON public.comm_application_notes;
CREATE POLICY "comm_app_notes_select" ON public.comm_application_notes
  FOR SELECT USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.comm_job_applications a
      JOIN public.comm_jobs j ON j.id = a.job_id
      WHERE a.id = application_id AND j.user_id = auth.uid()
    )
    OR public.current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "comm_app_notes_insert" ON public.comm_application_notes;
CREATE POLICY "comm_app_notes_insert" ON public.comm_application_notes
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM public.comm_job_applications a
      JOIN public.comm_jobs j ON j.id = a.job_id
      WHERE a.id = application_id AND j.user_id = auth.uid()
    )
  );

-- ============================================================
-- OFFERS from employers to applicants
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comm_job_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.comm_job_applications(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.comm_jobs(id) ON DELETE CASCADE,
  employer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  compensation text,
  start_date date,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT comm_job_offers_message_check CHECK (length(trim(message)) > 9),
  CONSTRAINT comm_job_offers_status_check CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn'))
);

DROP TRIGGER IF EXISTS comm_job_offers_updated_at ON public.comm_job_offers;
CREATE TRIGGER comm_job_offers_updated_at
  BEFORE UPDATE ON public.comm_job_offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS comm_job_offers_employer_idx ON public.comm_job_offers(employer_id);
CREATE INDEX IF NOT EXISTS comm_job_offers_applicant_idx ON public.comm_job_offers(applicant_id);

ALTER TABLE public.comm_job_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comm_job_offers_select" ON public.comm_job_offers;
CREATE POLICY "comm_job_offers_select" ON public.comm_job_offers
  FOR SELECT USING (
    auth.uid() = employer_id
    OR auth.uid() = applicant_id
    OR public.current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "comm_job_offers_insert" ON public.comm_job_offers;
CREATE POLICY "comm_job_offers_insert" ON public.comm_job_offers
  FOR INSERT WITH CHECK (auth.uid() = employer_id);

DROP POLICY IF EXISTS "comm_job_offers_update" ON public.comm_job_offers;
CREATE POLICY "comm_job_offers_update" ON public.comm_job_offers
  FOR UPDATE USING (
    auth.uid() = employer_id
    OR auth.uid() = applicant_id
    OR public.current_user_role() = 'admin'
  )
  WITH CHECK (
    auth.uid() = employer_id
    OR auth.uid() = applicant_id
    OR public.current_user_role() = 'admin'
  );

-- ============================================================
-- HELPER: is current user an employer with completed onboarding
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_employer()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'employer'
  );
$$;

CREATE OR REPLACE FUNCTION public.employer_onboarded()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employer_profiles e
    WHERE e.user_id = auth.uid() AND e.onboarding_complete = true
  );
$$;

-- Prefer employers when inserting jobs (students can still apply; posting is employer-first)
DROP POLICY IF EXISTS "comm_jobs_insert_own" ON public.comm_jobs;
CREATE POLICY "comm_jobs_insert_own" ON public.comm_jobs
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (
      public.current_user_role() = 'employer'
      OR public.current_user_role() = 'admin'
    )
  );
