# Storage folder layout

These are the canonical Supabase Storage bucket paths the app expects.
You do **not** have to upload real media for local dev — the SQL seed
writes deterministic paths that resolve to `.gitkeep` placeholders here.

```
supabase/seed/storage/
  avatars/                # (unused — we use DiceBear URLs)
  community-banners/      # 1 file per community, keyed by slug
  post-covers/            # optional cover images per showcase post
  project-thumbnails/     # optional thumbnails per project
  user-portfolios/        # per-user portfolio assets (Production Ready)
```

On Supabase, replicate these with:

```bash
supabase storage create-bucket community-banners --public
supabase storage create-bucket post-covers --public
supabase storage create-bucket project-thumbnails --public
supabase storage create-bucket user-portfolios --public
```

The SQL seed does *not* create buckets — it only records the paths
(`/storage/community-banners/<slug>.png`, etc.) so your app renders
broken images gracefully when the bucket is empty.
