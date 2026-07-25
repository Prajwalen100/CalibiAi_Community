import { LEARNING_ROLES, ROLE_DETAILS, type LearningRole } from "@/lib/learning/content";

const LEVELS = ["beginner", "intermediate"] as const;
type LearningLevel = (typeof LEVELS)[number];

function normalise(value: string | undefined) {
  return value?.trim().toLowerCase().replace(/[\s-]+/g, "_") ?? "";
}

/**
 * Roadmaps store a human-readable role and level (for example, "AI Engineer"
 * and "Beginner"), whereas article files use stable identifiers.  Resolve both
 * formats so links work for every newly generated and existing roadmap.
 */
export function resolveArticleRole(role: string | undefined): LearningRole {
  const normalisedRole = normalise(role);
  if (LEARNING_ROLES.includes(normalisedRole as LearningRole)) {
    return normalisedRole as LearningRole;
  }

  return LEARNING_ROLES.find((id) => normalise(ROLE_DETAILS[id].title) === normalisedRole) ?? "ai_engineer";
}

export function resolveArticleLevel(level: string | undefined): LearningLevel {
  const normalisedLevel = normalise(level);
  return LEVELS.includes(normalisedLevel as LearningLevel) ? normalisedLevel as LearningLevel : "beginner";
}

export function getArticleSlug(role: string | undefined, level: string | undefined, day: number) {
  const safeDay = Number.isInteger(day) && day > 0 ? day : 1;
  return `${resolveArticleRole(role)}-${resolveArticleLevel(level)}-day-${safeDay}`;
}
