import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EmployerSignInClient } from "./employer-sign-in-client";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ mode?: "sign-up" | "sign-in" }>;

export default async function EmployerSignInPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { mode: rawMode } = await searchParams;
  const mode: "sign-up" | "sign-in" = rawMode === "sign-in" ? "sign-in" : "sign-up";

  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, target_role")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (profile?.role === "employer") {
        const { data: emp } = await supabase
          .from("employer_profiles")
          .select("onboarding_complete")
          .eq("user_id", data.user.id)
          .maybeSingle();
        redirect(emp?.onboarding_complete ? "/employer/dashboard" : "/employer/onboarding");
      }

      // Student already signed in — send them to student area, not employer
      if (profile?.target_role && profile.role !== "employer") {
        redirect("/dashboard");
      }
    }
  } catch {
    // Supabase offline — still render sign-in
  }

  return <EmployerSignInClient mode={mode} />;
}
