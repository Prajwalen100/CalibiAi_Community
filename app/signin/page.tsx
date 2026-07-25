import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStudentAccess } from "@/lib/auth/student-access";
import { SignInPageClient } from "./sign-in-client";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ mode?: "sign-up" | "sign-in" }>;

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const { mode: rawMode } = await searchParams;
  const mode: "sign-up" | "sign-in" = rawMode === "sign-in" ? "sign-in" : "sign-up";

  // Resolve the destination inside the try, then redirect outside it. Next's
  // redirect() throws internally and must not be swallowed by this fallback.
  let destination: string | null = null;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const access = await getStudentAccess(supabase, user.id);
      if (access.isEmployer) {
        const { data: employer } = await supabase
          .from("employer_profiles")
          .select("onboarding_complete")
          .eq("user_id", user.id)
          .maybeSingle();
        destination = employer?.onboarding_complete ? "/employer/dashboard" : "/employer/onboarding";
      } else {
        destination = access.nextPath;
      }
    }
  } catch {
    // Supabase not configured or temporarily offline — render sign-in.
  }

  if (destination) redirect(destination);
  return <SignInPageClient mode={mode} />;
}
