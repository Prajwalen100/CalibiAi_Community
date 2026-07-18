import { SCORE_WEIGHTS, TIERS, type ScoreTier } from "@/lib/score/config";

export type ScoreInput = {
  projects: Array<{ verified: boolean; pointsAwarded: number; originalityStatus?: "passed" | "flagged" | "pending" | string }>;
  verifiedSkillsCount: number;
  completedModulesCount: number;
  totalModulesCount: number;
  communityRawPoints: number;
  recognitionRawPoints: number;
  lastActivityAt?: Date | string | null;
  now?: Date;
};

export type ScoreBreakdown = {
  projects_pts: number;
  skills_pts: number;
  community_pts: number;
  completion_pts: number;
  recognition_pts: number;
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
  const total = clamp(projects_pts + skills_pts + community_pts + completion_pts + recognition_pts, 1000);
  return { projects_pts, skills_pts, community_pts, completion_pts, recognition_pts, total, tier: tierFor(total), flagged };
}
