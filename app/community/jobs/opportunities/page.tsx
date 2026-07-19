import Link from "next/link";
import { ArrowLeft, Building2, MapPin, BriefcaseBusiness, Wallet, Send } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const jobTypeColors: Record<string, string> = {
  internship: "bg-blue-50 text-blue-700",
  full_time: "bg-green-50 text-green-700",
  part_time: "bg-amber-50 text-amber-700",
  contract: "bg-indigo-50 text-indigo-700",
  freelance: "bg-purple-50 text-purple-700",
};

type JobRow = {
  id: string;
  title: string;
  company_name: string;
  description: string;
  employment_type: string;
  workplace_type: string;
  location: string | null;
  skills_required: string[] | null;
  compensation: string;
  experience_required: string;
  application_deadline: string | null;
  created_at: string;
  user_id: string;
};

function humanize(v: string) { return v.replace(/_/g, " "); }

type SearchParams = Promise<{ q?: string; type?: string; workplace?: string }>;

export default async function OpportunitiesPage({ searchParams }: { searchParams: SearchParams }) {
  const { q, type, workplace } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("comm_jobs")
    .select("id, title, company_name, description, employment_type, workplace_type, location, skills_required, compensation, experience_required, application_deadline, created_at, user_id")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(50);

  if (type) query = query.eq("employment_type", type);
  if (workplace) query = query.eq("workplace_type", workplace);
  if (q && q.trim()) query = query.or(`title.ilike.%${q}%,company_name.ilike.%${q}%,description.ilike.%${q}%`);

  const { data, error } = await query;
  const jobs = (data ?? []) as JobRow[];

  let appliedIds = new Set<string>();
  if (user && jobs.length > 0) {
    const { data: myApps } = await supabase
      .from("comm_job_applications")
      .select("job_id")
      .eq("applicant_id", user.id)
      .in("job_id", jobs.map((j) => j.id));
    appliedIds = new Set((myApps ?? []).map((a) => a.job_id as string));
  }

  const setupIssue = error && /comm_jobs|relation .* does not exist/i.test(error.message);

  return (
    <div>
      <Link href="/community/jobs" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to Jobs hub
      </Link>

      <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-black">🎯 Apply for Opportunity</h1>
          <p className="mt-2 text-slate-600">All open roles posted by the community. Apply in one click — the job poster gets notified instantly.</p>
        </div>
      </div>

      <form className="mt-6 grid gap-3 rounded-2xl border border-slate-200 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <input name="q" defaultValue={q ?? ""} className="input" placeholder="Search by role, company, or keyword…" />
        <select name="type" defaultValue={type ?? ""} className="input">
          <option value="">Any type</option>
          <option value="internship">Internship</option>
          <option value="full_time">Full-time</option>
          <option value="part_time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="freelance">Freelance</option>
        </select>
        <select name="workplace" defaultValue={workplace ?? ""} className="input">
          <option value="">Any workplace</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="on_site">On-site</option>
        </select>
        <button type="submit" className="btn-primary">Filter</button>
      </form>

      {setupIssue && (
        <div role="alert" className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Job database needs setup. Apply migration 003_community_feed_and_jobs.sql.
        </div>
      )}

      <div className="mt-6 space-y-4">
        {jobs.length === 0 && !setupIssue && (
          <div className="card text-center">
            <p className="text-4xl">🎯</p>
            <h2 className="mt-4 font-bold">No opportunities match your filters</h2>
            <p className="mt-2 text-sm text-slate-600">Try broadening your search or check back soon.</p>
          </div>
        )}

        {jobs.map((job) => {
          const color = jobTypeColors[job.employment_type] ?? "bg-slate-50 text-slate-700";
          const isOwn = user?.id === job.user_id;
          const alreadyApplied = appliedIds.has(job.id);
          return (
            <div key={job.id} className="card flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${color}`}>{humanize(job.employment_type)}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">{humanize(job.workplace_type)}</span>
                  {alreadyApplied && <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">Applied</span>}
                  {isOwn && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">Your posting</span>}
                </div>
                <Link href={`/community/jobs/${job.id}`} className="mt-3 block text-lg font-bold hover:text-brand-700">{job.title}</Link>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-700"><Building2 className="h-4 w-4" /> {job.company_name}</p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{job.description}</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-slate-400" /> {job.location || "Not specified"}</span>
                  <span className="flex items-center gap-1.5"><Wallet className="h-4 w-4 text-slate-400" /> {job.compensation}</span>
                  <span className="flex items-center gap-1.5"><BriefcaseBusiness className="h-4 w-4 text-slate-400" /> {job.experience_required}</span>
                </div>
                {job.skills_required && job.skills_required.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.skills_required.slice(0, 6).map((s) => (
                      <span key={s} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:w-40">
                <Link href={`/community/jobs/${job.id}`} className="btn-secondary">View details</Link>
                {isOwn ? (
                  <span className="text-center text-xs text-slate-500">Cannot apply to your own post</span>
                ) : alreadyApplied ? (
                  <Link href={`/community/jobs/${job.id}`} className="btn-primary opacity-70">Already applied</Link>
                ) : (
                  <Link href={`/community/jobs/${job.id}/apply`} className="btn-primary inline-flex items-center justify-center gap-2">
                    <Send className="h-4 w-4" /> Apply now
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
