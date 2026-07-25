-- Admin portal: blog authoring fields + student export support.
--
-- 1. Blog posts written from the standalone /admin portal are not owned by a
--    Supabase auth user, so author_id becomes nullable for blog rows and the
--    display byline is stored in author_name.
-- 2. links stores the "Links & resources" list rendered under a published post.
-- 3. Indexes support the admin student list (college filter, activity lookup).

-- ── Blog authoring ──────────────────────────────────────────────────────────
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS author_name text,
  ADD COLUMN IF NOT EXISTS links jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.posts
  ALTER COLUMN author_id DROP NOT NULL;

-- Showcase posts must still be owned by a user; only blog rows may be
-- authored by the admin portal instead of an auth.users row.
ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_author_required_for_non_blog;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_author_required_for_non_blog
  CHECK (type = 'blog' OR author_id IS NOT NULL);

-- Existing RLS policies compare auth.uid() = author_id, which stays null-safe.
-- Admin-portal writes go through the service role, which bypasses RLS.

-- Public read model used by the blog pages, refreshed with the new columns.
CREATE OR REPLACE VIEW public.published_blog_posts
WITH (security_invoker = true) AS
SELECT
  id,
  author_id,
  author_name,
  slug,
  title,
  excerpt,
  body,
  category,
  read_time_minutes,
  cover_image_url,
  tags,
  links,
  featured,
  published_at,
  created_at,
  updated_at
FROM public.posts
WHERE type = 'blog'
  AND status = 'published'
  AND slug IS NOT NULL;

-- ── Student data export ─────────────────────────────────────────────────────
-- profiles already stores name/email/phone/college, and scores stores the
-- CalibiAI Score, so the admin export only needs supporting indexes.
CREATE INDEX IF NOT EXISTS profiles_college_idx ON public.profiles (college);

-- The admin "active / inactive" filter reads the most recent activity_logs row
-- per learner; this index keeps that lookup fast as the table grows.
CREATE INDEX IF NOT EXISTS activity_logs_user_created_idx
  ON public.activity_logs (user_id, created_at DESC);
