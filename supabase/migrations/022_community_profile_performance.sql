-- Community profile traffic is read-heavy. These indexes make the profile and
-- sidebar queries index-backed as the community grows to hundreds of thousands
-- of members and millions of activity rows.

-- profiles.username already has a unique btree index from the initial schema.
-- Application lookups use equality (rather than ILIKE) so PostgreSQL can use it.

CREATE INDEX IF NOT EXISTS comm_posts_user_created_idx
  ON public.comm_posts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS comm_follows_following_idx
  ON public.comm_follows (following_id);

CREATE INDEX IF NOT EXISTS comm_member_badges_user_idx
  ON public.comm_member_badges (user_id);

CREATE INDEX IF NOT EXISTS comm_xp_leaderboard_idx
  ON public.comm_xp (xp DESC, user_id);

CREATE INDEX IF NOT EXISTS comm_events_upcoming_idx
  ON public.comm_events (event_date ASC)
  WHERE event_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS comm_posts_challenge_deadline_idx
  ON public.comm_posts (challenge_deadline ASC)
  WHERE post_type = 'challenge' AND challenge_deadline IS NOT NULL;
