import { requireAdmin } from "../_lib/guard";
import { AdminShell } from "../_components/admin-shell";
import { LEARNING_ROLES, ROLE_DETAILS, type LearningRole } from "@/lib/learning/content";
import { loadRoadmap } from "@/lib/roadmap/loader";
import { getRoadmapSettings } from "@/lib/roadmap/settings";
import { ROADMAP_STAGES } from "@/lib/roadmap/types";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { RoadmapControls, type LearnerRow, type RoadmapFileRow } from "./roadmap-controls";

export const dynamic = "force-dynamic";

/**
 * Admin roadmap mapping console.
 *
 * Exposes the placement threshold, the auto-promotion switch and per-learner
 * stage overrides. Roadmap CONTENT is intentionally read-only here — the JSON
 * files in `content/roadmap/` are authored in the repository, so the panel can
 * never create a duplicate roadmap.
 */
export default async function AdminRoadmapPage() {
  const session = await requireAdmin("/admin/roadmap");
  const settings = await getRoadmapSettings();

  // Inventory of the roadmap JSONs that already exist on disk.
  const files: RoadmapFileRow[] = [];
  for (const role of LEARNING_ROLES as readonly LearningRole[]) {
    for (const stage of ROADMAP_STAGES) {
      try {
        const roadmap = loadRoadmap(role, stage);
        files.push({
          role,
          roleTitle: ROLE_DETAILS[role].title,
          stage,
          fileName: roadmap.fileName,
          totalDays: roadmap.totalDays,
          totalWeeks: roadmap.totalWeeks,
          title: roadmap.roadmap.title,
        });
      } catch {
        // A missing or malformed file must not take the console down.
      }
    }
  }

  let learners: LearnerRow[] = [];
  try {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase
      .from("profiles")
      .select(
        "user_id,full_name,username,email,roadmap_stage,roadmap_entry_stage,current_overall_day,overall_journey_days,roadmap_stage_override",
      )
      .not("roadmap_stage", "is", null)
      .order("full_name", { ascending: true })
      .limit(200);

    learners = (data ?? []).map((row) => {
      const record = row as Record<string, unknown>;
      return {
        userId: String(record.user_id),
        name: (record.full_name as string) || (record.username as string) || "Unnamed learner",
        email: (record.email as string) || "—",
        stage: (record.roadmap_stage as string) ?? null,
        entryStage: (record.roadmap_entry_stage as string) ?? null,
        overallDay: (record.current_overall_day as number) ?? null,
        overallJourneyDays: (record.overall_journey_days as number) ?? null,
        override: (record.roadmap_stage_override as string) ?? null,
      };
    });
  } catch {
    // Migration 025 may not be applied yet; the settings panels still work.
  }

  return (
    <AdminShell
      active="content"
      eyebrow="Learning engine"
      title="Roadmap mapping"
      description="Control how learners are placed onto the existing roadmap JSONs, when they are promoted, and which stage an individual learner is on."
      adminEmail={session.email}
    >
      <RoadmapControls
        threshold={settings.placementThreshold}
        thresholdSource={settings.thresholdSource}
        autoPromotionEnabled={settings.autoPromotionEnabled}
        files={files}
        learners={learners}
      />
    </AdminShell>
  );
}
