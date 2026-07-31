-- ============================================================
-- 024_reading_engagement
--
-- The dashboard's "Reading Engagement" stat card was permanently stuck at
-- 0% because nothing in the app ever computed or persisted a nonzero
-- `scores.reading_pts`:
--   - Daily roadmap articles logged to `activity_logs` only.
--   - Learning Hub module scroll progress saved to `curriculum_progress`
--     only.
--   - Blog posts had no read-tracking at all.
--   - `recalculateAndPersistScore()` only ever re-persisted whatever
--     `reading_pts` was already stored (defaulting to 0 forever).
--
-- This migration adds the missing piece: a `blog_post_reads` table
-- (mirroring `roadmap_article_reads` from 021) so a completed blog-post
-- read can be recorded per user. `lib/score/recalculate.ts` now computes
-- Reading Engagement live from the union of:
--   - distinct roadmap articles read (`roadmap_article_reads`)
--   - distinct blog posts read (`blog_post_reads`, added here)
--   - completed Learning Hub modules (`curriculum_progress.completed`)
-- as a percentage of all currently-published readable content, so it
-- grows with every genuine read and scales automatically as more content
-- is published.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.blog_post_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_slug text NOT NULL CHECK (length(trim(post_slug)) > 0),
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, post_slug)
);

ALTER TABLE public.blog_post_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog_post_reads_own" ON public.blog_post_reads;
CREATE POLICY "blog_post_reads_own"
  ON public.blog_post_reads FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT ON public.blog_post_reads TO authenticated;

CREATE INDEX IF NOT EXISTS blog_post_reads_user_idx ON public.blog_post_reads(user_id);
