import { SCORE_WEIGHTS, TIERS, type ScoreTier } from "@/lib/score/config";

export type ScoreInput = {
  projects: Array<{ verified: boolean; pointsAwarded: number; originalityStatus?: "passed" | "flagged" | "pending" | string }>;
  verifiedSkillsCount: number;
  completedModulesCount: number;
  totalModulesCount: number;
  communityRawPoints: number;
  recognitionRawPoints: number;
  readingScore?: number; // 0-100 based on article engagement
  quizAverage?: number; // 0-100 based on quiz performance
  lastActivityAt?: Date | string | null;
  now?: Date;
};

export type ReadingEngagementInput = {
  /** Distinct daily roadmap articles the learner has scrolled to the end of. */
  articlesRead: number;
  /** Total articles available on the learner's assigned roadmap. */
  totalArticles: number;
  /** Distinct blog posts the learner has scrolled to the end of. */
  blogPostsRead: number;
  /** Total currently-published blog posts. */
  totalBlogPosts: number;
  /** Learning Hub phase modules marked completed (>=95% scrolled). */
  modulesCompleted: number;
  /** Total Learning Hub phase modules in the curriculum. */
  totalModules: number;
};


export type ScoreBreakdown = {
  projects_pts: number;
  skills_pts: number;
  community_pts: number;
  completion_pts: number;
  recognition_pts: number;
  reading_pts: number;
  quizzes_pts: number;
  total: number;
  tier: ScoreTier;
  flagged: boolean;
};

function clamp(value: number, max: number) { return Math.max(0, Math.min(max, Math.round(value))); }

export function communityDecayMultiplier(lastActivityAt: ScoreInput["lastActivityAt"], now = new Date()): number {
  if (!lastActivityAt) return 0.6;
  const last = typeof lastActivityAt === "string" ? new Date(lastActivityAt) : lastActivityAt;
  const days = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 14) return 1;
  if (days <= 30) return 0.8;
  if (days <= 60) return 0.55;
  return 0.3;
}

export function tierFor(total: number): ScoreTier {
  return TIERS.find((tier) => total >= tier.min && total <= tier.max)?.tier ?? "platinum";
}

/**
 * Reading Engagement is the percentage of all currently-published readable
 * content a learner has completed (scrolled to the end of): daily roadmap
 * articles, blog posts, and Learning Hub phase modules, combined into one
 * pool. Each individual completed read moves this by a small, content-size
 * dependent amount rather than a fixed 0.1% — the percentage automatically
 * re-scales as more articles/posts/modules are published, the same way
 * `completion_pts` re-scales against `totalModulesCount`.
 *
 * Returns 0 when there is no readable content at all, so a fresh install
 * never divides by zero.
 */
export function calculateReadingEngagement(input: ReadingEngagementInput): number {
  const read = Math.max(0, input.articlesRead) + Math.max(0, input.blogPostsRead) + Math.max(0, input.modulesCompleted);
  const total = Math.max(0, input.totalArticles) + Math.max(0, input.totalBlogPosts) + Math.max(0, input.totalModules);
  if (total <= 0) return 0;
  return clamp((read / total) * 100, 100);
}

export function calculateCalibiAiScore(input: ScoreInput): ScoreBreakdown {
  const flagged = input.projects.some((project) => project.originalityStatus === "flagged");
  const projectPoints = input.projects
    .filter((project) => project.verified && project.originalityStatus !== "flagged")
    .reduce((sum, project) => sum + project.pointsAwarded, 0);
  const projects_pts = clamp(projectPoints, SCORE_WEIGHTS.projects);
  const skills_pts = clamp(input.verifiedSkillsCount * 25, SCORE_WEIGHTS.skills);
  const completionRatio = input.totalModulesCount > 0 ? input.completedModulesCount / input.totalModulesCount : 0;
  const completion_pts = clamp(completionRatio * SCORE_WEIGHTS.completion, SCORE_WEIGHTS.completion);
  const community_pts = clamp(input.communityRawPoints * communityDecayMultiplier(input.lastActivityAt, input.now), SCORE_WEIGHTS.community);
  const recognition_pts = clamp(input.recognitionRawPoints, SCORE_WEIGHTS.recognition);
  const reading_pts = clamp((input.readingScore ?? 0) * (SCORE_WEIGHTS.reading / 100), SCORE_WEIGHTS.reading);
  const quizzes_pts = clamp((input.quizAverage ?? 0) * (SCORE_WEIGHTS.quizzes / 100), SCORE_WEIGHTS.quizzes);
  const total = clamp(projects_pts + skills_pts + community_pts + completion_pts + recognition_pts + reading_pts + quizzes_pts, 1000);
  return { projects_pts, skills_pts, community_pts, completion_pts, recognition_pts, reading_pts, quizzes_pts, total, tier: tierFor(total), flagged };
}
