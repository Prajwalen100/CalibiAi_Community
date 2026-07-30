/**
 * Server-side roadmap day access guard.
 *
 * The lock/pacing rules in `day-lock.ts` are pure functions used by the UI.
 * This module is the single source of truth that *server* code (pages, server
 * actions and route handlers) uses to decide whether the signed-in student may
 * open or submit work for a given roadmap day.
 *
 * Without this guard a locked day was only hidden visually — the day page,
 * quiz page, AI task lab and the task-review API were all reachable by typing
 * the URL directly (for example `/roadmap/day/5` while Day 4 is incomplete).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getRoadmapDayLockStatus,
  type RoadmapDayLockStatus,
  type RoadmapProgressRow,
} from "./day-lock";

/**
 * Every lock decision needs `completed_at` (for the 12 AM pacing rule) and
 * `unlock_at` (for an explicitly stored unlock time), not just `status`.
 * Selecting fewer columns silently disables the daily pacing rule.
 */
export const ROADMAP_PROGRESS_LOCK_COLUMNS = "day,status,completed_at,unlock_at";

export type RoadmapDayAccess = {
  /** The student has an assigned roadmap with a valid day list. */
  hasRoadmap: boolean;
  days: { day: number }[];
  totalDays: number;
  progress: RoadmapProgressRow[];
  lockStatus: RoadmapDayLockStatus;
  isLocked: boolean;
  isCompleted: boolean;
};

type MinimalSupabase = Pick<SupabaseClient, "from">;

function normaliseDays(value: unknown): { day: number }[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((d): d is { day: number } => {
      return Boolean(d) && typeof (d as { day?: unknown }).day === "number";
    })
    .map((d) => ({ ...d, day: Number(d.day) }));
}

/**
 * Loads the roadmap day list plus progress rows and resolves the lock status
 * for `dayNumber`.
 *
 * When the student has no roadmap yet (or the plan is malformed) the day is
 * reported as unlocked with `hasRoadmap: false` so callers can redirect to
 * `/roadmap/assign` instead of showing a misleading "locked" screen.
 */
export async function getRoadmapDayAccess(
  supabase: MinimalSupabase,
  userId: string,
  dayNumber: number,
  now = new Date()
): Promise<RoadmapDayAccess> {
  const [{ data: roadmap }, { data: progressRows }] = await Promise.all([
    supabase
      .from("roadmaps")
      .select("generated_plan")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("roadmap_progress")
      .select(ROADMAP_PROGRESS_LOCK_COLUMNS)
      .eq("user_id", userId)
      .order("day", { ascending: true }),
  ]);

  const plan = (roadmap?.generated_plan ?? null) as
    | { days?: unknown; totalDays?: number }
    | null;
  const days = normaliseDays(plan?.days);
  const progress = (progressRows ?? []) as RoadmapProgressRow[];
  const totalDays =
    typeof plan?.totalDays === "number" && plan.totalDays > 0
      ? plan.totalDays
      : days.length;

  if (days.length === 0) {
    return {
      hasRoadmap: false,
      days,
      totalDays,
      progress,
      lockStatus: {
        dayNumber,
        isCompleted: false,
        isLocked: false,
        isCurrent: dayNumber === 1,
        status: "not_started",
        unlockAt: null,
        isDailyResetLock: false,
      },
      isLocked: false,
      isCompleted: false,
    };
  }

  const lockStatus = getRoadmapDayLockStatus(dayNumber, days, progress, now);

  return {
    hasRoadmap: true,
    days,
    totalDays,
    progress,
    lockStatus,
    isLocked: lockStatus.isLocked,
    isCompleted: lockStatus.isCompleted,
  };
}
