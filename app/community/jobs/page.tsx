import Link from "next/link";
import { BriefcaseBusiness, Building2, MapPin, Plus, Wallet } from "lucide-react";
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
};

function humanize(value: string) {
  return value.replace(/_/g, " ");
}

export default async function JobsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let jobs: JobRow[] = [];
  let loadError: string | null = null;

  const { data, error } = await supabase
    .from("comm_jobs")
    .select("id, title, company_name, description, employment_type, workplace_type, location, skills_required, compensation, experience_required, application_deadline, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    loadError = /comm_jobs|relation .* does not exist/i.test(error.message)
      ? "The jobs database has not been set up yet. Apply migration 003_community_feed_and_jobs.sql to enable dedicated job postings."
      : "Job postings could not be loaded right now. Please refresh and try again.";
  } else {
    jobs = (data ?? []) as JobRow[];
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-black">💼 Jobs & Internships</h1>
          <p className="mt-2 text-slate-600">Dedicated opportunities with skills, compensation, experience, and direct contact details.</p>
        </div>
        {user && (
          <Link href="/community/jobs/create" className="btn-primary inline-flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" /> Post a Job
          </Link>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Object.entries(jobTypeColors).map(([type, color]) => {
          const count = jobs.filter((job) => job.employment_type === type).length;
          return (
            <div key={type} className="card text-center">
              <p className="text-xl font-black">{count}</p>
              <p className={`text-xs font-semibold capitalize ${color.split(" ")[1]}`}>{humanize(type)}</p>
            </div>
          );
        })}
      </div>

      {loadError && (
        <div role="alert" className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-bold">Jobs setup needed</p>
          <p className="mt-1">{loadError}</p>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {jobs.length > 0 ? jobs.map((job) => {
          const color = jobTypeColors[job.employment_type] ?? "bg-slate-50 text-slate-700";
          return (
            <Link key={job.id} href={`/community/jobs/${job.id}`} className="card block transition-colors hover:border-brand-500">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${color}`}>{humanize(job.employment_type)}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">{humanize(job.workplace_type)}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-bold">{job.title}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-700"><Building2 className="h-4 w-4" /> {job.company_name}</p>
                  <p className="mt-3 line-clamp-2 text-sm text-slate-600">{job.description}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700">View role <BriefcaseBusiness className="h-4 w-4" /></span>
              </div>

              <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-sm text-slate-600 sm:grid-cols-3">
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-slate-400" /> {job.location || "Location not specified"}</span>
                <span className="flex items-center gap-1.5"><Wallet className="h-4 w-4 text-slate-400" /> {job.compensation}</span>
                <span>Experience: {job.experience_required}</span>
              </div>

              {job.skills_required && job.skills_required.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.skills_required.slice(0, 6).map((skill) => (
                    <span key={skill} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">{skill}</span>
                  ))}
                </div>
              )}
            </Link>
          );
        }) : !loadError ? (
          <div className="card text-center">
            <p className="text-4xl">💼</p>
            <h2 className="mt-4 font-bold">No open jobs posted yet</h2>
            <p className="mt-2 text-sm text-slate-600">Be the first to share a complete opportunity with the community.</p>
            {user && <Link href="/community/jobs/create" className="btn-primary mt-4 inline-block">Post a Job</Link>}
          </div>
        ) : null}
      </div>
    </div>
  );
}
