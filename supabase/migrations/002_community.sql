-- CalibiAI Community Platform Migration
-- Run this after 001_initial_schema.sql

-- ============================================================
-- FIX EXISTING SCHEMA ISSUES
-- ============================================================

-- 1. Change projects.complexity_tier from integer (1-5) to text
--    so it can store "beginner", "intermediate", "advanced"
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_complexity_tier_check;
ALTER TABLE public.projects ALTER COLUMN complexity_tier DROP DEFAULT;
ALTER TABLE public.projects ALTER COLUMN complexity_tier TYPE text USING
  CASE complexity_tier
    WHEN 1 THEN 'beginner'
    WHEN 2 THEN 'beginner'
    WHEN 3 THEN 'intermediate'
    WHEN 4 THEN 'advanced'
    WHEN 5 THEN 'advanced'
    ELSE 'beginner'
  END;
ALTER TABLE public.projects ALTER COLUMN complexity_tier SET DEFAULT 'beginner';

-- 2. Add missing columns to projects table (from project submission feature)
DO $$ BEGIN
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS how_it_works text;
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS tech_stack text;
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS module_id text;
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS ai_feedback text;
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS ai_strengths jsonb;
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS ai_improvements jsonb;
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS ai_score integer;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 3. Allow users to update their own scores (needed for project submission score recalculation)
--    Drop the admin-only write policy and replace with owner-can-update policy
DROP POLICY IF EXISTS "admin scores write" ON public.scores;
CREATE POLICY "scores_owner_update" ON public.scores FOR UPDATE USING (auth.uid() = user_id OR public.current_user_role() = 'admin') WITH CHECK (auth.uid() = user_id OR public.current_user_role() = 'admin');
CREATE POLICY "scores_owner_insert" ON public.scores FOR INSERT WITH CHECK (auth.uid() = user_id OR public.current_user_role() = 'admin');

-- ============================================================
-- COMMUNITY TABLES
-- ============================================================

-- Community groups (LLMs, RAG, Python, etc.)
CREATE TABLE IF NOT EXISTS public.comm_communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '',
  description text,
  cover_color text DEFAULT '#1f8fff',
  member_count integer NOT NULL DEFAULT 0,
  post_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User membership in communities
CREATE TABLE IF NOT EXISTS public.comm_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id uuid NOT NULL REFERENCES public.comm_communities(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, community_id)
);

-- Community posts (discussion, question, showcase, tutorial, etc.)
CREATE TABLE IF NOT EXISTS public.comm_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id uuid REFERENCES public.comm_communities(id) ON DELETE SET NULL,
  post_type text NOT NULL DEFAULT 'discussion',
  title text NOT NULL,
  content text NOT NULL,
  link_url text,
  image_url text,
  tags text[] DEFAULT '{}',
  upvotes integer NOT NULL DEFAULT 0,
  downvotes integer NOT NULL DEFAULT 0,
  comment_count integer NOT NULL DEFAULT 0,
  save_count integer NOT NULL DEFAULT 0,
  view_count integer NOT NULL DEFAULT 0,
  is_pinned boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  -- Showcase fields
  repo_url text,
  live_url text,
  demo_video_url text,
  tech_stack text[] DEFAULT '{}',
  -- Q&A fields
  is_solved boolean NOT NULL DEFAULT false,
  accepted_answer_id uuid,
  -- Challenge fields
  challenge_deadline timestamptz,
  -- Job fields
  job_type text,
  job_company text,
  job_location text,
  -- Event fields
  event_date timestamptz,
  event_type text,
  event_location text,
  -- Resource fields
  resource_type text,
  resource_url text,
  -- AI fields
  ai_score integer,
  ai_feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT comm_posts_title_check CHECK (length(title) > 2),
  CONSTRAINT comm_posts_content_check CHECK (length(content) > 0)
);
CREATE TRIGGER comm_posts_updated_at BEFORE UPDATE ON public.comm_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Post votes
CREATE TABLE IF NOT EXISTS public.comm_post_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.comm_posts(id) ON DELETE CASCADE,
  vote_type smallint NOT NULL CHECK (vote_type IN (1, -1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Saved/bookmarked posts
CREATE TABLE IF NOT EXISTS public.comm_post_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.comm_posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Comments on community posts
CREATE TABLE IF NOT EXISTS public.comm_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.comm_posts(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.comm_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  upvotes integer NOT NULL DEFAULT 0,
  is_best_answer boolean NOT NULL DEFAULT false,
  ai_suggested boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT comm_comments_content_check CHECK (length(content) > 0)
);
CREATE TRIGGER comm_comments_updated_at BEFORE UPDATE ON public.comm_comments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Comment votes
CREATE TABLE IF NOT EXISTS public.comm_comment_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id uuid NOT NULL REFERENCES public.comm_comments(id) ON DELETE CASCADE,
  vote_type smallint NOT NULL CHECK (vote_type IN (1, -1)),
  UNIQUE(user_id, comment_id)
);

-- User follows
CREATE TABLE IF NOT EXISTS public.comm_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);

-- Event RSVPs
CREATE TABLE IF NOT EXISTS public.comm_event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.comm_posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Challenge submissions
CREATE TABLE IF NOT EXISTS public.comm_challenge_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.comm_posts(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  repo_url text,
  live_url text,
  ai_score integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.comm_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL,
  post_id uuid REFERENCES public.comm_posts(id) ON DELETE SET NULL,
  comment_id uuid REFERENCES public.comm_comments(id) ON DELETE SET NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- XP and gamification
CREATE TABLE IF NOT EXISTS public.comm_xp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  daily_streak integer NOT NULL DEFAULT 0,
  last_active_date date,
  total_posts integer NOT NULL DEFAULT 0,
  total_comments integer NOT NULL DEFAULT 0,
  total_upvotes_received integer NOT NULL DEFAULT 0,
  contribution_level text NOT NULL DEFAULT 'newcomer',
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER comm_xp_updated_at BEFORE UPDATE ON public.comm_xp FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Badge definitions
CREATE TABLE IF NOT EXISTS public.comm_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  emoji text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'milestone',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User badges
CREATE TABLE IF NOT EXISTS public.comm_member_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.comm_badges(id) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- ============================================================
-- ENABLE RLS
-- ============================================================

ALTER TABLE public.comm_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comm_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comm_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comm_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comm_post_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comm_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comm_comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comm_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comm_event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comm_challenge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comm_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comm_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comm_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comm_member_badges ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Communities: public read, admin write
CREATE POLICY "communities_public_read" ON public.comm_communities FOR SELECT USING (true);
CREATE POLICY "communities_admin_write" ON public.comm_communities FOR ALL USING (public.current_user_role() = 'admin') WITH CHECK (public.current_user_role() = 'admin');

-- Members: authenticated read own, insert own
CREATE POLICY "comm_members_read" ON public.comm_members FOR SELECT USING (true);
CREATE POLICY "comm_members_insert" ON public.comm_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comm_members_delete_own" ON public.comm_members FOR DELETE USING (auth.uid() = user_id);

-- Posts: public read, authenticated insert own
CREATE POLICY "comm_posts_public_read" ON public.comm_posts FOR SELECT USING (true);
CREATE POLICY "comm_posts_insert" ON public.comm_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comm_posts_update_own" ON public.comm_posts FOR UPDATE USING (auth.uid() = user_id OR public.current_user_role() = 'admin');
CREATE POLICY "comm_posts_delete_own" ON public.comm_posts FOR DELETE USING (auth.uid() = user_id OR public.current_user_role() = 'admin');

-- Votes: authenticated insert/delete own
CREATE POLICY "comm_post_votes_read" ON public.comm_post_votes FOR SELECT USING (true);
CREATE POLICY "comm_post_votes_insert" ON public.comm_post_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comm_post_votes_delete_own" ON public.comm_post_votes FOR DELETE USING (auth.uid() = user_id);

-- Saves: insert/delete own
CREATE POLICY "comm_post_saves_read" ON public.comm_post_saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "comm_post_saves_insert" ON public.comm_post_saves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comm_post_saves_delete" ON public.comm_post_saves FOR DELETE USING (auth.uid() = user_id);

-- Comments: public read, authenticated insert own
CREATE POLICY "comm_comments_public_read" ON public.comm_comments FOR SELECT USING (true);
CREATE POLICY "comm_comments_insert" ON public.comm_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comm_comments_update_own" ON public.comm_comments FOR UPDATE USING (auth.uid() = user_id OR public.current_user_role() = 'admin');
CREATE POLICY "comm_comments_delete_own" ON public.comm_comments FOR DELETE USING (auth.uid() = user_id OR public.current_user_role() = 'admin');

-- Comment votes
CREATE POLICY "comm_comment_votes_read" ON public.comm_comment_votes FOR SELECT USING (true);
CREATE POLICY "comm_comment_votes_insert" ON public.comm_comment_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comm_comment_votes_delete_own" ON public.comm_comment_votes FOR DELETE USING (auth.uid() = user_id);

-- Follows: read public, insert/delete own
CREATE POLICY "comm_follows_read" ON public.comm_follows FOR SELECT USING (true);
CREATE POLICY "comm_follows_insert" ON public.comm_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "comm_follows_delete" ON public.comm_follows FOR DELETE USING (auth.uid() = follower_id);

-- Event RSVPs
CREATE POLICY "comm_event_rsvps_read" ON public.comm_event_rsvps FOR SELECT USING (true);
CREATE POLICY "comm_event_rsvps_insert" ON public.comm_event_rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comm_event_rsvps_delete" ON public.comm_event_rsvps FOR DELETE USING (auth.uid() = user_id);

-- Challenge entries
CREATE POLICY "comm_challenge_entries_read" ON public.comm_challenge_entries FOR SELECT USING (true);
CREATE POLICY "comm_challenge_entries_insert" ON public.comm_challenge_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications: read own only
CREATE POLICY "comm_notifications_read" ON public.comm_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "comm_notifications_update" ON public.comm_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "comm_notifications_insert" ON public.comm_notifications FOR INSERT WITH CHECK (auth.uid() = user_id OR public.current_user_role() = 'admin');

-- XP: public read, admin/system write
CREATE POLICY "comm_xp_public_read" ON public.comm_xp FOR SELECT USING (true);
CREATE POLICY "comm_xp_insert" ON public.comm_xp FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comm_xp_update" ON public.comm_xp FOR UPDATE USING (auth.uid() = user_id OR public.current_user_role() = 'admin');

-- Badges: public read, admin write
CREATE POLICY "comm_badges_read" ON public.comm_badges FOR SELECT USING (true);
CREATE POLICY "comm_badges_admin" ON public.comm_badges FOR ALL USING (public.current_user_role() = 'admin') WITH CHECK (public.current_user_role() = 'admin');

-- Member badges: public read, admin insert
CREATE POLICY "comm_member_badges_read" ON public.comm_member_badges FOR SELECT USING (true);
CREATE POLICY "comm_member_badges_insert" ON public.comm_member_badges FOR INSERT WITH CHECK (public.current_user_role() = 'admin' OR auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-increment community member_count
CREATE OR REPLACE FUNCTION public.update_community_member_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.comm_communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.comm_communities SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER trg_community_member_count
  AFTER INSERT OR DELETE ON public.comm_members
  FOR EACH ROW EXECUTE FUNCTION public.update_community_member_count();

-- Auto-increment community post_count
CREATE OR REPLACE FUNCTION public.update_community_post_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.comm_communities SET post_count = post_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.comm_communities SET post_count = GREATEST(post_count - 1, 0) WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER trg_community_post_count
  AFTER INSERT OR DELETE ON public.comm_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_community_post_count();

-- Auto-increment post comment_count
CREATE OR REPLACE FUNCTION public.update_post_comment_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.comm_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.comm_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER trg_post_comment_count
  AFTER INSERT OR DELETE ON public.comm_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comment_count();

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO public.comm_communities (slug, name, emoji, description, sort_order) VALUES
  ('general-ai', 'General AI', '🤖', 'Everything about artificial intelligence — news, trends, and open discussions.', 1),
  ('prompt-engineering', 'Prompt Engineering', '🧠', 'Master the art and science of prompting LLMs effectively.', 2),
  ('llms', 'LLMs', '🦜', 'Large Language Models — GPT, Claude, Gemini, Llama, Mistral and more.', 3),
  ('rag', 'RAG', '📚', 'Retrieval-Augmented Generation patterns, tools, and best practices.', 4),
  ('ai-agents', 'AI Agents', '🤖', 'Autonomous AI agents, LangGraph, CrewAI, AutoGen and frameworks.', 5),
  ('mcp', 'MCP', '🔌', 'Model Context Protocol — standards, tools, and integrations.', 6),
  ('langchain', 'LangChain', '🔥', 'LangChain ecosystem — chains, agents, tools, and deployments.', 7),
  ('n8n', 'n8n', '⚡', 'n8n automation workflows and AI integrations.', 8),
  ('python', 'Python', '🐍', 'Python for AI development — libraries, tips, and projects.', 9),
  ('java-spring', 'Java & Spring Boot', '☕', 'Java and Spring Boot for AI-powered applications.', 10),
  ('career-placements', 'Career & Placements', '💼', 'Career advice, interview prep, and placement opportunities.', 11),
  ('startups', 'Startups', '🚀', 'AI startup ideas, funding, building, and scaling.', 12),
  ('hackathons', 'Hackathons', '🏆', 'Find teammates, share projects, and discuss hackathon experiences.', 13),
  ('college', 'College Discussions', '🎓', 'Campus life, events, and college-specific discussions.', 14),
  ('research-papers', 'Research Papers', '📄', 'AI research paper discussions, summaries, and reviews.', 15);

INSERT INTO public.comm_badges (slug, name, description, emoji, category) VALUES
  ('first-post', 'First Post', 'Published your first community post', '✍️', 'milestone'),
  ('helpful', 'Helpful', 'Received 10 upvotes on a post', '💡', 'contribution'),
  ('showcase-star', 'Showcase Star', 'Featured project in showcase', '⭐', 'contribution'),
  ('streak-7', '7-Day Streak', 'Active for 7 consecutive days', '🔥', 'milestone'),
  ('streak-30', '30-Day Streak', 'Active for 30 consecutive days', '🔥', 'milestone'),
  ('community-builder', 'Community Builder', 'Joined 5+ communities', '🏗️', 'skill'),
  ('challenge-winner', 'Challenge Winner', 'Won a weekly challenge', '🏆', 'special'),
  ('mentor-badge', 'Mentor', 'Answered 20+ questions helpfully', '🎓', 'contribution'),
  ('top-contributor', 'Top Contributor', 'Top 10 contributor this month', '🌟', 'special'),
  ('question-master', 'Question Master', 'Asked 10+ questions with accepted answers', '❓', 'skill');
