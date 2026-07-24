import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LEARNING_ROLES, ROLE_DETAILS, getRoleSkills } from "@/lib/learning/content";
import { OnboardingWizard } from "./onboarding-wizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin?mode=sign-in");
  const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (profile?.role === "employer") redirect("/employer/onboarding");
  if (profile?.onboarding_completed) redirect("/dashboard");
  const roles = LEARNING_ROLES.map((id) => ({ id, ...ROLE_DETAILS[id], skills: getRoleSkills(id) }));
  return <OnboardingWizard initialStep={profile?.onboarding_step ?? 1} initialProfile={{ ...profile, full_name: profile?.full_name ?? user.user_metadata.full_name ?? "" }} roles={roles} />;
}
