"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ProgressSchema = z.object({
  moduleId: z.string().min(3).max(200),
  phaseId: z.string().min(2).max(120),
  progressPct: z.number().int().min(0).max(100),
});

export async function saveModuleProgress(input: {
  moduleId: string;
  phaseId: string;
  progressPct: number;
}) {
  const parsed = ProgressSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid progress payload" };

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const pct = parsed.data.progressPct;
    const completed = pct >= 95;

    const { error } = await supabase.from("curriculum_progress").upsert(
      {
        user_id: user.id,
        module_id: parsed.data.moduleId,
        phase_id: parsed.data.phaseId,
        progress_pct: pct,
        completed,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: "user_id,module_id" }
    );

    if (error) {
      if (error.code === "42P01" || /curriculum_progress|relation .* does not exist/i.test(error.message)) {
        return {
          error:
            "Progress tracking needs setup. Run supabase/migrations/007_curriculum_progress.sql.",
        };
      }
      return { error: error.message };
    }

    // Light revalidation — avoid thrashing on every scroll tick
    if (completed || pct % 25 === 0) {
      revalidatePath("/community/resources");
      revalidatePath(`/community/resources/${parsed.data.phaseId}`);
    }

    return { success: true, completed };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unable to save progress" };
  }
}

export async function getUserProgressMap(userId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("curriculum_progress")
      .select("module_id, phase_id, progress_pct, completed, last_read_at")
      .eq("user_id", userId);

    if (error || !data) return new Map<string, ProgressRow>();

    return new Map(
      data.map((row) => [
        row.module_id as string,
        {
          moduleId: row.module_id as string,
          phaseId: row.phase_id as string,
          progressPct: row.progress_pct as number,
          completed: row.completed as boolean,
          lastReadAt: row.last_read_at as string,
        },
      ])
    );
  } catch {
    return new Map<string, ProgressRow>();
  }
}

export type ProgressRow = {
  moduleId: string;
  phaseId: string;
  progressPct: number;
  completed: boolean;
  lastReadAt: string;
};
