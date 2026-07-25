export const ROADMAP_TASK_TYPES = [
  "practical_task",
  "mini_project",
  "assignment",
] as const;
export type RoadmapTaskType = (typeof ROADMAP_TASK_TYPES)[number];

export const LAB_LANGUAGES = [
  "python",
  "javascript",
  "typescript",
  "sql",
  "json",
  "yaml",
  "bash",
  "markdown",
] as const;
export type LabLanguage = (typeof LAB_LANGUAGES)[number];

export type RoadmapLevel = "beginner" | "intermediate";
export type RoadmapTaskRole =
  | "genai_engineer"
  | "ai_engineer"
  | "ai_automation_engineer"
  | "data_science_engineer";

export type RoadmapTask = {
  role: RoadmapTaskRole;
  level: RoadmapLevel;
  dayNumber: number;
  dayTitle: string;
  roadmapTitle: string;
  taskType: RoadmapTaskType;
  taskDescription: string;
  objectives: string[];
  topics: string[];
  expectedOutcome?: string;
  difficulty: string;
  suggestedLanguage: LabLanguage;
  starterCode: string;
};
