import "server-only";

import { calculateCalibiAiScore, calculateReadingEngagement, tierFor, type ScoreBreakdown } from "@/lib/score/calculate";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getCurriculumStats } from "@/lib/curriculum/catalog";
import { STATIC_BLOG_POSTS } from "@/lib/blog/posts";
import { stageAdjustedTotal } from "@/lib/roadmap/scoring";
import { resolvePlacementThreshold } from "@/lib/roadmap/settings";
import { isRoadmapStage } from "@/lib/roadmap/types";

type RecalculateOverrides = {
  /** 0-100 reading engagement percentage. Falls back to the live computation below. */
  readingScore?: number;
  /** 0-100 quiz average percentage. Falls back to the last stored quizzes_pts. */
  quizAverage?: number;
};

/**
 * Recomputes a user's Talent Score from their live data (verified projects,
 * verified skills, roadmap completion, community XP) and persists it to the
 * `scores` table using the admin client so it always succeeds regardless of
 * RLS. Used both right after score-affecting actions (community activity,
 * project verification, quiz/reading tracking) and as a self-healing
 * recompute-on-read fallback on the public profile page, so the number never
 * silently drifts out of date.
 *
 * Returns null (without writing anything) if the required tables are
 * unavailable — callers should fall back to whatever is already stored.
 */
export async function recalculateAndPersistScore(
  userId: string,
  overrides?: RecalculateOverrides,
): Promise<ScoreBreakdown | null> {
  const supabase = createAdminSupabaseClient();

  const [
    projectsResult,
    skillsResult,
    activeStageResult,
    xpResult,
    currentScoreResult,
    assessmentResult,
    articlesReadResult,
    blogReadsResult,
    modulesCompletedResult,
    publishedBlogCountResult,
  ] = await Promise.all([
    supabase.from("projects").select("verified,points_awarded,originality_status").eq("user_id", userId),
    supabase.from("user_skills").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("verified", true),
    // Scoped to the active stage below; see `activeStage` resolution.
    supabase
      .from("user_roadmaps")
      .select("id,role,level,roadmap_stage,entry_stage,assessment_score")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("stage_index", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("comm_xp").select("xp, last_active_date, updated_at").eq("user_id", userId).maybeSingle(),
    supabase.from("scores").select("completion_pts,recognition_pts,reading_pts,quizzes_pts").eq("user_id", userId).maybeSingle(),
    // Keep an independent source for the onboarding assessment contribution.
    // This makes a previously reset score recoverable from persisted work.
    supabase
      .from("assessment_results")
      .select("overall_score")
      .eq("user_id", userId)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Reading Engagement inputs — every table here is optional: a missing
    // migration (021/024) or an empty result must never fail the whole
    // recalculation, it should just contribute 0 to that source.
    supabase.from("roadmap_article_reads").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("blog_post_reads").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("curriculum_progress").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("completed", true),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("type", "blog").eq("status", "published").not("slug", "is", null),
  ]);

  if (projectsResult.error) return null;

  // Stage-scoped progress. Both stages number their days 1..45, so counting
  // completions by user_id alone would double-count once a learner has been
  // promoted and inflate the completion component of their score.
  const activeStage = activeStageResult.data as
    | {
        id: string;
        role?: string | null;
        level?: string | null;
        roadmap_stage?: string | null;
        entry_stage?: string | null;
        assessment_score?: number | null;
      }
    | null;

  const progressQuery = supabase.from("roadmap_progress").select("status").eq("user_id", userId);
  const progressResult = await (activeStage?.id
    ? progressQuery.eq("user_roadmap_id", activeStage.id)
    : progressQuery);
  if (progressResult.error) return null;

  const progress = progressResult.data ?? [];
  const currentScore = currentScoreResult.data as
    | { completion_pts?: number; recognition_pts?: number; reading_pts?: number; quizzes_pts?: number }
    | null;
  const xpRow = xpResult.data as { xp?: number; last_active_date?: string | null; updated_at?: string | null } | null;

  // Reading Engagement: percentage of all currently-published readable
  // content (daily roadmap articles + blog posts + Learning Hub modules)
  // this learner has completed. Every count below degrades to 0 rather than
  // throwing when its table/migration is missing, so a fresh install still
  // computes (an all-zero, but honest) percentage instead of erroring out.
  const totalCurriculumModules = (() => {
    try {
      return getCurriculumStats().modules;
    } catch {
      return 0;
    }
  })();
  const liveReadingScore = calculateReadingEngagement({
    articlesRead: articlesReadResult.count ?? 0,
    totalArticles: progress.length,
    blogPostsRead: blogReadsResult.count ?? 0,
    totalBlogPosts: publishedBlogCountResult.count ?? STATIC_BLOG_POSTS.length,
    modulesCompleted: modulesCompletedResult.count ?? 0,
    totalModules: totalCurriculumModules,
  });

  const calculated = calculateCalibiAiScore({
    projects: (projectsResult.data ?? []).map((project) => ({
      verified: project.verified,
      pointsAwarded: project.points_awarded,
      originalityStatus: project.originality_status,
    })),
    verifiedSkillsCount: skillsResult.count ?? 0,
    completedModulesCount: progress.filter((item) => item.status === "completed").length,
    totalModulesCount: Math.max(progress.length, 1),
    // Community points are sourced from the live comm_xp ledger (posts,
    // comments, upvotes received, etc.), not a stale copy — this is what
    // makes community activity actually move the Talent Score.
    communityRawPoints: xpRow?.xp ?? 0,
    recognitionRawPoints: currentScore?.recognition_pts ?? 0,
    readingScore: overrides?.readingScore ?? liveReadingScore,
    quizAverage: overrides?.quizAverage ?? currentScore?.quizzes_pts ?? 0,
    lastActivityAt: xpRow?.last_active_date ?? xpRow?.updated_at ?? null,
    now: new Date(),
  });

  // AI Lab / roadmap completion points only ever grow from verified work;
  // never let a recalculation erase points already earned. Assessment results
  // are also retained independently, allowing recovery if an old initializer
  // accidentally replaced a score row with zeroes.
  const assessmentPoints = Math.round(Number(assessmentResult.data?.overall_score ?? 0) * 0.5);
  const completionPoints = Math.max(
    calculated.completion_pts,
    currentScore?.completion_pts ?? 0,
    assessmentPoints,
  );
  const rawTotal = Math.min(1000, calculated.total - calculated.completion_pts + completionPoints);

  // Stage banding. The additive engine above is unchanged; its raw 0-1000
  // result is then projected into the band the learner's current stage allows
  // (Beginner 150-650, Intermediate 650-1000, direct-Intermediate 350-500 up
  // to 1000). This is what stops a Beginner a few lessons in from showing the
  // same Talent Score as an Intermediate doing production-grade work.
  const stage = isRoadmapStage(activeStage?.roadmap_stage)
    ? activeStage.roadmap_stage
    : isRoadmapStage(activeStage?.level)
      ? activeStage.level
      : null;
  const entryStage = isRoadmapStage(activeStage?.entry_stage) ? activeStage.entry_stage : stage;

  let total = rawTotal;
  if (stage && entryStage) {
    total = stageAdjustedTotal({
      rawTotal,
      stage,
      entryStage,
      hasRoadmap: true,
      assessmentScore: activeStage?.assessment_score ?? assessmentResult.data?.overall_score ?? 0,
      placementThreshold: await resolvePlacementThreshold(),
    });
  }

  const breakdown: ScoreBreakdown = { ...calculated, completion_pts: completionPoints, total, tier: tierFor(total) };

  await supabase.from("scores").upsert(
    {
      user_id: userId,
      projects_pts: breakdown.projects_pts,
      skills_pts: breakdown.skills_pts,
      community_pts: breakdown.community_pts,
      completion_pts: breakdown.completion_pts,
      recognition_pts: breakdown.recognition_pts,
      reading_pts: breakdown.reading_pts,
      quizzes_pts: breakdown.quizzes_pts,
      total: breakdown.total,
      tier: breakdown.tier,
      last_calculated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  return breakdown;
}
