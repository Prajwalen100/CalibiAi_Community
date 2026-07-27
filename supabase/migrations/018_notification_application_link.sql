-- ============================================================
-- 018_notification_application_link
-- Link job-application notifications to the specific application so an
-- employer can click a "X applied to your job" notification and jump
-- straight to the candidate's profile / application.
-- ============================================================

ALTER TABLE public.comm_notifications
  ADD COLUMN IF NOT EXISTS application_id uuid
  REFERENCES public.comm_job_applications(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_comm_notifications_application
  ON public.comm_notifications(application_id);
