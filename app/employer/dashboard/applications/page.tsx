import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Inbox, Users } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApplicationsList } from "@/app/community/jobs/manage/applications-list";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ job?: string }>;

export default async function EmployerApplicationsInboxPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { job: filterJob } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/employer/signin?mode=sign-in");

  let jobsQuery = supabase
    .from("comm_jobs")
    .select("id, title, company_name, employment_type, workplace_type, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (filterJob) jobsQuery = jobsQuery.eq("id", filterJob);

  const { data: jobsData } = await jobsQuery;
  const jobs = (jobsData ?? []) as Array<{
    id: string;
    title: string;
    company_name: string;
    employment_type: string;
    workplace_type: string;
    status: string;
    created_at: string;
  }>;

  const jobIds = jobs.map((j) => j.id);
  let apps: Array<{
    id: string;
    job_id: string;
    applicant_id: string;
    cover_letter: string;
    portfolio_url: string | null;
    resume_url: string | null;
    contact_email: string;
    status: string;
    created_at: string;
    applicant: {
      user_id: string;
      full_name: string | null;
      username: string | null;
      target_role: string | null;
    } | null;
  }> = [];

  if (jobIds.length > 0) {
    const { data: appsData } = await supabase
      .from("comm_job_applications")
      .select(
        "id, job_id, applicant_id, cover_letter, portfolio_url, resume_url, contact_email, status, created_at"
      )
      .in("job_id", jobIds)
      .order("created_at", { ascending: false });

    const applicantIds = [...new Set((appsData ?? []).map((a) => a.applicant_id))];
    let profileMap = new Map<
      string,
      { user_id: string; full_name: string | null; username: string | null; target_role: string | null }
    >();
    if (applicantIds.length > 0) {
      const { data: profRows } = await supabase
        .from("comm_public_profiles")
        .select("user_id, full_name, username, target_role")
        .in("user_id", applicantIds);
      profileMap = new Map((profRows ?? []).map((p) => [p.user_id, p]));
    }
    apps = (appsData ?? []).map((a) => ({
      ...a,
      applicant: profileMap.get(a.applicant_id) ?? null,
    })) as typeof apps;
  }

  const jobMap = new Map(jobs.map((j) => [j.id, j]));

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
          <Inbox className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-primary">Applications inbox</h1>
          <p className="text-secondary">
            Get messages when students apply and move candidates through your pipeline.
          </p>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="mt-6 card text-center">
          <p className="text-4xl">💼</p>
          <h2 className="mt-4 font-bold text-primary">No postings yet</h2>
          <p className="mt-2 text-sm text-secondary">Post an opportunity to start receiving applications.</p>
          <Link href="/employer/dashboard/post" className="btn-primary mt-4 inline-flex">
            Post a job
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {jobs.map((job) => {
            const jobApps = apps.filter((a) => a.job_id === job.id);
            return (
              <section
                key={job.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/community/jobs/${job.id}`}
                      className="text-lg font-bold text-primary hover:text-brand-700"
                    >
                      {job.title}
                    </Link>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-secondary">
                      <Building2 className="h-4 w-4" /> {job.company_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`rounded-full px-2.5 py-1 font-bold capitalize ${
                        job.status === "open"
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {job.status}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 font-bold text-brand-700">
                      <Users className="h-3.5 w-3.5" /> {jobApps.length} applicant
                      {jobApps.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
                <ApplicationsList
                  applications={jobApps}
                  jobTitle={jobMap.get(job.id)?.title ?? ""}
                />
                {jobApps.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {jobApps.map((a) => (
                      <Link
                        key={a.id}
                        href={`/employer/dashboard/applications/${a.id}`}
                        className="text-xs font-bold text-brand-600 hover:underline"
                      >
                        Full profile → {a.applicant?.full_name || a.applicant?.username || "candidate"}
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
