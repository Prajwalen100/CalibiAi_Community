import { describe, expect, it } from "vitest";
import {
  formatUnlockTime,
  getCurrentDayNumber,
  getNextMidnightUTC,
  getRoadmapDayLockStatus,
  getRoadmapDayLockStatuses,
  type RoadmapProgressRow,
} from "./day-lock";

describe("Roadmap Day Lock Engine", () => {
  const days = [
    { day: 1 },
    { day: 2 },
    { day: 3 },
    { day: 4 },
  ];

  it("unlocks Day 1 initially and locks subsequent days when no days are completed", () => {
    const statuses = getRoadmapDayLockStatuses(days, [], new Date("2026-07-30T10:00:00.000Z"));

    expect(statuses[1].isCompleted).toBe(false);
    expect(statuses[1].isLocked).toBe(false);
    expect(statuses[1].isCurrent).toBe(true);

    expect(statuses[2].isLocked).toBe(true);
    expect(statuses[2].lockReason).toBe("Complete Day 1 to unlock");
    expect(statuses[2].isDailyResetLock).toBe(false);
    expect(statuses[2].isCurrent).toBe(false);
  });

  it("locks Day 2 until after 12:00 AM reset when Day 1 is completed today", () => {
    const now = new Date("2026-07-30T15:00:00.000Z");
    const progress: RoadmapProgressRow[] = [
      {
        day: 1,
        status: "completed",
        completed_at: "2026-07-30T14:00:00.000Z",
      },
    ];

    const statuses = getRoadmapDayLockStatuses(days, progress, now);

    expect(statuses[1].isCompleted).toBe(true);

    expect(statuses[2].isCompleted).toBe(false);
    expect(statuses[2].isLocked).toBe(true);
    expect(statuses[2].isDailyResetLock).toBe(true);
    expect(statuses[2].lockReason).toBe("Unlocks after 12:00 AM reset");
    expect(statuses[2].unlockAt).toEqual(new Date("2026-07-31T00:00:00.000Z"));
    expect(statuses[2].isCurrent).toBe(false);

    expect(statuses[3].isLocked).toBe(true);
    expect(statuses[3].lockReason).toBe("Complete Day 2 to unlock");

    expect(getCurrentDayNumber(days, statuses)).toBe(2);
  });

  it("unlocks Day 2 after the 12:00 AM daily reset has passed", () => {
    const progress: RoadmapProgressRow[] = [
      {
        day: 1,
        status: "completed",
        completed_at: "2026-07-29T14:00:00.000Z",
      },
    ];
    // Now is July 30, which is after midnight July 30 00:00:00 UTC
    const now = new Date("2026-07-30T08:00:00.000Z");

    const statuses = getRoadmapDayLockStatuses(days, progress, now);

    expect(statuses[1].isCompleted).toBe(true);
    expect(statuses[2].isCompleted).toBe(false);
    expect(statuses[2].isLocked).toBe(false);
    expect(statuses[2].isCurrent).toBe(true);

    expect(getCurrentDayNumber(days, statuses)).toBe(2);
  });

  it("respects unlock_at if explicitly stored on progress row", () => {
    const progress: RoadmapProgressRow[] = [
      {
        day: 1,
        status: "completed",
        completed_at: "2026-07-30T10:00:00.000Z",
      },
      {
        day: 2,
        status: "locked",
        unlock_at: "2026-07-31T00:00:00.000Z",
      },
    ];
    const now = new Date("2026-07-30T20:00:00.000Z");

    const status2 = getRoadmapDayLockStatus(2, days, progress, now);

    expect(status2.isLocked).toBe(true);
    expect(status2.isDailyResetLock).toBe(true);
    expect(status2.unlockAt).toEqual(new Date("2026-07-31T00:00:00.000Z"));
  });

  it("calculates getNextMidnightUTC accurately", () => {
    const next = getNextMidnightUTC("2026-07-30T15:45:00.000Z");
    expect(next.toISOString()).toBe("2026-07-31T00:00:00.000Z");
  });

  it("formats formatUnlockTime cleanly", () => {
    const str = formatUnlockTime(null);
    expect(str).toContain("12:00 AM");
  });
});
