# CalibiAI Changes Summary — Arena Session

## Changes Made

### 1. Detailed Daily Articles (360 articles)
- Generated `content/articles/generated/article-{role}-{level}-day-{n}.json` for all 8 roadmap variants (4 roles × 2 levels × 45 days = 360).
- Each article contains ~500-600 words with theory, practical context, key takeaways, and resource links.
- Schema defined at `content/articles/article_schema.json`.
- Article reader page at `app/articles/[slug]/page.tsx`.
- Reading tracker at `app/api/reading/track/route.ts` records article engagement.

### 2. AI Lab for Tasks / Projects / Assignments
- Full LeetCode-style workspace: `components/ai-task-lab.tsx` with a line-numbered editor, language selector, local drafts, uploads, AI-check output, and detailed feedback.
- API route: `app/api/ai/task-review/route.ts` securely resolves the authored role/level/day task, evaluates the submission with DeepSeek (or a conservative deterministic fallback), persists attempts, and awards idempotent points.
- Task page: `app/assessment/task/page.tsx` opens the full-page lab without passing server callbacks into a client component.
- Practical Tasks, Mini Projects, and Assignments are validated for all 360 roadmap days (1,080 assessable activities).
- Persistence schema: `supabase/migrations/014_roadmap_ai_labs.sql`.

### 3. Quiz Functionality (Fixed)
- Component: `components/quiz-popup.tsx` with Fisher-Yates shuffling logic.
- Quiz page: `app/quiz/[day]/page.tsx` loads quiz questions from the roadmap JSON.
- Score is calculated and added to the user's profile via `app/api/score/update/route.ts`.

### 4. Score System Updates
- Updated `lib/score/config.ts`: added `reading` (100) and `quizzes` (100) weights.
- Updated `lib/score/calculate.ts`: calculates `reading_pts` and `quizzes_pts`.
- API: `app/api/score/update/route.ts` updates scores including reading and quiz data.

### 5. Dashboard Updates
- Personalized greeting: "Good morning, {Name}" using profile data.
- Daily motivation quote included in the hero banner.
- Added stats cards for Reading Engagement and Quiz Performance.
- Projects submitted appear in the "Your Projects" section.

### 6. Schema Updates
- `supabase/migrations/012_roadmap_enhancements.sql`: added weekly report fields (already existed).
- `lib/ai/schemas.ts`: unchanged (used for assessment schemas).
- Article JSON files follow `content/articles/article_schema.json`.

### 7. Daily Score Mechanism
- When a user completes a day (`roadmap/day/[day]`), the progress updates to `completed`.
- When a user reads an article, `app/api/reading/track/route.ts` logs activity.
- When a user submits a project (`app/dashboard/submit/actions.ts`), AI reviews it and updates the score.
- Quiz scores are passed to the score update API.

### Note on DeepSeek
The AI assessment and task review use DeepSeek. Ensure `DEEPSEEK_API_KEY` is set in `.env` (see `.env.example`). If DeepSeek is unavailable, the AI Lab uses a conservative deterministic rubric and clearly identifies the result as a fallback instead of fabricating an AI response.

### How to Verify
1. Visit `/roadmap` and click any day.
2. Click "Read Detailed Article" to open the article.
3. Click "Take Quiz" to open the shuffled quiz.
4. Click "Open AI Assessment" for practical tasks to submit to DeepSeek.
5. Check `/dashboard` for the personalized greeting and updated stats.
