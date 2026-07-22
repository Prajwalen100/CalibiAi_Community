import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Building2, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Job posting is employer-only. Students who land here are guided to apply;
 * employers are sent to the employer dashboard post flow.
 */
export default async function CreateJobPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/employer/signin?mode=sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.role === "employer" || profile?.role === "admin") {
    const { data: emp } = await supabase
      .from("employer_profiles")
      .select("onboarding_complete")
      .eq("user_id", user.id)
      .maybeSingle();
    redirect(emp?.onboarding_complete ? "/employer/dashboard/post" : "/employer/onboarding");
  }

  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
        <Building2 className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-2xl font-black text-primary">Employers post jobs here</h1>
      <p className="mt-3 text-secondary">
        Job and freelance postings are published from the Employer dashboard so company details stay verified.
        Sign in with an employer account to post a role.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/employer/signin?mode=sign-in" className="btn-primary">
          Employer login <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/community/jobs/opportunities" className="btn-secondary">
          Browse opportunities
        </Link>
      </div>
    </div>
  );
}
