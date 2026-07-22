import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EmployerOnboardingForm } from "./onboarding-form";
import { AnimatedBrandLogo } from "@/components/brand-logo";
import { ScrollReveal } from "@/components/scroll-reveal";
import { Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EmployerOnboardingPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/employer/signin?mode=sign-in");

  const { data: existing } = await supabase
    .from("employer_profiles")
    .select("onboarding_complete")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.onboarding_complete) {
    redirect("/employer/dashboard");
  }

  const defaultName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    "";

  return (
    <main className="relative min-h-screen overflow-hidden py-12">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-full w-full -translate-x-1/2 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-indigo-500/20 via-brand-500/15 to-purple-500/20 blur-[120px]" />
      </div>

      <div className="container max-w-2xl">
        <ScrollReveal direction="up">
          <Link href="/" className="inline-flex">
            <AnimatedBrandLogo size="md" />
          </Link>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
            <Building2 className="h-3.5 w-3.5" />
            Employer onboarding
          </div>
          <h1 className="mt-3 heading-2 text-primary">Tell us about your company</h1>
          <p className="mt-2 text-secondary">
            A complete company profile helps students trust your opportunities. After this you can post jobs that
            appear on the student Jobs &amp; Opportunity boards.
          </p>

          <EmployerOnboardingForm defaultEmail={user.email ?? ""} defaultName={defaultName} />
        </ScrollReveal>
      </div>
    </main>
  );
}
