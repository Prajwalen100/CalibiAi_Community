# ER Relationship Map — CalibiAI Seed

Legend: `A -[fk]-> B` means A.column references B(id/user_id).

## Identity + profile
- `auth.users(id)` ⇐ `public.profiles(user_id)` (1:1)
- `auth.users(id)` ⇐ `auth.identities(user_id)` (1:many)
- `auth.users(id)` ⇐ `public.scores(user_id)` (1:1)
- `auth.users(id)` ⇐ `public.seed_github_stats(user_id)` (1:1)

## Community
- `comm_communities(id)` ⇐ `comm_members(community_id)`
- `comm_communities(id)` ⇐ `comm_posts(community_id)`
- `comm_posts(id)` ⇐ `comm_comments(post_id)`
- `comm_posts(id)` ⇐ `comm_post_votes(post_id)`
- `comm_posts(id)` ⇐ `comm_post_saves(post_id)`
- `comm_comments(id)` ⇐ `comm_comments(parent_id)` (self-ref)
- `auth.users(id)` ⇐ `comm_members/comm_posts/comm_comments/comm_post_votes/
  comm_post_saves/comm_follows(follower_id, following_id)`

## Gamification
- `auth.users(id)` ⇐ `comm_xp(user_id)`  (1:1)
- `comm_badges(id)` ⇐ `comm_member_badges(badge_id)`
- `auth.users(id)` ⇐ `comm_member_badges(user_id)`

## Learning / building
- `auth.users(id)` ⇐ `public.projects(user_id)`
- `auth.users(id)` ⇐ `public.roadmaps/roadmap_progress(user_id)`

## Seed-support (added by migration 020)
- `auth.users(id)` ⇐ `seed_activity_log(user_id)`
- `auth.users(id)` ⇐ `seed_login_history(user_id)`
- `auth.users(id)` ⇐ `seed_weekly_user_xp(user_id)`
