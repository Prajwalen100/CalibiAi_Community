import "server-only";

import fs from "node:fs";
import path from "node:path";

import { ROLE_DETAILS, type LearningRole } from "@/lib/learning/content";
import { parseRoadmapQuizContent } from "@/lib/learning/roadmap-quiz";
import { parseRoadmapTaskContent } from "@/lib/learning/roadmap-task";

import { DAYS_PER_WEEK } from "./config";
import { weekForDay, weeksForDays } from "./engine";
import type {
  DashboardDay,
  LoadedRoadmap,
  RoadmapContent,
  RoadmapDayContent,
  RoadmapStage,
  WeeklyTarget,
} from "./types";

/**
 * Dynamic loader for the roadmap JSONs that already exist in `content/roadmap/`.
 *
 * NO ROADMAP CONTENT IS GENERATED OR DUPLICATED HERE. The eight existing files
 * (beginner + intermediate for each of the four roles) are the single source of
 * truth; this module only reads, validates, transforms and caches them.
 *
 * Results are memoised per (role, stage). The files are static build artifacts,
 * so parsing them once per process keeps the dashboard's hot path free of
 * repeated disk reads and JSON parsing.
 */
const cache = new Map<string, LoadedRoadmap>();

function cacheKey(role: LearningRole, stage: RoadmapStage) {
  return `${role}::${stage}`;
}

/** Resolves the on-disk filename for a role + stage from the existing registry. */
export function roadmapFileName(role: LearningRole, stage: RoadmapStage): string {
  return ROLE_DETAILS[role].roadmap[stage];
}

function readRoadmapFile(role: LearningRole, stage: RoadmapStage): { content: RoadmapContent; fileName: string } {
  const fileName = roadmapFileName(role, stage);
  const filePath = path.join(process.cwd(), "content", "roadmap", fileName);
  const source = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;

  // Validate quizzes and tasks at load time so malformed source content can
  // never produce a `has_quiz` link that later opens an empty runner. This
  // mirrors the validation the previous assignment path performed.
  parseRoadmapQuizContent(source);
  parseRoadmapTaskContent(source);

  const content = source as RoadmapContent;
  if (!content.roadmap || !Array.isArray(content.days) || content.days.length === 0) {
    throw new Error(`Roadmap content is incomplete: ${fileName}`);
  }
  if (content.days.some((day, index) => !Number.isInteger(day.day) || day.day !== index + 1 || !day.title)) {
    throw new Error(`Roadmap days are invalid or out of sequence: ${fileName}`);
  }

  return { content, fileName };
}

/** Derives weekly targets from the daily content. */
function generateWeeklyTargets(days: RoadmapDayContent[]): WeeklyTarget[] {
  const weeks: WeeklyTarget[] = [];
  const totalWeeks = weeksForDays(days.length);

  for (let week = 0; week < totalWeeks; week += 1) {
    const startDay = week * DAYS_PER_WEEK + 1;
    const endDay = Math.min((week + 1) * DAYS_PER_WEEK, days.length);
    const weekDays = days.slice(week * DAYS_PER_WEEK, (week + 1) * DAYS_PER_WEEK);

    const uniqueTopics = [...new Set(weekDays.flatMap((day) => day.topics ?? []))].slice(0, 5);
    const uniqueSkills = [...new Set(weekDays.flatMap((day) => day.skills_gained ?? []))].slice(0, 3);

    const milestones: string[] = [];
    if (weekDays[0]?.practical_task) milestones.push("Complete the week's practical task");
    if (weekDays[0]?.mini_project) milestones.push("Submit the mini project");
    if (weekDays.some((day) => day.quiz && day.quiz.length > 0)) milestones.push("Pass the weekly quiz (80%+)");
    if (weekDays[0]?.assignment) milestones.push("Submit the weekly assignment");

    weeks.push({
      week: week + 1,
      title: `Week ${week + 1}`,
      focus: uniqueSkills.length > 0 ? uniqueSkills.join(", ") : `Learning Days ${startDay}-${endDay}`,
      days: weekDays.map((day) => day.day),
      keyTopics: uniqueTopics,
      milestones,
    });
  }

  return weeks;
}

function transformDay(day: RoadmapDayContent, week: number): DashboardDay {
  return {
    day: day.day,
    week,
    title: day.title,
    objectives: day.objectives ?? [],
    topics: day.topics ?? [],
    estimated_time: day.estimated_time ?? "2-3 hours",
    difficulty: day.difficulty ?? "Beginner",
    practical_task: day.practical_task,
    mini_project: day.mini_project,
    assignment: day.assignment,
    expected_outcome: day.expected_outcome,
    skills_gained: day.skills_gained ?? [],
    resources: { youtube: day.youtube ?? [], docs: day.official_docs ?? [] },
    has_quiz: Boolean(day.quiz && day.quiz.length > 0),
  };
}

/** Loads, validates, transforms and caches one role + stage roadmap. */
export function loadRoadmap(role: LearningRole, stage: RoadmapStage): LoadedRoadmap {
  const key = cacheKey(role, stage);
  const cached = cache.get(key);
  if (cached) return cached;

  const { content, fileName } = readRoadmapFile(role, stage);
  const weeklyTargets = generateWeeklyTargets(content.days);
  const days = content.days.map((day) => transformDay(day, weekForDay(day.day)));

  const loaded: LoadedRoadmap = {
    stage,
    fileName,
    roadmap: content.roadmap,
    days,
    weeklyTargets,
    totalDays: content.days.length,
    totalWeeks: weeklyTargets.length,
  };

  cache.set(key, loaded);
  return loaded;
}

/** Day count for a role + stage without transforming the whole roadmap. */
export function roadmapTotalDays(role: LearningRole, stage: RoadmapStage): number {
  return loadRoadmap(role, stage).totalDays;
}

/** Clears the memoised roadmaps. Test-only. */
export function __clearRoadmapCache() {
  cache.clear();
}
