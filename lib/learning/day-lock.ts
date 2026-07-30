/**
 * Roadmap Day Lock & Pacing Engine
 *
 * Implements sequential day locking and the 24-hour (after 12 AM daily reset) pacing rule:
 * 1. Sequential Completion: Day N (N > 1) remains locked until Day N - 1 is completed.
 * 2. Daily Pace Limit (1 day per 24h / 12 AM reset): When Day N - 1 is completed, Day N
 *    unlocks after the next 12:00 AM UTC (midnight) daily reset.
 *
 * NOTE ON SCHEMA MIGRATION:
 * No database schema migration is required. The `roadmap_progress` table already includes
 * the required `status` ('not_started' | 'in_progress' | 'completed' | 'locked'),
 * `completed_at` (timestamptz), and `unlock_at` (timestamptz) columns.
 */

export interface RoadmapProgressRow {
  day?: number;
  status?: string;
  completed_at?: string | Date | null;
  unlock_at?: string | Date | null;
}

export interface RoadmapDayLockStatus {
  dayNumber: number;
  isCompleted: boolean;
  isLocked: boolean;
  isCurrent: boolean;
  status: "completed" | "in_progress" | "not_started" | "locked";
  lockReason?: string;
  unlockAt?: Date | null;
  isDailyResetLock: boolean;
}

/**
 * Returns the timestamp for 12:00:00 AM UTC (midnight) of the calendar day following the given date.
 */
export function getNextMidnightUTC(date: Date | string): Date {
  const d = new Date(date);
  d.setUTCHours(24, 0, 0, 0);
  return d;
}

/**
 * Formats a given unlock Date into a friendly readable time text for UI badges.
 */
export function formatUnlockTime(date: Date | string | null | undefined): string {
  if (!date) return "12:00 AM (Daily Reset)";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `${timeStr} (Daily Reset)`;
  } catch {
    return "12:00 AM (Daily Reset)";
  }
}

/**
 * Calculates the lock and pacing status for every day in a roadmap sequence.
 */
export function getRoadmapDayLockStatuses(
  days: { day: number }[],
  progress: RoadmapProgressRow[] = [],
  now = new Date()
): Record<number, RoadmapDayLockStatus> {
  const sortedDays = [...days].sort((a, b) => a.day - b.day);
  const result: Record<number, RoadmapDayLockStatus> = {};
  const progressByDay = new Map<number, RoadmapProgressRow>();

  for (const row of progress) {
    if (typeof row.day === "number") {
      progressByDay.set(row.day, row);
    }
  }

  for (const d of sortedDays) {
    const p = progressByDay.get(d.day);
    const isCompleted = p?.status === "completed";

    if (isCompleted) {
      result[d.day] = {
        dayNumber: d.day,
        isCompleted: true,
        isLocked: false,
        isCurrent: false,
        status: "completed",
        lockReason: undefined,
        unlockAt: null,
        isDailyResetLock: false,
      };
      continue;
    }

    // Day 1 is always unlocked initially (if not completed)
    if (d.day === 1) {
      const status =
        p?.status === "in_progress"
          ? "in_progress"
          : p?.status === "completed"
            ? "completed"
            : "not_started";
      result[d.day] = {
        dayNumber: d.day,
        isCompleted: false,
        isLocked: false,
        isCurrent: false,
        status,
        lockReason: undefined,
        unlockAt: null,
        isDailyResetLock: false,
      };
      continue;
    }

    // Day N (where N > 1) checks Day N - 1
    const prevStatus = result[d.day - 1];
    const prevProgress = progressByDay.get(d.day - 1);

    if (!prevStatus || !prevStatus.isCompleted) {
      // Locked because previous day is not completed
      result[d.day] = {
        dayNumber: d.day,
        isCompleted: false,
        isLocked: true,
        isCurrent: false,
        status: "locked",
        lockReason: `Complete Day ${d.day - 1} to unlock`,
        unlockAt: null,
        isDailyResetLock: false,
      };
      continue;
    }

    // Previous day is completed. Check 24-hour / after 12 AM daily reset rule.
    let unlockTime: Date | null = null;
    if (p?.unlock_at) {
      unlockTime = new Date(p.unlock_at);
    } else if (prevProgress?.completed_at) {
      unlockTime = getNextMidnightUTC(new Date(prevProgress.completed_at));
    }

    if (unlockTime && now < unlockTime) {
      // Locked waiting for 12 AM daily reset
      result[d.day] = {
        dayNumber: d.day,
        isCompleted: false,
        isLocked: true,
        isCurrent: false,
        status: "locked",
        lockReason: "Unlocks after 12:00 AM reset",
        unlockAt: unlockTime,
        isDailyResetLock: true,
      };
      continue;
    }

    // Unlocked and ready to start
    const status =
      p?.status === "in_progress"
        ? "in_progress"
        : p?.status === "completed"
          ? "completed"
          : "not_started";
    result[d.day] = {
      dayNumber: d.day,
      isCompleted: false,
      isLocked: false,
      isCurrent: false,
      status,
      lockReason: undefined,
      unlockAt: null,
      isDailyResetLock: false,
    };
  }

  // Set `isCurrent: true` on the first unlocked, uncompleted day
  for (const d of sortedDays) {
    const st = result[d.day];
    if (st && !st.isCompleted && !st.isLocked) {
      st.isCurrent = true;
      break;
    }
  }

  return result;
}

/**
 * Returns the lock and pacing status for a single roadmap day.
 */
export function getRoadmapDayLockStatus(
  dayNumber: number,
  days: { day: number }[],
  progress: RoadmapProgressRow[] = [],
  now = new Date()
): RoadmapDayLockStatus {
  const map = getRoadmapDayLockStatuses(days, progress, now);
  const existing = map[dayNumber];
  if (existing) return existing;

  // Fallback if dayNumber is not in days list
  return {
    dayNumber,
    isCompleted: false,
    isLocked: dayNumber > 1,
    isCurrent: dayNumber === 1,
    status: dayNumber === 1 ? "not_started" : "locked",
    lockReason: dayNumber > 1 ? `Complete Day ${dayNumber - 1} to unlock` : undefined,
    unlockAt: null,
    isDailyResetLock: false,
  };
}

/**
 * Returns the day number that should be highlighted as the current/next focus day.
 */
export function getCurrentDayNumber(
  days: { day: number }[],
  lockMap: Record<number, RoadmapDayLockStatus>
): number {
  if (!days || days.length === 0) return 1;
  const sorted = [...days].sort((a, b) => a.day - b.day);

  // 1. First unlocked and uncompleted day
  for (const d of sorted) {
    const st = lockMap[d.day];
    if (st && st.isCurrent) {
      return d.day;
    }
  }

  // 2. Otherwise, first uncompleted day (which is locked by daily reset)
  for (const d of sorted) {
    const st = lockMap[d.day];
    if (st && !st.isCompleted) {
      return d.day;
    }
  }

  // 3. Otherwise all days are completed
  return sorted[sorted.length - 1].day;
}
