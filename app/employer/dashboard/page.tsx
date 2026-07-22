import Link from "next/link";
import {
  Bell,
  Briefcase,
  Inbox,
  Plus,
  ShieldCheck,
  Users,
  ArrowRight,
  Building2,
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EmployerDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/employer/signin?mode=sign-in");

  const { data: employer } = await supabase
    .from("employer_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: jobs } = await supabase
    .from("comm_jobs")
    .select("id, title, status, employment_type, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const jobList = jobs ?? [];
  const jobIds = jobList.map((j) => j.id);
  const openJobs = jobList.filter((j) => j.status === "open").length;

  let apps: Array<{ id: string; status: string; job_id: string; created_at: string }> = [];
  if (jobIds.length > 0) {
    const { data: appsData } = await supabase
      .from("comm_job_applications")
      .select("id, status, job_id, created_at")
      .in("job_id", jobIds)
      .order("created_at", { ascending: false });
    apps = (appsData ?? []) as typeof apps;
  }

  const newApps = apps.filter((a) => a.status === "submitted").length;
  const shortlisted = apps.filter((a) => a.status === "shortlisted" || a.status === "interviewed").length;

  let unread = 0;
  try {
    const { count } = await supabase
      .from("comm_notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    unread = count ?? 0;
  } catch {
    /* ignore */
  }

  const recentApps = apps.slice(0, 5);
  const jobTitle = new Map(jobList.map((j) => [j.id, j.title]));

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-bold text-brand-600">Employer dashboard</p>
          <h1 className="mt-1 text-3xl font-black text-primary">
            Welcome{employer?.company_name ? `, ${employer.company_name}` : ""}
          </h1>
          <p className="mt-2 max-w-xl text-secondary">
            Post roles, review matched student profiles, and keep every application and notification in one
            focused workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/employer/dashboard/post" className="btn-primary">
            <Plus className="h-4 w-4" /> Post a job
          </Link>
          <Link href="/employer/dashboard/post?category=freelance" className="btn-secondary">
            <Plus className="h-4 w-4" /> Post a gig
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Open postings", value: openJobs, icon: Briefcase, color: "text-brand-600 bg-brand-50" },
          { label: "Total applications", value: apps.length, icon: Inbox, color: "text-indigo-600 bg-indigo-50" },
          { label: "New to review", value: newApps, icon: Users, color: "text-amber-600 bg-amber-50" },
          { label: "In pipeline", value: shortlisted, icon: ShieldCheck, color: "text-emerald-600 bg-emerald-50" },
        ].map((s) => (
          <div key={s.label} className="card">
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${s.color}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="mt-3 text-3xl font-black text-primary">{s.value}</p>
            <p className="text-sm text-secondary">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Link href="/employer/dashboard/applications" className="card transition hover:border-brand-300 hover:shadow-md">
          <Inbox className="h-6 w-6 text-brand-500" />
          <h2 className="mt-4 text-lg font-bold text-primary">Applications inbox</h2>
          <p className="mt-2 text-sm text-secondary">
            Get messages when students apply and move candidates through your pipeline.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand-600">
            Open inbox <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
        <Link href="/employer/dashboard/candidates" className="card transition hover:border-emerald-300 hover:shadow-md">
          <ShieldCheck className="h-6 w-6 text-emerald-500" />
          <h2 className="mt-4 text-lg font-bold text-primary">Full candidate profile</h2>
          <p className="mt-2 text-sm text-secondary">
            See score, verified skills, projects, assessment proof, experience and capability for your job.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-emerald-600">
            View candidates <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
        <Link href="/employer/dashboard/notifications" className="card transition hover:border-amber-300 hover:shadow-md">
          <Bell className="h-6 w-6 text-amber-500" />
          <h2 className="mt-4 text-lg font-bold text-primary">Notifications</h2>
          <p className="mt-2 text-sm text-secondary">
            Stay on top of new applications, offers, messages and interview activity.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-amber-700">
            {unread > 0 ? `${unread} unread` : "View all"} <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-primary">Recent applications</h2>
            <Link href="/employer/dashboard/applications" className="text-sm font-bold text-brand-600">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {recentApps.length === 0 && (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-secondary dark:bg-slate-900">
                No applications yet. Post a job to start receiving candidates.
              </p>
            )}
            {recentApps.map((a) => (
              <Link
                key={a.id}
                href={`/employer/dashboard/applications/${a.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-100 p-3 transition hover:border-brand-200 hover:bg-brand-50/40 dark:border-slate-800"
              >
                <div>
                  <p className="font-semibold text-primary">{jobTitle.get(a.job_id) ?? "Role"}</p>
                  <p className="text-xs text-subtle">{new Date(a.created_at).toLocaleString()}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {a.status.replace(/_/g, " ")}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-primary">Your postings</h2>
            <Link href="/employer/dashboard/jobs" className="text-sm font-bold text-brand-600">
              Manage
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {jobList.length === 0 && (
              <div className="rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-900">
                <Building2 className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-2 text-sm text-secondary">No jobs posted yet.</p>
                <Link href="/employer/dashboard/post" className="btn-primary mt-3 inline-flex">
                  Post your first job
                </Link>
              </div>
            )}
            {jobList.slice(0, 5).map((j) => (
              <div
                key={j.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-slate-800"
              >
                <div>
                  <Link href={`/community/jobs/${j.id}`} className="font-semibold text-primary hover:text-brand-600">
                    {j.title}
                  </Link>
                  <p className="text-xs capitalize text-subtle">{j.employment_type.replace(/_/g, " ")}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                    j.status === "open"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {j.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
