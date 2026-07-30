# Seed execution order

The `99_seed_all.sql` orchestrator runs everything in this exact order.
Every file is idempotent (`ON CONFLICT DO NOTHING/UPDATE`) so you can
re-run individually during iteration.

1. `020_seed_support_tables.sql`  (migration — adds seed tables & columns)
2. `00_reset.sql`                 (**dev only** — wipes seeded rows)
3. `01_auth_users.sql`            (300 auth.users + identities)
4. `02_profiles.sql`              (300 profiles)
5. `03_scores.sql`                (300 talent-score breakdowns)
6. `04_communities.sql`           (20 communities)
7. `05_community_members.sql`     (~1,500 memberships)
8. `06_posts.sql`                 (400 posts)
9. `07_comments.sql`              (2,000 comments — parents before children)
10. `08_post_votes.sql`           (12,000 likes)
11. `09_post_saves.sql`           (1,500 bookmarks)
12. `10_follows.sql`              (natural follower graph)
13. `11_projects.sql`             (600 projects)
14. `12_badges.sql`               (badge catalog — upsert)
15. `13_member_badges.sql`        (badge awards)
16. `14_xp.sql`                   (comm_xp + counter reconciliation)
17. `15_activity_log.sql`         (3,000 activities)
18. `16_daily_missions.sql`       (50 missions)
19. `17_login_history.sql`        (365-day login events)
20. `18_weekly_stats.sql`         (52 weeks + top-100 XP snapshots)
21. `19_github_stats.sql`         (50 GitHub profiles)
22. `20_recalc.sql`               (counters, trending, leaderboard refresh)
