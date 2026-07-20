import Link from "next/link";
import { BriefcaseBusiness, Plus, Search, Building2, Briefcase, Users, ArrowRight } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ScrollReveal, StaggerReveal, GlowOnHover, Floating } from "@/components/scroll-reveal";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let openCount = 0;
  let myPostingsCount = 0;
  let myApplicationsCount = 0;

  const openResult = await supabase
    .from("comm_jobs")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");
  openCount = openResult.count ?? 0;

  if (user) {
    const [postings, apps] = await Promise.all([
      supabase.from("comm_jobs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("comm_job_applications").select("id", { count: "exact", head: true }).eq("applicant_id", user.id),
    ]);
    myPostingsCount = postings.count ?? 0;
    myApplicationsCount = apps.count ?? 0;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <ScrollReveal direction="up" className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 mb-3">
            <Briefcase className="h-3.5 w-3.5" />
            <span>Job Board</span>
          </div>
          <h1 className="text-2xl font-black text-primary">💼 Jobs &amp; Opportunities</h1>
          <p className="mt-2 text-secondary">Post a role for your team or browse open opportunities and apply in one click.</p>
        </div>
      </ScrollReveal>

      {/* Stats */}
      <ScrollReveal direction="up" delay={100} className="grid gap-4 sm:grid-cols-3">
        <div className="glass-panel p-4 text-center">
          <p className="text-2xl font-black text-primary">{openCount}</p>
          <p className="text-xs text-subtle">Open Opportunities</p>
        </div>
        {user && (
          <>
            <div className="glass-panel p-4 text-center">
              <p className="text-2xl font-black text-primary">{myPostingsCount}</p>
              <p className="text-xs text-subtle">My Postings</p>
            </div>
            <div className="glass-panel p-4 text-center">
              <p className="text-2xl font-black text-primary">{myApplicationsCount}</p>
              <p className="text-xs text-subtle">My Applications</p>
            </div>
          </>
        )}
      </ScrollReveal>

      {/* Main Action Cards */}
      <StaggerReveal staggerDelay={150} direction="up" className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Post the Job */}
        <GlowOnHover color="brand" intensity="normal" className="group">
          <Link href="/community/jobs/create" className="glass-panel-strong group flex flex-col justify-between gap-4 p-6 transition-all duration-300 hover:border-brand-500/50 hover:shadow-xl hover:-translate-y-1 h-full">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white group-hover:scale-110 transition-transform">
                <Plus className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-xl font-black text-primary">Post the Job</h2>
              <p className="mt-2 text-sm text-secondary">Publish a role with skills, compensation, experience, and receive applications with instant notifications.</p>
              <ul className="mt-4 space-y-1 text-xs text-secondary">
                <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> Structured job form</li>
                <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> Applications land in your inbox</li>
                <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> Update statuses (shortlist, reject, hire)</li>
              </ul>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-bold text-brand-600 dark:text-brand-400 group-hover:gap-2 transition-all">
              {user ? "Create posting" : "Sign in to post"} →
            </span>
          </Link>
        </GlowOnHover>

        {/* Apply for Opportunity */}
        <GlowOnHover color="success" intensity="normal" className="group">
          <Link href="/community/jobs/opportunities" className="glass-panel-strong group flex flex-col justify-between gap-4 p-6 transition-all duration-300 hover:border-emerald-500/50 hover:shadow-xl hover:-translate-y-1 h-full">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white group-hover:scale-110 transition-transform">
                <Search className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-xl font-black text-primary">Apply for Opportunity</h2>
              <p className="mt-2 text-sm text-secondary">Browse every open role in the community, filter by type or workplace, and apply — the poster gets notified instantly.</p>
              <ul className="mt-4 space-y-1 text-xs text-secondary">
                <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {openCount} open opportunit{openCount === 1 ? "y" : "ies"} right now</li>
                <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> One-click structured application</li>
                <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Track status in your dashboard</li>
              </ul>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400 group-hover:gap-2 transition-all">
              Browse opportunities →
            </span>
          </Link>
        </GlowOnHover>
      </StaggerReveal>

      {user && (
        <StaggerReveal staggerDelay={150} direction="up" className="mt-8 grid gap-4 sm:grid-cols-2">
          <GlowOnHover color="brand" intensity="subtle" className="group">
            <Link href="/community/jobs/manage" className="glass-panel p-5 transition-all duration-300 hover:border-brand-500/50 hover:shadow-lg hover:-translate-y-0.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400 group-hover:scale-110 transition-transform">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-primary">My postings</p>
                  <p className="text-xs text-subtle">{myPostingsCount} job{myPostingsCount === 1 ? "" : "s"} · View applications received</p>
                </div>
              </div>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand-600 dark:text-brand-400 group-hover:gap-2 transition-all">
                Manage →
              </div>
            </Link>
          </GlowOnHover>
          
          <GlowOnHover color="success" intensity="subtle" className="group">
            <Link href="/community/jobs/applications" className="glass-panel p-5 transition-all duration-300 hover:border-emerald-500/50 hover:shadow-lg hover:-translate-y-0.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <BriefcaseBusiness className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-primary">My applications</p>
                  <p className="text-xs text-subtle">{myApplicationsCount} submitted · Track your status</p>
                </div>
              </div>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400 group-hover:gap-2 transition-all">
                Track →
              </div>
            </Link>
          </GlowOnHover>
        </StaggerReveal>
      )}

      {!user && (
        <ScrollReveal direction="up" delay={300} className="mt-8">
          <div className="glass-panel text-center py-8">
            <Floating amplitude={8} duration={3000}>
              <p className="text-4xl">💼</p>
            </Floating>
            <h3 className="mt-4 font-bold text-primary">Join to access the job board</h3>
            <p className="mt-2 text-sm text-secondary">Sign in to post jobs, apply for opportunities, and track your applications.</p>
            <Link href="/" className="btn-primary mt-4 inline-flex items-center gap-2">
              <Users className="h-4 w-4" />
              Join Community
            </Link>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}