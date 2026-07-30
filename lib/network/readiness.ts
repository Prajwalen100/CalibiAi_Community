/**
 * Network readiness / unlock-checklist calculations.
 *
 * Kept as pure functions so the numbers shown on the Network page are derived
 * from real learner data (roadmap progress, verified projects, talent score)
 * instead of hardcoded placeholders, and so they can be unit tested.
 */

/** Verified, published projects required for a complete public portfolio. */
export const REQUIRED_PORTFOLIO_PROJECTS = 12;

/** Talent Score required to unlock Network. */
export const REQUIRED_TALENT_SCORE = 850;

/**
 * Buffer added on top of the remaining roadmap days to account for the
 * non-roadmap work that also gates Network: community activity, project
 * submissions, capstone review and technical verification.
 */
export const NON_ROADMAP_BUFFER_DAYS = 20;

/** Minimum average AI verification rating (out of 10) across projects. */
export const REQUIRED_PROJECT_RATING = 8.5;

export type ChecklistStatus = "completed" | "pending" | "locked";

export type NetworkReadinessInput = {
  currentScore: number;
  /** Total days in the learner's assigned roadmap. */
  totalRoadmapDays: number;
  /** Days marked completed in `roadmap_progress`. */
  completedRoadmapDays: number;
  /** Count of the learner's verified projects. */
  verifiedProjectsCount: number;
  /** Average AI score (0-100) across the learner's scored projects, if any. */
  averageProjectScore: number | null;
  /** Whether the learner has at least one verified project with a repo URL. */
  hasGithubPortfolio: boolean;
  /** Whether a verified capstone-tier project exists. */
  hasCapstone: boolean;
};

export type NetworkReadiness = {
  currentScore: number;
  requiredScore: number;
  remainingScore: number;
  scorePercent: number;
  totalRoadmapDays: number;
  completedRoadmapDays: number;
  remainingRoadmapDays: number;
  /** Remaining roadmap days plus the non-roadmap buffer. */
  estimatedDaysToUnlock: number;
  isRoadmapComplete: boolean;
  verifiedProjectsCount: number;
  requiredProjects: number;
  /** Verified projects still needed for a complete portfolio. */
  remainingProjects: number;
  isPortfolioComplete: boolean;
  averageProjectRating: number | null;
  meetsRatingBar: boolean;
  hasGithubPortfolio: boolean;
  hasCapstone: boolean;
  completedRequirements: number;
  totalRequirements: number;
};

function clampNonNegative(value: number) {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

/**
 * Resolves every number the Network page needs from live learner data.
 */
export function calculateNetworkReadiness(
  input: NetworkReadinessInput
): NetworkReadiness {
  const currentScore = clampNonNegative(input.currentScore);
  const requiredScore = REQUIRED_TALENT_SCORE;
  const remainingScore = Math.max(0, requiredScore - currentScore);
  const scorePercent = Math.min(100, Math.round((currentScore / 1000) * 100));

  const totalRoadmapDays = clampNonNegative(input.totalRoadmapDays);
  const completedRoadmapDays = Math.min(
    clampNonNegative(input.completedRoadmapDays),
    totalRoadmapDays
  );
  const remainingRoadmapDays = Math.max(
    0,
    totalRoadmapDays - completedRoadmapDays
  );

  // The roadmap only counts as complete when it exists AND every day is done.
  // A learner with no assigned roadmap must never show "completed".
  const isRoadmapComplete =
    totalRoadmapDays > 0 && completedRoadmapDays >= totalRoadmapDays;

  const verifiedProjectsCount = clampNonNegative(input.verifiedProjectsCount);
  const requiredProjects = REQUIRED_PORTFOLIO_PROJECTS;
  const remainingProjects = Math.max(
    0,
    requiredProjects - verifiedProjectsCount
  );
  const isPortfolioComplete = verifiedProjectsCount >= requiredProjects;

  // Project scores are stored 0-100; the checklist presents them out of 10.
  const averageProjectRating =
    typeof input.averageProjectScore === "number" &&
    Number.isFinite(input.averageProjectScore)
      ? Math.round((input.averageProjectScore / 10) * 10) / 10
      : null;
  const meetsRatingBar =
    averageProjectRating !== null &&
    averageProjectRating >= REQUIRED_PROJECT_RATING;

  const completedRequirements = [
    currentScore >= requiredScore,
    isRoadmapComplete,
    input.hasCapstone,
    false, // AI technical interview stays gated until the rest is done
    input.hasGithubPortfolio,
    isPortfolioComplete,
    meetsRatingBar,
  ].filter(Boolean).length;

  return {
    currentScore,
    requiredScore,
    remainingScore,
    scorePercent,
    totalRoadmapDays,
    completedRoadmapDays,
    remainingRoadmapDays,
    // Remaining roadmap days + buffer for community activity, project
    // submissions and verification.
    estimatedDaysToUnlock: remainingRoadmapDays + NON_ROADMAP_BUFFER_DAYS,
    isRoadmapComplete,
    verifiedProjectsCount,
    requiredProjects,
    remainingProjects,
    isPortfolioComplete,
    averageProjectRating,
    meetsRatingBar,
    hasGithubPortfolio: input.hasGithubPortfolio,
    hasCapstone: input.hasCapstone,
    completedRequirements,
    totalRequirements: 7,
  };
}
