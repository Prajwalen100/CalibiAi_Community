import type { SupabaseClient } from "@supabase/supabase-js";

const LEARNING_ROLES = new Set([
  "genai_engineer",
  "ai_engineer",
  "ai_automation_engineer",
  "data_science_engineer",
]);

function isLearningRole(value: unknown): value is string {
  return typeof value === "string" && LEARNING_ROLES.has(value);
}

export type StudentProfileState = {
  role: string | null;
  onboarding_step: number | null;
  onboarding_completed: boolean | null;
  learning_role: string | null;
};

export type StudentAccessState = {
  profile: StudentProfileState | null;
  isEmployer: boolean;
  isReadyForAssessment: boolean;
  hasCompletedAssessment: boolean;
  canAccessStudentArea: boolean;
  nextPath: "/onboarding" | "/assessment" | "/roadmap/assign" | "/dashboard";
};

/**
 * Resolve the student journey from durable server-side state.
 *
 * A selected target role is not enough to unlock the product. The assessment
 * must be submitted and its roadmap assignment must finish (which flips
 * onboarding_completed) before student navigation and protected areas open.
 */
export function resolveStudentAccess(
  profile: StudentProfileState | null,
  hasCompletedAssessment: boolean
): StudentAccessState {
  const isEmployer = profile?.role === "employer";
  const step = Number(profile?.onboarding_step ?? 1);
  const learningRole = isLearningRole(profile?.learning_role)
    ? profile.learning_role
    : null;
  const isReadyForAssessment = !isEmployer && step >= 5 && Boolean(learningRole);
  const canAccessStudentArea =
    !isEmployer && hasCompletedAssessment && profile?.onboarding_completed === true;

  let nextPath: StudentAccessState["nextPath"] = "/onboarding";
  if (canAccessStudentArea) nextPath = "/dashboard";
  else if (hasCompletedAssessment) nextPath = "/roadmap/assign";
  else if (isReadyForAssessment) nextPath = "/assessment";

  return {
    profile,
    isEmployer,
    isReadyForAssessment,
    hasCompletedAssessment,
    canAccessStudentArea,
    nextPath,
  };
}

export async function getStudentAccess(
  supabase: SupabaseClient,
  userId: string
): Promise<StudentAccessState> {
  const [{ data: profile }, { data: assessment }] = await Promise.all([
    supabase
      .from("profiles")
      .select("role,onboarding_step,onboarding_completed,learning_role")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("assessment_results")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return resolveStudentAccess(
    (profile as StudentProfileState | null) ?? null,
    Boolean(assessment)
  );
}
