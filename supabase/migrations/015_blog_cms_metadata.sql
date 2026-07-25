-- Blog CMS metadata for the admin posting workflow.
-- The original schema already owns public.posts with type/status RLS policies.
-- This migration keeps that table and adds the public-blog fields needed by
-- /admin/blog and /blog without weakening existing auth rules.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS excerpt text,
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Education',
  ADD COLUMN IF NOT EXISTS read_time_minutes integer NOT NULL DEFAULT 1 CHECK (read_time_minutes BETWEEN 1 AND 120),
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

-- Published blog posts resolve by slug. Drafts may temporarily have duplicate
-- or null slugs, but published blog URLs must be stable and unique.
CREATE UNIQUE INDEX IF NOT EXISTS posts_blog_slug_unique
  ON public.posts (lower(slug))
  WHERE type = 'blog' AND slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS posts_blog_status_published_idx
  ON public.posts (status, published_at DESC)
  WHERE type = 'blog';

CREATE INDEX IF NOT EXISTS posts_blog_category_idx
  ON public.posts (category)
  WHERE type = 'blog';

-- Public read model used by blog pages. security_invoker keeps public.posts RLS authoritative.
CREATE OR REPLACE VIEW public.published_blog_posts
WITH (security_invoker = true) AS
SELECT
  id,
  author_id,
  slug,
  title,
  excerpt,
  body,
  category,
  read_time_minutes,
  cover_image_url,
  tags,
  featured,
  published_at,
  created_at,
  updated_at
FROM public.posts
WHERE type = 'blog'
  AND status = 'published'
  AND slug IS NOT NULL;
