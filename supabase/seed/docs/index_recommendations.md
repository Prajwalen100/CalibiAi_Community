# Index recommendations

The existing migrations already create the essentials. These extra
indexes materially help common dashboards:

```sql
-- Feed by community, newest first
CREATE INDEX IF NOT EXISTS idx_comm_posts_community_created
  ON public.comm_posts (community_id, created_at DESC);

-- Author profile pages
CREATE INDEX IF NOT EXISTS idx_comm_posts_user_created
  ON public.comm_posts (user_id, created_at DESC);

-- "Top this week" queries
CREATE INDEX IF NOT EXISTS idx_comm_posts_upvotes
  ON public.comm_posts (upvotes DESC, created_at DESC);

-- Comment threads
CREATE INDEX IF NOT EXISTS idx_comm_comments_post_created
  ON public.comm_comments (post_id, created_at);

-- Follower graph traversal
CREATE INDEX IF NOT EXISTS idx_comm_follows_follower
  ON public.comm_follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_comm_follows_following
  ON public.comm_follows (following_id);

-- Leaderboards
CREATE INDEX IF NOT EXISTS idx_profiles_talent
  ON public.profiles (talent_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_profiles_weekly_xp
  ON public.profiles (weekly_xp DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_profiles_streak
  ON public.profiles (current_streak DESC NULLS LAST);
```
