# Foreign key inventory

| Table                         | Column                | References                 | On delete |
|-------------------------------|-----------------------|----------------------------|-----------|
| profiles                      | user_id               | auth.users(id)             | CASCADE   |
| scores                        | user_id               | auth.users(id)             | CASCADE   |
| projects                      | user_id               | auth.users(id)             | CASCADE   |
| roadmap_progress              | user_id               | auth.users(id)             | CASCADE   |
| comm_members                  | user_id               | auth.users(id)             | CASCADE   |
| comm_members                  | community_id          | comm_communities(id)       | CASCADE   |
| comm_posts                    | user_id               | auth.users(id)             | CASCADE   |
| comm_posts                    | community_id          | comm_communities(id)       | SET NULL  |
| comm_comments                 | user_id               | auth.users(id)             | CASCADE   |
| comm_comments                 | post_id               | comm_posts(id)             | CASCADE   |
| comm_comments                 | parent_id             | comm_comments(id)          | CASCADE   |
| comm_post_votes               | user_id, post_id      | auth.users, comm_posts     | CASCADE   |
| comm_post_saves               | user_id, post_id      | auth.users, comm_posts     | CASCADE   |
| comm_follows                  | follower_id           | auth.users(id)             | CASCADE   |
| comm_follows                  | following_id          | auth.users(id)             | CASCADE   |
| comm_xp                       | user_id               | auth.users(id)             | CASCADE   |
| comm_member_badges            | user_id, badge_id     | auth.users, comm_badges    | CASCADE   |
| seed_activity_log             | user_id               | auth.users(id)             | CASCADE   |
| seed_login_history            | user_id               | auth.users(id)             | CASCADE   |
| seed_weekly_user_xp           | user_id               | auth.users(id)             | CASCADE   |
| seed_github_stats             | user_id               | auth.users(id)             | CASCADE   |
