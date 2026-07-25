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
  if (access.canAccessStudentArea) redirect("/dashboard");
  if (!access.hasCompletedAssessment) redirect(access.nextPath);

  return <AssigningRoadmap />;
}
