# Performance considerations

* All inserts are batched (100–500 rows per statement) to keep the
  write-ahead-log entries small and let Postgres commit efficiently.
* `SET LOCAL session_replication_role = replica` is used only during
  `auth.users` insertion so we don't fire trigger recursion.
* Counter reconciliation (`20_recalc.sql`) runs once at the end
  instead of relying purely on triggers — this is 30–40× faster
  because the triggers were disabled during bulk load.
* `refresh_leaderboards()` runs on demand; wire it into a cron
  (`select cron.schedule('lb-refresh', '*/15 * * * *', 'select public.refresh_leaderboards()')`)
  once you install pg_cron.
* The follower graph is O(edges) ≈ 25k rows. If you need it larger,
  switch the emitter to `COPY FROM STDIN` — same code path, ~5× faster.
* pgvector rows are NOT seeded (no embeddings) to keep the seed under
  128 MB. Fill them separately from the embedding worker.
