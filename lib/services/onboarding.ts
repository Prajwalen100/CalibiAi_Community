import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isLearningRole, type LearningRole } from "@/lib/learning/content";

export type Result<T> = { data: T; error: null } | { data: null; error: { message: string; code?: string } };

const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .refine((value) => /[\p{L}\p{N}]/u.test(value), "Enter your name using letters or numbers."),
  display_name: z.string().trim().max(60).optional(),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number.")
    .max(30, "Phone number is too long."),
  college: z
    .string()
    .trim()
    .min(2, "Enter your college or university name.")
    .max(160, "College name is too long."),
  country: z.enum(["IN", "US", "GB", "CA", "AU", "OTHER"]),
  timezone: z.string().trim().min(1).max(100),
  education_level: z.enum(["High School", "Undergraduate", "Graduate", "Professional"]),
  experience_level: z.enum(["New to tech", "Some coding", "Experienced"]),
  weekly_hours: z.number().int().min(3).max(40),
});

async function currentUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

function initialUsername(user: { id: string; email?: string | null }) {
  const emailPrefix = user.email?.split("@")[0] ?? "student";
  const safePrefix = emailPrefix.toLowerCase().replace(/[^a-z0-9_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return `${safePrefix || "student"}-${user.id.slice(0, 8)}`.slice(0, 48);
}

/** Create the required profile row for auth users who do not have one yet. */
async function ensureStudentProfile(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }
): Promise<{ error: { message: string; code?: string } | null }> {
  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (readError) {
    return { error: { message: "We couldn't load your profile. Please retry.", code: readError.code } };
  }
  if (existing) return { error: null };

  const metadataName = user.user_metadata?.full_name ?? user.user_metadata?.name;
  const { error } = await supabase.from("profiles").insert({
    user_id: user.id,
    email: user.email ?? null,
    username: initialUsername(user),
    full_name: typeof metadataName === "string" ? metadataName : null,
    role: "student",
  });

  return error
    ? { error: { message: "We couldn't create your student profile. Please retry.", code: error.code } }
    : { error: null };
}

export async function saveStep(input: { step: number; profile?: unknown; role?: unknown; skippedConnect?: boolean }): Promise<Result<{ step: number }>> {
  const { supabase, user } = await currentUser();
  if (!user) return { data: null, error: { message: "Please sign in again.", code: "UNAUTHENTICATED" } };
  if (!Number.isInteger(input.step) || input.step < 1 || input.step > 5) {
    return { data: null, error: { message: "Invalid onboarding step." } };
  }

  const ensured = await ensureStudentProfile(supabase, user);
  if (ensured.error) return { data: null, error: ensured.error };

  const update: Record<string, unknown> = { onboarding_step: input.step };
  if (input.profile) {
    const parsed = profileSchema.safeParse(input.profile);
    if (!parsed.success) {
      return { data: null, error: { message: parsed.error.issues[0]?.message ?? "Please check your profile." } };
    }
    const firstName = parsed.data.full_name.split(/\s+/)[0] ?? parsed.data.full_name;
    Object.assign(update, parsed.data, { display_name: parsed.data.display_name || firstName });
  }

  if (input.role !== undefined) {
    if (!isLearningRole(input.role)) {
      return { data: null, error: { message: "Choose one of the available learning roles." } };
    }
    update.learning_role = input.role;
    update.target_role = input.role;
    // Any unfinished placement attempt belongs to the prior role and must not be reused.
    const { error: abandonError } = await supabase
      .from("assessment_results")
      .update({ status: "abandoned" })
      .eq("user_id", user.id)
      .eq("status", "in_progress");
    if (abandonError) {
      return { data: null, error: { message: "We couldn't update your assessment role. Please retry.", code: abandonError.code } };
    }
  }

  const { data: saved, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("user_id", user.id)
    .select("user_id")
    .maybeSingle();
  if (error || !saved) {
    return {
      data: null,
      error: { message: "We couldn't save your progress. Please retry.", code: error?.code },
    };
  }

  if (input.skippedConnect) {
    // Analytics must never block the learner from continuing.
    await supabase.from("activity_logs").insert({ user_id: user.id, action: "onboarding_skip_connect" });
  }
  return { data: { step: input.step }, error: null };
}

export async function connectGitHub(githubUsername: string): Promise<Result<{ githubUsername: string }>> {
  const username = githubUsername.trim().replace(/^@/, "");
  if (!/^[a-zA-Z\d](?:[a-zA-Z\d-]{0,37}[a-zA-Z\d])?$/.test(username)) {
    return { data: null, error: { message: "Enter a valid GitHub username." } };
  }

  const { supabase, user } = await currentUser();
  if (!user) return { data: null, error: { message: "Please sign in again.", code: "UNAUTHENTICATED" } };

  const ensured = await ensureStudentProfile(supabase, user);
  if (ensured.error) return { data: null, error: ensured.error };

  const { data: saved, error } = await supabase
    .from("profiles")
    .update({ github_username: username, github_connected: true })
    .eq("user_id", user.id)
    .select("user_id")
    .maybeSingle();

  return error || !saved
    ? { data: null, error: { message: "GitHub could not be connected.", code: error?.code } }
    : { data: { githubUsername: username }, error: null };
}

export async function setRole(role: LearningRole) {
  return saveStep({ step: 4, role });
}
