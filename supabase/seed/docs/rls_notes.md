# RLS compatibility notes

The seed **bypasses RLS** because it runs under the `service_role` /
`postgres` superuser connection. Every table that RLS applies to gets
rows inserted safely because:

* Rows are inserted with the correct `user_id` / `auth.uid()` values.
* `INSERT ... ON CONFLICT DO NOTHING/UPDATE` respects existing rows.
* Public-read policies (`comm_communities`, `comm_posts`, `comm_comments`,
  `comm_post_votes`, `comm_follows`, `comm_xp`, `comm_badges`,
  `comm_member_badges`) render the seed to logged-out visitors.
* Private tables (`comm_notifications`, `comm_post_saves`) are readable
  only by the owning user — the seed still writes them so the "Saved
  for later" UI shows content when a seeded user logs in.
* `profiles` has an owner-or-admin read policy; a real app should also
  rely on `public.comm_public_profiles` (a SECURITY DEFINER view) to
  render other people's profile chips without exposing PII.

**Do NOT run the SQL with the `anon` or `authenticated` key** — the
insert into `auth.users` requires elevated privileges. Use the
Supabase CLI (`supabase db reset`) or a `psql` connection with the
service role's DB password.
