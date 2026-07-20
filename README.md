# CalibiAI Community

A Next.js + Supabase implementation of the CalibiAI MVP: public conversion pages, Google auth onboarding, AI-generated verified roadmaps, deterministic scoring, public Verified AI Profiles, and a Supabase schema with RLS.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS
- Supabase Auth + Postgres with RLS
- Amazon Bedrock via a single server-side `lib/ai` module
- Deterministic CalibiAI Score in `lib/score` with Vitest tests

## Local setup

1. Copy `.env.example` to `.env.local` and fill in Supabase values.
2. Apply the Supabase migrations to your Supabase project, in order:
   - `supabase/migrations/001_initial_schema.sql` (Base schema: profiles, projects, skills, roadmaps, scores)
   - `supabase/migrations/002_community.sql` (Community posts, discussions, comments, likes)
   - `supabase/migrations/003_community_feed_and_jobs.sql` (Community feed views and structured job postings)
   - `supabase/migrations/004_squads_events_applications.sql` (Team Finder squads, events, and job applications)
   - `supabase/migrations/005_profile_avatars.sql` (Adds `avatar_id` to profiles table & updates community public views)

   If you skip any migration, you will get setup or feature errors (for example, saving an avatar requires migration 005, and squads/events require migration 004). If you are using the Supabase SQL Editor, paste and run each file separately in numerical order; if you are using the Supabase CLI, run `supabase db push`.
3. Enable Google OAuth in Supabase Auth and set the callback URL to:
   - Local: `http://localhost:3000/api/auth/callback`
   - Vercel: `https://YOUR_DOMAIN/api/auth/callback`
4. Install and run:

```bash
npm install
npm run dev
```

## Vercel environment variables

Set these in Vercel Project Settings:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
BEDROCK_CLAUDE_MODEL_ID=anthropic.claude-3-5-sonnet-20240620-v1:0
BEDROCK_TITAN_EMBEDDING_MODEL_ID=amazon.titan-embed-text-v2:0
```

`SUPABASE_SERVICE_ROLE_KEY` and AWS credentials are server-only. Do not expose them to client components.

## Important product constraints implemented

- No AI features on public marketing pages.
- No self-serve hiring marketplace or startup billing.
- All Bedrock calls are server-side through `lib/ai/bedrock.ts`.
- Roadmap AI output is validated with Zod before persistence.
- Score arithmetic is deterministic and unit-tested in `lib/score`.
- RLS is enabled for every user-data table in the initial migration.
- Public profiles only show verified projects and verified skills.
