import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Employer applications inbox now lives under /employer/dashboard/applications */
export default async function ManagePostingsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/employer/signin?mode=sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.role === "employer" || profile?.role === "admin") {
    redirect("/employer/dashboard/applications");
  }

  redirect("/community/jobs");
}
