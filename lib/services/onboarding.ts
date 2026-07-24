import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isLearningRole, type LearningRole } from "@/lib/learning/content";

export type Result<T> = { data: T; error: null } | { data: null; error: { message: string; code?: string } };
const profileSchema = z.object({ full_name: z.string().trim().min(2).max(60).refine((value) => /[\p{L}\p{N}]/u.test(value), "Enter your name using letters or numbers."), display_name: z.string().trim().max(60).optional(), country: z.string().length(2), timezone: z.string().min(1).max(100), education_level: z.enum(["High School", "Undergraduate", "Graduate", "Professional"]), experience_level: z.enum(["New to tech", "Some coding", "Experienced"]), weekly_hours: z.number().int().min(3).max(40) });

async function currentUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function saveStep(input: { step: number; profile?: unknown; role?: unknown; skippedConnect?: boolean }): Promise<Result<{ step: number }>> {
  const { supabase, user } = await currentUser();
  if (!user) return { data: null, error: { message: "Please sign in again.", code: "UNAUTHENTICATED" } };
  if (!Number.isInteger(input.step) || input.step < 1 || input.step > 5) return { data: null, error: { message: "Invalid onboarding step." } };
  const update: Record<string, unknown> = { onboarding_step: input.step };
  if (input.profile) {
    const parsed = profileSchema.safeParse(input.profile);
    if (!parsed.success) return { data: null, error: { message: parsed.error.issues[0]?.message ?? "Please check your profile." } };
    const firstName = parsed.data.full_name.split(/\s+/)[0] ?? parsed.data.full_name;
    Object.assign(update, parsed.data, { display_name: parsed.data.display_name || firstName });
  }
  if (input.role !== undefined) {
    if (!isLearningRole(input.role)) return { data: null, error: { message: "Choose one of the available learning roles." } };
    update.learning_role = input.role;
    update.target_role = input.role;
    // Any unfinished placement attempt belongs to the prior role and must not be reused.
    await supabase.from("assessment_results").update({ status: "abandoned" }).eq("user_id", user.id).eq("status", "in_progress");
  }
  const { error } = await supabase.from("profiles").update(update).eq("user_id", user.id);
  if (error) return { data: null, error: { message: "We couldn't save your progress. Please retry.", code: error.code } };
  if (input.skippedConnect) await supabase.from("activity_logs").insert({ user_id: user.id, action: "onboarding_skip_connect" });
  return { data: { step: input.step }, error: null };
}

export async function connectGitHub(githubUsername: string): Promise<Result<{ githubUsername: string }>> {
  const username = githubUsername.trim().replace(/^@/, "");
  if (!/^[a-zA-Z\d](?:[a-zA-Z\d-]{0,37}[a-zA-Z\d])?$/.test(username)) return { data: null, error: { message: "Enter a valid GitHub username." } };
  const { supabase, user } = await currentUser();
  if (!user) return { data: null, error: { message: "Please sign in again." } };
  const { error } = await supabase.from("profiles").update({ github_username: username, github_connected: true }).eq("user_id", user.id);
  return error ? { data: null, error: { message: "GitHub could not be connected." } } : { data: { githubUsername: username }, error: null };
}

export async function setRole(role: LearningRole) { return saveStep({ step: 4, role }); }
