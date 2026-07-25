import { redirect } from "next/navigation";
import { AssigningRoadmap } from "./assigning-roadmap";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStudentAccess } from "@/lib/auth/student-access";

export const dynamic = "force-dynamic";

export default async function AssignRoadmapPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin?mode=sign-in");

  const access = await getStudentAccess(supabase, user.id);
  if (access.isEmployer) redirect("/employer/dashboard");
  if (!access.hasCompletedAssessment) redirect(access.nextPath);

  // Check if user already has a roadmap assigned
  const { data: existingRoadmap } = await supabase
    .from("roadmaps")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  // If user already has a roadmap, redirect to dashboard
  if (existingRoadmap) {
    redirect("/dashboard");
  }

  // User needs a roadmap but doesn't have one - show assignment page
  return <AssigningRoadmap />;
}
