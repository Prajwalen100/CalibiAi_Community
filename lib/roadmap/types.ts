/**
 * Shared roadmap-engine types.
 *
 * Kept dependency-free (no `fs`, no Supabase) so both server code and pure
 * unit tests can import them.
 */

/** A roadmap stage. Matches the existing `user_roadmaps.level` check constraint. */
export type RoadmapStage = "beginner" | "intermediate";

export const ROADMAP_STAGES: readonly RoadmapStage[] = ["beginner", "intermediate"] as const;

export function isRoadmapStage(value: unknown): value is RoadmapStage {
  return value === "beginner" || value === "intermediate";
}

/** The next stage in the progression, or null when the journey is finished. */
export function nextStage(stage: RoadmapStage): RoadmapStage | null {
  return stage === "beginner" ? "intermediate" : null;
}

/** A single day as stored in the roadmap JSON files. */
export type RoadmapDayContent = {
  day: number;
  title: string;
  objectives?: string[];
  topics?: string[];
  estimated_time?: string;
  difficulty?: string;
  practical_task?: string;
  mini_project?: string;
  assignment?: string;
  expected_outcome?: string;
  skills_gained?: string[];
  youtube?: { title: string; channel: string; url: string }[];
  official_docs?: { title: string; url: string }[];
  quiz?: { question: string; options: string[]; answer: string }[];
};

/** The top-level shape of every file in `content/roadmap/`. */
export type RoadmapContent = {
  roadmap: {
    title: string;
    role: string;
    level: string;
    total_days: number;
    description?: string;
    outcome?: string;
  };
  days: RoadmapDayContent[];
};

/** A day after transformation for the dashboard/roadmap UI. */
export type DashboardDay = {
  day: number;
  week: number;
  title: string;
  objectives: string[];
  topics: string[];
  estimated_time: string;
  difficulty: string;
  practical_task?: string;
  mini_project?: string;
  assignment?: string;
  expected_outcome?: string;
  skills_gained: string[];
  resources: {
    youtube: { title: string; channel: string; url: string }[];
    docs: { title: string; url: string }[];
  };
  has_quiz: boolean;
};

export type WeeklyTarget = {
  week: number;
  title: string;
  focus: string;
  days: number[];
  keyTopics: string[];
  milestones: string[];
};

/** A fully loaded and transformed roadmap stage. */
export type LoadedRoadmap = {
  stage: RoadmapStage;
  fileName: string;
  roadmap: RoadmapContent["roadmap"];
  days: DashboardDay[];
  weeklyTargets: WeeklyTarget[];
  totalDays: number;
  totalWeeks: number;
};

/** Minimal progress row shape the engine needs. Matches `roadmap_progress`. */
export type StageProgressRow = {
  day?: number | null;
  status?: string | null;
  completed_at?: string | Date | null;
  unlock_at?: string | Date | null;
};
