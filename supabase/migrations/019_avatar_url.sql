-- ============================================================
-- 019_avatar_url
-- Supports AI-generated avatars. A user's bespoke avatar (e.g. a
-- DiceBear-generated portrait) is stored as a URL on their profile and
-- takes precedence over the legacy preset `avatar_id` SVGs.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

CREATE OR REPLACE VIEW public.comm_public_profiles
WITH (security_invoker = false) AS
SELECT
  user_id,
  username,
  full_name,
  target_role,
  avatar_id,
  avatar_url
FROM public.profiles;

GRANT SELECT ON public.comm_public_profiles TO anon, authenticated;
