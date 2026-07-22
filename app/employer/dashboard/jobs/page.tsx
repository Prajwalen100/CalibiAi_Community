import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, ExternalLink, Plus, Users } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { JobStatusToggle } from "./job-status-toggle";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ posted?: string }>;

export default async function EmployerJobsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { posted } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/employer/signin?mode=sign-in");

  const { data: jobsData } = await supabase
    .from("comm_jobs")
    .select(
      "id, title, company_name, employment_type, workplace_type, location, status, created_at, compensation"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const jobs = jobsData ?? [];
  const jobIds = jobs.map((j) => j.id);
  const countMap = new Map<string, number>();

  if (jobIds.length > 0) {
    const { data: apps } = await supabase
      .from("comm_job_applications")
      .select("job_id")
      .in("job_id", jobIds);
    for (const a of apps ?? []) {
      countMap.set(a.job_id, (countMap.get(a.job_id) ?? 0) + 1);
    }
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-black text-primary">My jobs &amp; gigs</h1>
          <p className="mt-2 text-secondary">
            Manage open roles. Live postings appear on student Jobs and Opportunity boards.
          </p>
        </div>
        <Link href="/employer/dashboard/post" className="btn-primary">
          <Plus className="h-4 w-4" /> New posting
        </Link>
      </div>

      {posted === "1" && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Posting published. Students can now find it under Jobs &amp; Opportunities and apply.
        </div>
      )}

      <div className="mt-6 space-y-4">
        {jobs.length === 0 && (
          <div className="card text-center">
            <Building2 className="mx-auto h-10 w-10 text-slate-400" />
            <h2 className="mt-3 font-bold text-primary">No postings yet</h2>
            <p className="mt-1 text-sm text-secondary">Create your first job or freelance gig.</p>
            <Link href="/employer/dashboard/post" className="btn-primary mt-4 inline-flex">
              Post a job
            </Link>
          </div>
        )}

        {jobs.map((job) => {
          const apps = countMap.get(job.id) ?? 0;
          return (
            <article
              key={job.id}
              className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                      job.status === "open"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {job.status}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600 dark:bg-slate-800">
                    {String(job.employment_type).replace(/_/g, " ")}
                  </span>
                </div>
                <h2 className="mt-2 text-lg font-bold text-primary">{job.title}</h2>
                <p className="mt-1 text-sm text-secondary">
                  {job.location || "Location n/a"} · {job.compensation}
                </p>
                <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
                  <Users className="h-3.5 w-3.5" /> {apps} application{apps === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Link href={`/community/jobs/${job.id}`} className="btn-secondary py-2 text-xs">
                  Public view <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href={`/employer/dashboard/applications?job=${job.id}`}
                  className="btn-secondary py-2 text-xs"
                >
                  Inbox
                </Link>
                <JobStatusToggle jobId={job.id} status={job.status as "open" | "closed"} />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
