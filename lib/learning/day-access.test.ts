import { describe, expect, it } from "vitest";
import {
  getRoadmapDayAccess,
  ROADMAP_PROGRESS_LOCK_COLUMNS,
} from "./day-access";

type Row = Record<string, unknown>;

/**
 * Minimal Supabase stub that records the selected columns and replays fixed
 * rows for the two tables the guard reads.
 */
function makeSupabase(options: {
  plan: unknown;
  progress: Row[];
  onSelect?: (table: string, columns: string) => void;
}) {
  return {
    from(table: string) {
      const builder: Record<string, unknown> = {};
      const chain = () => builder;

      builder.select = (columns: string) => {
        options.onSelect?.(table, columns);
        return builder;
      };
      builder.eq = chain;
      builder.order = chain;
      builder.limit = chain;
      builder.maybeSingle = async () => ({
        data: table === "roadmaps" ? { generated_plan: options.plan } : null,
        error: null,
      });
      // `roadmap_progress` is awaited directly after .order()
      builder.then = (
        resolve: (value: { data: Row[]; error: null }) => unknown
      ) => resolve({ data: options.progress, error: null });

      return builder;
    },
  } as never;
}

const plan = {
  totalDays: 5,
  days: [{ day: 1 }, { day: 2 }, { day: 3 }, { day: 4 }, { day: 5 }],
};

describe("getRoadmapDayAccess", () => {
  it("selects the columns the pacing rules depend on", async () => {
    const selected: Record<string, string> = {};
    const supabase = makeSupabase({
      plan,
      progress: [],
      onSelect: (table, columns) => {
        selected[table] = columns;
      },
    });

    await getRoadmapDayAccess(supabase, "user-1", 2);

    expect(selected.roadmap_progress).toBe(ROADMAP_PROGRESS_LOCK_COLUMNS);
    expect(selected.roadmap_progress).toContain("completed_at");
    expect(selected.roadmap_progress).toContain("unlock_at");
  });

  it("locks Day 5 while Day 4 is not completed", async () => {
    const supabase = makeSupabase({
      plan,
      progress: [
        { day: 1, status: "completed", completed_at: "2026-07-01T10:00:00.000Z" },
        { day: 2, status: "completed", completed_at: "2026-07-02T10:00:00.000Z" },
        { day: 3, status: "completed", completed_at: "2026-07-03T10:00:00.000Z" },
        { day: 4, status: "in_progress" },
      ],
    });

    const access = await getRoadmapDayAccess(
      supabase,
      "user-1",
      5,
      new Date("2026-07-10T12:00:00.000Z")
    );

    expect(access.hasRoadmap).toBe(true);
    expect(access.isLocked).toBe(true);
    expect(access.isCompleted).toBe(false);
    expect(access.lockStatus.lockReason).toBe("Complete Day 4 to unlock");
    expect(access.lockStatus.isDailyResetLock).toBe(false);
  });

  it("keeps Day 5 locked until the 12 AM reset after Day 4 is completed", async () => {
    const supabase = makeSupabase({
      plan,
      progress: [
        { day: 1, status: "completed", completed_at: "2026-07-01T10:00:00.000Z" },
        { day: 2, status: "completed", completed_at: "2026-07-02T10:00:00.000Z" },
        { day: 3, status: "completed", completed_at: "2026-07-03T10:00:00.000Z" },
        { day: 4, status: "completed", completed_at: "2026-07-04T18:00:00.000Z" },
      ],
    });

    const stillLocked = await getRoadmapDayAccess(
      supabase,
      "user-1",
      5,
      new Date("2026-07-04T22:00:00.000Z")
    );
    expect(stillLocked.isLocked).toBe(true);
    expect(stillLocked.lockStatus.isDailyResetLock).toBe(true);

    const unlocked = await getRoadmapDayAccess(
      supabase,
      "user-1",
      5,
      new Date("2026-07-05T00:30:00.000Z")
    );
    expect(unlocked.isLocked).toBe(false);
  });

  it("never locks a day when the student has no roadmap yet", async () => {
    const supabase = makeSupabase({ plan: null, progress: [] });

    const access = await getRoadmapDayAccess(supabase, "user-1", 5);

    expect(access.hasRoadmap).toBe(false);
    expect(access.isLocked).toBe(false);
  });

  it("treats a malformed day list as no roadmap", async () => {
    const supabase = makeSupabase({
      plan: { days: "not-an-array" },
      progress: [],
    });

    const access = await getRoadmapDayAccess(supabase, "user-1", 3);

    expect(access.hasRoadmap).toBe(false);
    expect(access.days).toEqual([]);
  });

  it("reports a completed day as unlocked", async () => {
    const supabase = makeSupabase({
      plan,
      progress: [
        { day: 1, status: "completed", completed_at: "2026-07-01T10:00:00.000Z" },
        { day: 2, status: "completed", completed_at: "2026-07-02T10:00:00.000Z" },
      ],
    });

    const access = await getRoadmapDayAccess(
      supabase,
      "user-1",
      2,
      new Date("2026-07-05T10:00:00.000Z")
    );

    expect(access.isCompleted).toBe(true);
    expect(access.isLocked).toBe(false);
  });
});
