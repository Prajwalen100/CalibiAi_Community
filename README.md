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
   - `supabase/migrations/006_employer.sql` (Employer role, company profiles, job offers, employer-only job posting)
   - `supabase/migrations/007_curriculum_progress.sql` (Per-user reading progress for Resource Hub / phases curriculum)
   - `supabase/migrations/008_learning_engine_onboarding.sql` (Student onboarding state and learning roles)
   - `supabase/migrations/009_assessment_engine.sql` (Placement attempts, skill scores, and knowledge graph)
   - `supabase/migrations/010_learning_engine_core.sql` (Roadmap assignment and progress records)
   - `supabase/migrations/016_admin_blog_and_student_export.sql` (Admin blog authoring fields and student-export indexes)
   - `supabase/migrations/017_student_ai_qa.sql` (Persists each "ASK to AI" question + answer so students can revisit them; powers the saved-question count on "My AI Q&A")
   - `supabase/migrations/018_notification_application_link.sql` (Adds `application_id` to `comm_notifications` so job-application notifications link to the candidate's profile)
   - `supabase/migrations/019_avatar_url.sql` (Adds `avatar_url` to `profiles` + the public view, powering the AI-generated avatar studio)
   - `supabase/migrations/024_reading_engagement.sql` (Adds `blog_post_reads` so completed blog-post reads count toward the dashboard's Reading Engagement stat, alongside roadmap article reads and Learning Hub module completions)

   If you skip any migration, you will get setup or feature errors (for example, saving an avatar requires migration 005, squads/events require migration 004, employer hiring requires migration 006, module reading progress requires migration 007, and the student onboarding-to-assessment flow requires migrations 008–010). If you are using the Supabase SQL Editor, paste and run each file separately in numerical order; if you are using the Supabase CLI, run `supabase db push`.
3. Enable Google OAuth in Supabase Auth and set the callback URL to:
   - Local: `http://localhost:3000/api/auth/callback`
   - Vercel: `https://YOUR_DOMAIN/api/auth/callback`

## Employer vs student login

- **Student login** (`/signin`) — onboarding, roadmap, community, apply to jobs.
- **Employer login** (`/employer/signin`) — company profile (name, logo, email, location type, PAN, website, size), dashboard with applications inbox, candidate profiles, notifications, and job/gig posting.
- Jobs posted by employers appear on `/placements` (Opportunity) and `/community/jobs/opportunities`. Students apply; employers manage the pipeline and can send offers.

## Learning Hub (Phases curriculum)

- The top navigation → **Learning Hub** (`/learning-hub`) loads every lesson from the repo `phases/` folder (20 phases, 500+ modules).
- Open a phase, then a module to read the full markdown lesson. A **top progress line** tracks scroll %; signed-in users persist progress in `curriculum_progress` (migration 007).
- Routes: `/learning-hub`, `/learning-hub/[phaseId]`, `/learning-hub/[phaseId]/[moduleSlug]`. Legacy Community resource URLs redirect here.

## Admin portal

The admin portal is a standalone, light glassmorphism console at `/admin`. It has its own sign-in, separate from student and employer auth.

- **Sign in:** `http://localhost:3000/admin/signin`
  - Default testing account: `admin@calibiai.local` / `admin@90`
  - Override with `ADMIN_EMAIL` and `ADMIN_PASSWORD` (and optionally `ADMIN_SESSION_SECRET`) in the environment. Always set these in production.
- **Blog CMS** (`/admin/blog`) — write a post with title, authored by, reading time, excerpt, body, image URL, category, tags and links, then publish it. Published posts appear immediately under the **Blog** tab in the student navigation (`/blog` and `/blog/[slug]`).
- **Student data & CSV export** (`/admin/students`) — every learner who signs in is listed with name, email, phone, college, role, score and active/inactive status. Filter by status, college, role, score range or free-text search, optionally tick individual rows, then **Download CSV**. `GET /api/admin/students/export` serves the same data server-side with the same query filters.

Both features require migration `016_admin_blog_and_student_export.sql`. If Supabase is not configured, the Blog CMS falls back to a gitignored `.data/admin-blog-posts.json` file so the flow can still be demonstrated locally; student data requires `SUPABASE_SERVICE_ROLE_KEY`.

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
