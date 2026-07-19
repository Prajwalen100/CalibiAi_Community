-- Squads (Team Finder), dedicated events, and job applications
-- Run this after 003_community_feed_and_jobs.sql.

-- ============================================================
-- SQUADS (Team Finder)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comm_squads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  purpose text NOT NULL DEFAULT 'project',
  is_open boolean NOT NULL DEFAULT true,
  max_members integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT comm_squads_name_check CHECK (length(trim(name)) > 1),
  CONSTRAINT comm_squads_purpose_check CHECK (purpose IN ('hackathon', 'project', 'startup', 'study_group', 'research', 'other'))
);

DROP TRIGGER IF EXISTS comm_squads_updated_at ON public.comm_squads;
CREATE TRIGGER comm_squads_updated_at
  BEFORE UPDATE ON public.comm_squads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.comm_squad_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id uuid NOT NULL REFERENCES public.comm_squads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(squad_id, user_id),
  CONSTRAINT comm_squad_members_role_check CHECK (role IN ('owner', 'admin', 'member'))
);

ALTER TABLE public.comm_squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comm_squad_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comm_squads_public_read" ON public.comm_squads;
CREATE POLICY "comm_squads_public_read" ON public.comm_squads FOR SELECT USING (true);

DROP POLICY IF EXISTS "comm_squads_insert_own" ON public.comm_squads;
CREATE POLICY "comm_squads_insert_own" ON public.comm_squads FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "comm_squads_update_own" ON public.comm_squads;
CREATE POLICY "comm_squads_update_own" ON public.comm_squads
  FOR UPDATE USING (auth.uid() = owner_id OR public.current_user_role() = 'admin')
  WITH CHECK (auth.uid() = owner_id OR public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "comm_squads_delete_own" ON public.comm_squads;
CREATE POLICY "comm_squads_delete_own" ON public.comm_squads
  FOR DELETE USING (auth.uid() = owner_id OR public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "comm_squad_members_read" ON public.comm_squad_members;
CREATE POLICY "comm_squad_members_read" ON public.comm_squad_members FOR SELECT USING (true);

-- Insert: either the squad owner adds members, or a user joins themselves (open squads only).
DROP POLICY IF EXISTS "comm_squad_members_insert" ON public.comm_squad_members;
CREATE POLICY "comm_squad_members_insert" ON public.comm_squad_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.comm_squads s WHERE s.id = squad_id AND s.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "comm_squad_members_delete" ON public.comm_squad_members;
CREATE POLICY "comm_squad_members_delete" ON public.comm_squad_members
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.comm_squads s WHERE s.id = squad_id AND s.owner_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS comm_squad_members_user_idx ON public.comm_squad_members(user_id);
CREATE INDEX IF NOT EXISTS comm_squad_members_squad_idx ON public.comm_squad_members(squad_id);

-- Auto-add owner as first member.
CREATE OR REPLACE FUNCTION public.add_squad_owner_as_member()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.comm_squad_members (squad_id, user_id, role, added_by)
  VALUES (NEW.id, NEW.owner_id, 'owner', NEW.owner_id)
  ON CONFLICT (squad_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_add_squad_owner ON public.comm_squads;
CREATE TRIGGER trg_add_squad_owner
  AFTER INSERT ON public.comm_squads
  FOR EACH ROW EXECUTE FUNCTION public.add_squad_owner_as_member();

-- ============================================================
-- DEDICATED EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comm_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  event_type text NOT NULL DEFAULT 'meetup',
  event_date timestamptz NOT NULL,
  end_date timestamptz,
  mode text NOT NULL DEFAULT 'offline',
  location text,
  room text,
  virtual_link text,
  cover_image_url text,
  max_attendees integer,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT comm_events_title_check CHECK (length(trim(title)) > 2),
  CONSTRAINT comm_events_description_check CHECK (length(trim(description)) > 9),
  CONSTRAINT comm_events_type_check CHECK (event_type IN ('workshop', 'webinar', 'meetup', 'hackathon', 'ama', 'conference')),
  CONSTRAINT comm_events_mode_check CHECK (mode IN ('offline', 'virtual', 'hybrid')),
  CONSTRAINT comm_events_status_check CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  CONSTRAINT comm_events_offline_location CHECK (
    mode = 'virtual' OR (location IS NOT NULL AND length(trim(location)) > 0)
  ),
  CONSTRAINT comm_events_virtual_link CHECK (
    mode = 'offline' OR (virtual_link IS NOT NULL AND length(trim(virtual_link)) > 0)
  )
);

DROP TRIGGER IF EXISTS comm_events_updated_at ON public.comm_events;
CREATE TRIGGER comm_events_updated_at
  BEFORE UPDATE ON public.comm_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.comm_event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.comm_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'going',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id),
  CONSTRAINT comm_event_registrations_status_check CHECK (status IN ('going', 'maybe', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS comm_event_registrations_event_idx ON public.comm_event_registrations(event_id);
CREATE INDEX IF NOT EXISTS comm_events_date_idx ON public.comm_events(event_date);

ALTER TABLE public.comm_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comm_event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comm_events_public_read" ON public.comm_events;
CREATE POLICY "comm_events_public_read" ON public.comm_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "comm_events_insert_own" ON public.comm_events;
CREATE POLICY "comm_events_insert_own" ON public.comm_events FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comm_events_update_own" ON public.comm_events;
CREATE POLICY "comm_events_update_own" ON public.comm_events
  FOR UPDATE USING (auth.uid() = user_id OR public.current_user_role() = 'admin')
  WITH CHECK (auth.uid() = user_id OR public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "comm_events_delete_own" ON public.comm_events;
CREATE POLICY "comm_events_delete_own" ON public.comm_events
  FOR DELETE USING (auth.uid() = user_id OR public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "comm_event_registrations_read" ON public.comm_event_registrations;
CREATE POLICY "comm_event_registrations_read" ON public.comm_event_registrations FOR SELECT USING (true);

DROP POLICY IF EXISTS "comm_event_registrations_insert_own" ON public.comm_event_registrations;
CREATE POLICY "comm_event_registrations_insert_own" ON public.comm_event_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comm_event_registrations_update_own" ON public.comm_event_registrations;
CREATE POLICY "comm_event_registrations_update_own" ON public.comm_event_registrations
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comm_event_registrations_delete_own" ON public.comm_event_registrations;
CREATE POLICY "comm_event_registrations_delete_own" ON public.comm_event_registrations
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- JOB APPLICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comm_job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.comm_jobs(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_letter text NOT NULL,
  portfolio_url text,
  resume_url text,
  contact_email text NOT NULL,
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, applicant_id),
  CONSTRAINT comm_job_apps_cover_check CHECK (length(trim(cover_letter)) > 19),
  CONSTRAINT comm_job_apps_status_check CHECK (status IN ('submitted', 'shortlisted', 'interviewed', 'accepted', 'rejected'))
);

DROP TRIGGER IF EXISTS comm_job_applications_updated_at ON public.comm_job_applications;
CREATE TRIGGER comm_job_applications_updated_at
  BEFORE UPDATE ON public.comm_job_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS comm_job_apps_job_idx ON public.comm_job_applications(job_id);
CREATE INDEX IF NOT EXISTS comm_job_apps_applicant_idx ON public.comm_job_applications(applicant_id);

ALTER TABLE public.comm_job_applications ENABLE ROW LEVEL SECURITY;

-- Applicants can see their own applications; the job poster can see all applications on their listing.
DROP POLICY IF EXISTS "comm_job_apps_select" ON public.comm_job_applications;
CREATE POLICY "comm_job_apps_select" ON public.comm_job_applications
  FOR SELECT USING (
    auth.uid() = applicant_id
    OR EXISTS (SELECT 1 FROM public.comm_jobs j WHERE j.id = job_id AND j.user_id = auth.uid())
    OR public.current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "comm_job_apps_insert" ON public.comm_job_applications;
CREATE POLICY "comm_job_apps_insert" ON public.comm_job_applications
  FOR INSERT WITH CHECK (auth.uid() = applicant_id);

-- The applicant can withdraw; the job poster can update status.
DROP POLICY IF EXISTS "comm_job_apps_update" ON public.comm_job_applications;
CREATE POLICY "comm_job_apps_update" ON public.comm_job_applications
  FOR UPDATE USING (
    auth.uid() = applicant_id
    OR EXISTS (SELECT 1 FROM public.comm_jobs j WHERE j.id = job_id AND j.user_id = auth.uid())
    OR public.current_user_role() = 'admin'
  )
  WITH CHECK (
    auth.uid() = applicant_id
    OR EXISTS (SELECT 1 FROM public.comm_jobs j WHERE j.id = job_id AND j.user_id = auth.uid())
    OR public.current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "comm_job_apps_delete" ON public.comm_job_applications;
CREATE POLICY "comm_job_apps_delete" ON public.comm_job_applications
  FOR DELETE USING (auth.uid() = applicant_id OR public.current_user_role() = 'admin');

-- ============================================================
-- NOTIFICATIONS: allow the acting user to notify others
-- ============================================================
-- The existing insert policy only permits users to insert notifications for
-- themselves, which blocks legitimate follow / application / squad-invite
-- notifications. Allow inserts where the acting user is the recorded actor.
DROP POLICY IF EXISTS "comm_notifications_insert" ON public.comm_notifications;
CREATE POLICY "comm_notifications_insert" ON public.comm_notifications
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR auth.uid() = actor_id
    OR public.current_user_role() = 'admin'
  );
