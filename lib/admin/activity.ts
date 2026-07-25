import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Records a sign-in so the admin Student Data view can classify learners as
 * active or inactive.
 *
 * This is best-effort: a missing activity_logs table or an RLS rejection must
 * never block the login redirect, so every failure is swallowed.
 */
export async function recordLoginActivity(supabase: SupabaseClient, userId: string) {
  try {
    await supabase.from("activity_logs").insert({
      user_id: userId,
      action: "login",
      metadata: { source: "auth_callback" },
    });
  } catch {
    // Activity tracking is non-critical.
  }
}
