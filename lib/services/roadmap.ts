import fs from "node:fs";
import path from "node:path";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isLearningRole, ROLE_DETAILS, type LearningRole } from "@/lib/learning/content";
import type { Result } from "@/lib/services/onboarding";

type RoadmapDay = {
  day: number;
  title: string;
  skills_gained?: string[];
};

type RoadmapContent = {
  roadmap: {
    title: string;
    role: string;
    level: string;
    total_days: number;
  };
  days: RoadmapDay[];
};

function loadRoadmap(role: LearningRole, level: "beginner" | "intermediate") {
  const fileName = ROLE_DETAILS[role].roadmap[level];
  const filePath = path.join(process.cwd(), "content", "roadmap", fileName);
  const content = JSON.parse(fs.readFileSync(filePath, "utf8")) as RoadmapContent;

  if (!content.roadmap || !Array.isArray(content.days) || content.days.length === 0) {
    throw new Error("The selected roadmap content is incomplete.");
  }
  if (content.days.some((day, index) => !Number.isInteger(day.day) || day.day !== index + 1 || !day.title)) {
    throw new Error("The selected roadmap days are invalid.");
  }

  return { content, fileName };
}

/**
 * Deterministically assigns the static role + level roadmap after assessment.
 * The operation is retry-safe: a partially-created active assignment is reused
 * and its progress rows are upserted before onboarding is unlocked.
 */
export async function assignRoadmap(): Promise<Result<{ userRoadmapId: string }>> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: { message: "Please sign in again.", code: "UNAUTHENTICATED" } };
  }

  const [{ data: profile, error: profileError }, { data: assessment, error: assessmentError }] = await Promise.all([
    supabase
      .from("profiles")
      .select("learning_role,onboarding_completed")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("assessment_results")
      .select("id,role,level")
      .eq("user_id", user.id)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (profileError || !profile) {
    return { data: null, error: { message: "Your onboarding profile could not be loaded.", code: profileError?.code } };
  }
  if (assessmentError) {
    return { data: null, error: { message: "Your assessment result could not be loaded.", code: assessmentError.code } };
  }
  if (!assessment || !isLearningRole(assessment.role) || !isLearningRole(profile.learning_role)) {
    return { data: null, error: { message: "Complete the placement assessment before assigning your roadmap." } };
  }
  if (assessment.role !== profile.learning_role) {
    return { data: null, error: { message: "Your assessment role no longer matches your selected role. Please retake the assessment." } };
  }
  if (assessment.level !== "beginner" && assessment.level !== "intermediate") {
    return { data: null, error: { message: "Your assessment level is missing. Please submit the assessment again." } };
  }

  let roadmap: ReturnType<typeof loadRoadmap>;
  try {
    roadmap = loadRoadmap(assessment.role, assessment.level);
  } catch (error) {
    return {
      data: null,
      error: { message: error instanceof Error ? error.message : "The selected roadmap could not be loaded." },
    };
  }

  const { data: graphRow } = await supabase
    .from("knowledge_graph")
    .select("graph")
    .eq("assessment_result_id", assessment.id)
    .maybeSingle();
  const graph = graphRow?.graph as { weak_skills?: string[] } | null | undefined;

  let { data: assignment, error: assignmentReadError } = await supabase
    .from("user_roadmaps")
    .select("id,roadmap_id")
    .eq("user_id", user.id)
    .eq("role", assessment.role)
    .eq("status", "active")
    .maybeSingle();

  if (assignmentReadError) {
    return {
      data: null,
      error: {
        message: "Roadmap assignment is unavailable. Make sure the latest Supabase migrations are applied.",
        code: assignmentReadError.code,
      },
    };
  }

  if (!assignment) {
    const { data: catalogRow, error: catalogError } = await supabase
      .from("roadmaps")
      .insert({
        user_id: user.id,
        role: assessment.role,
        generated_plan: {
          ...roadmap.content,
          file_key: roadmap.fileName,
          assessment_result_id: assessment.id,
        },
      })
      .select("id")
      .single();

    if (catalogError || !catalogRow) {
      return { data: null, error: { message: "We couldn't save your roadmap. Please retry.", code: catalogError?.code } };
    }

    const sequence = roadmap.content.days.map((day) => day.day);
    const created = await supabase
      .from("user_roadmaps")
      .insert({
        user_id: user.id,
        roadmap_id: catalogRow.id,
        role: assessment.role,
        level: assessment.level,
        status: "active",
        personalization: {
          sequence,
          day_actions: {},
          focus_skills: graph?.weak_skills ?? [],
          version: 1,
          source: "deterministic",
        },
      })
      .select("id,roadmap_id")
      .single();

    if (created.error || !created.data) {
      // A duplicate request may have won the unique-index race. Reuse it.
      const retry = await supabase
        .from("user_roadmaps")
        .select("id,roadmap_id")
        .eq("user_id", user.id)
        .eq("role", assessment.role)
        .eq("status", "active")
        .maybeSingle();
      assignment = retry.data;
      assignmentReadError = retry.error;
      if (assignmentReadError || !assignment) {
        return { data: null, error: { message: "We couldn't activate your roadmap. Please retry.", code: created.error?.code } };
      }
    } else {
      assignment = created.data;
    }
  }

  const progressRows = roadmap.content.days.map((day) => ({
    user_id: user.id,
    user_roadmap_id: assignment!.id,
    module_id: `${assignment!.id}:day:${day.day}`,
    day: day.day,
    prereq_days: day.day === 1 ? [] : [day.day - 1],
    status: day.day === 1 ? "not_started" : "locked",
    unlock_at: day.day === 1 ? new Date().toISOString() : null,
  }));

  const { error: progressError } = await supabase
    .from("roadmap_progress")
    .upsert(progressRows, { onConflict: "user_id,module_id" });
  if (progressError) {
    return { data: null, error: { message: "We couldn't prepare your roadmap days. Please retry.", code: progressError.code } };
  }

  const { data: completedProfile, error: completeError } = await supabase
    .from("profiles")
    .update({ onboarding_completed: true, onboarding_step: 5 })
    .eq("user_id", user.id)
    .select("user_id")
    .maybeSingle();
  if (completeError || !completedProfile) {
    return { data: null, error: { message: "We couldn't finish onboarding. Please retry.", code: completeError?.code } };
  }

  // Initialize optional dashboard data without making it part of the critical path.
  await Promise.all([
    supabase.from("scores").upsert(
      {
        user_id: user.id,
        projects_pts: 0,
        skills_pts: 0,
        community_pts: 0,
        completion_pts: 0,
        recognition_pts: 0,
        total: 0,
        tier: "bronze",
      },
      { onConflict: "user_id", ignoreDuplicates: true }
    ),
    supabase.from("activity_logs").insert({
      user_id: user.id,
      action: "roadmap_assigned",
      metadata: { role: assessment.role, level: assessment.level, user_roadmap_id: assignment.id },
    }),
  ]);

  return { data: { userRoadmapId: assignment.id }, error: null };
}
