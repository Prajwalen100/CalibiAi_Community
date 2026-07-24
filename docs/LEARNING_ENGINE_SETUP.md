# Personalized Learning Engine — Supabase and Amazon Bedrock setup

This guide is the deployment companion for the learning-engine implementation. Curriculum is **always** read from `content/assessment` and `content/roadmap`; Bedrock is allowed to personalize only.

## 1. Supabase migration

Apply all migrations in numerical order. For a CLI-linked project:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Or open the Supabase SQL editor and run `supabase/migrations/001_initial_schema.sql` through the newest migration in order. The learning engine depends on migrations `008_learning_engine_onboarding.sql`, `009_assessment_engine.sql`, and `010_learning_engine_core.sql`.

After migration, confirm the following in the Supabase Table Editor: `profiles`, `assessment_results`, `skill_scores`, `knowledge_graph`, `roadmaps`, `user_roadmaps`, `roadmap_progress`, `weekly_reports`, and `ai_invocations`.

## 2. Environment variables

Copy `.env.example` to `.env.local`. Required values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... # server/background work only
AWS_REGION=ap-south-1
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20240620-v1:0
```

`BEDROCK_CLAUDE_MODEL_ID` remains supported for the existing project-review integration. Never prefix AWS or Supabase service-role variables with `NEXT_PUBLIC_`.

## 3. Amazon Bedrock instructions

1. In the AWS account and selected region, request/enable access to the configured Anthropic Claude model in **Bedrock → Model access**.
2. Give the server runtime an IAM role/user with only `bedrock:InvokeModel` (and `bedrock:InvokeModelWithResponseStream` only if streaming is later enabled) for the chosen model ARN.
3. Set `AWS_REGION` and `BEDROCK_MODEL_ID` (or legacy `BEDROCK_CLAUDE_MODEL_ID`) in local and hosting environment settings.
4. Keep all invocations server-side through `lib/ai/bedrockClient.ts`; browser code must never contain AWS credentials.
5. Use low temperature (≤0.3) and schema validation. On an unavailable model, preserve the deterministic fallback: raw roadmap ordering, a lite weekly review, and no generated curriculum.

## 4. Smooth local run

```bash
npm ci
cp .env.example .env.local
# fill .env.local, apply migrations, configure Google OAuth callback
npm run dev
```

Open `http://localhost:3000`. Sign in, visit `/onboarding`, then `/assessment`. The app requires Supabase Auth cookies, so assessment APIs cannot be exercised anonymously.

Validation commands:

```bash
npm run lint
npm test
npm run typecheck
```

The repository currently contains standalone TypeScript examples under `phases/` that are included by the root TypeScript configuration and cause unrelated global-name/dependency errors. Validate changed app code separately until that training-content configuration is excluded from root typechecking.

## 5. Production checklist

- Add Supabase Auth redirect URLs for the production domain.
- Set all server secrets in Vercel/your host, not in Git.
- Apply migrations before deploying application code.
- Enable Bedrock model access in the same region configured in the app.
- Keep `content/` files immutable; user personalization belongs in `user_roadmaps.personalization`.
- Add a scheduled server/edge job that invokes the weekly-review eligibility scan; do not call Bedrock on dashboard reads.
