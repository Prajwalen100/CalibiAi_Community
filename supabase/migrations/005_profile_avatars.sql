-- Profile avatars: each user picks one of the built-in avatars (1–4).
-- Run this after 004_squads_events_applications.sql.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_id integer;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_avatar_id_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_avatar_id_check CHECK (avatar_id IS NULL OR avatar_id BETWEEN 1 AND 12);

-- Expose avatar_id through the safe public view used by community queries.
CREATE OR REPLACE VIEW public.comm_public_profiles
WITH (security_invoker = false) AS
SELECT user_id, username, full_name, target_role, avatar_id
FROM public.profiles;

GRANT SELECT ON public.comm_public_profiles TO anon, authenticated;
