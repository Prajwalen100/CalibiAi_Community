import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, Inbox, Plus, ShieldCheck, Building2, ArrowRight } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EmployerLandingPage() {
  // If already an onboarded employer, go straight to dashboard
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile?.role === "employer") {
        const { data: emp } = await supabase
          .from("employer_profiles")
          .select("onboarding_complete")
          .eq("user_id", user.id)
          .maybeSingle();
        redirect(emp?.onboarding_complete ? "/employer/dashboard" : "/employer/onboarding");
      }
    }
  } catch {
    /* render marketing page */
  }

  return (
    <main className="container py-12 sm:py-16">
      <div className="max-w-3xl">
        <p className="font-bold text-brand-600">Employer workspace</p>
        <h1 className="mt-2 heading-1 text-primary">Hire with verified signal.</h1>
        <p className="mt-4 body-lg text-secondary">
          Post roles, review matched student profiles, and keep every application and notification in one focused
          workspace. Jobs you publish appear instantly on the student Jobs &amp; Opportunity boards.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/employer/signin?mode=sign-up" className="btn-primary">
            <Building2 className="h-4 w-4" /> Employer sign up
          </Link>
          <Link href="/employer/signin?mode=sign-in" className="btn-secondary">
            Employer login <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        <div className="card">
          <Inbox className="h-6 w-6 text-brand-500" />
          <h2 className="mt-4 text-lg font-bold text-primary">Applications inbox</h2>
          <p className="mt-2 text-sm text-secondary">
            Get messages when students apply and move candidates through your pipeline.
          </p>
        </div>
        <div className="card">
          <ShieldCheck className="h-6 w-6 text-emerald-500" />
          <h2 className="mt-4 text-lg font-bold text-primary">Full candidate profile</h2>
          <p className="mt-2 text-sm text-secondary">
            See score, verified skills, projects, assessment proof, experience and capability for your job.
          </p>
        </div>
        <div className="card">
          <Bell className="h-6 w-6 text-amber-500" />
          <h2 className="mt-4 text-lg font-bold text-primary">Notifications</h2>
          <p className="mt-2 text-sm text-secondary">
            Stay on top of new applications, offers, messages and interview activity.
          </p>
        </div>
      </div>

      <div className="mt-10 card">
        <h2 className="text-xl font-bold text-primary">What you can do</h2>
        <div className="mt-4 grid gap-3 text-sm text-secondary sm:grid-cols-2">
          <span className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4 text-brand-500" /> Post full-time, internship, contract & freelance gigs
          </span>
          <span>• Compensation and employment type</span>
          <span>• Location and remote policy</span>
          <span>• Job description and responsibilities</span>
          <span>• Required and preferred skills</span>
          <span>• Review student applications & make offers</span>
        </div>
      </div>
    </main>
  );
}
