import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, CalendarDays, ExternalLink, Mail, MapPin, Send, Wallet } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

type Job = {
  id: string;
  title: string;
  company_name: string;
  company_website: string | null;
  description: string;
  employment_type: string;
  workplace_type: string;
  location: string | null;
  skills_required: string[] | null;
  compensation: string;
  experience_required: string;
  contact_email: string | null;
  application_url: string | null;
  application_deadline: string | null;
  status: string;
  is_legacy: boolean;
  created_at: string;
};

function humanize(value: string) {
  return value.replace(/_/g, " ");
}

export default async function JobDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("comm_jobs")
    .select("id, title, company_name, company_website, description, employment_type, workplace_type, location, skills_required, compensation, experience_required, contact_email, application_url, application_deadline, status, is_legacy, user_id, created_at")
    .eq("id", id)
    .single();

  if (error || !data) notFound();
  const job = data as Job & { user_id: string };

  const isOwner = !!user && user.id === job.user_id;
  let hasApplied = false;
  let applicationsCount = 0;
  if (user && !isOwner) {
    const { data: existing } = await supabase
      .from("comm_job_applications")
      .select("id")
      .eq("job_id", id)
      .eq("applicant_id", user.id)
      .maybeSingle();
    hasApplied = !!existing;
  }
  if (isOwner) {
    const { count } = await supabase
      .from("comm_job_applications")
      .select("id", { count: "exact", head: true })
      .eq("job_id", id);
    applicationsCount = count ?? 0;
  }

  return (
    <div>
      <Link href="/community/jobs" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to Jobs
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <article className="rounded-3xl border border-slate-200 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold capitalize text-brand-700">{humanize(job.employment_type)}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">{humanize(job.workplace_type)}</span>
            {job.status === "closed" && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">Closed</span>}
            {job.is_legacy && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">Legacy listing</span>}
          </div>

          <h1 className="mt-4 text-3xl font-black">{job.title}</h1>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {job.company_name}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {job.location || "Location not specified"}</span>
            <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-bold">About the role</h2>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">{job.description}</p>
          </section>

          <section className="mt-8 grid gap-5 rounded-2xl bg-slate-50 p-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Compensation</p>
              <p className="mt-1 flex items-start gap-2 font-semibold text-slate-800"><Wallet className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" /> {job.compensation}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Experience</p>
              <p className="mt-1 font-semibold text-slate-800">{job.experience_required}</p>
            </div>
            {job.application_deadline && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Application deadline</p>
                <p className="mt-1 flex items-center gap-2 font-semibold text-slate-800"><CalendarDays className="h-4 w-4 text-brand-700" /> {new Date(job.application_deadline).toLocaleString()}</p>
              </div>
            )}
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-bold">Skills required</h2>
            {job.skills_required && job.skills_required.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {job.skills_required.map((skill) => (
                  <span key={skill} className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700">{skill}</span>
                ))}
              </div>
            ) : <p className="mt-2 text-sm text-slate-500">Skills were not specified for this role.</p>}
          </section>
        </article>

        <aside className="h-fit space-y-4">
          <div className="rounded-3xl border border-brand-100 bg-brand-50 p-6">
            <h2 className="text-lg font-bold text-brand-950">Apply for this opportunity</h2>
            {isOwner ? (
              <>
                <p className="mt-2 text-sm text-brand-900">You own this posting.</p>
                <Link href={`/community/jobs/manage`} className="btn-primary mt-4 inline-flex w-full items-center justify-center gap-2">
                  View {applicationsCount} application{applicationsCount === 1 ? "" : "s"}
                </Link>
              </>
            ) : hasApplied ? (
              <>
                <p className="mt-2 text-sm text-brand-900">You have already applied. Track your status any time.</p>
                <Link href="/community/jobs/applications" className="btn-primary mt-4 inline-flex w-full items-center justify-center gap-2">
                  My applications
                </Link>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-brand-900">Send a structured application right from the community. The poster will get a notification instantly.</p>
                {user ? (
                  <Link href={`/community/jobs/${job.id}/apply`} className="btn-primary mt-4 inline-flex w-full items-center justify-center gap-2">
                    <Send className="h-4 w-4" /> Apply now
                  </Link>
                ) : (
                  <Link href="/signin?mode=sign-in" className="btn-primary mt-4 inline-flex w-full items-center justify-center gap-2">Student sign in to apply</Link>
                )}
              </>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 p-6">
            <h3 className="font-bold">Other ways to reach the employer</h3>
            <div className="mt-3 grid gap-2 text-sm">
              {job.application_url && (
                <a href={job.application_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-brand-700 hover:underline">
                  External application <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {job.contact_email && (
                <a href={`mailto:${job.contact_email}?subject=${encodeURIComponent(`Application for ${job.title}`)}`} className="inline-flex items-center gap-2 text-slate-700 hover:text-ink">
                  <Mail className="h-4 w-4" /> {job.contact_email}
                </a>
              )}
              {job.company_website && (
                <a href={job.company_website} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-slate-700 hover:underline">
                  Visit company website
                </a>
              )}
              {!job.contact_email && !job.application_url && !job.company_website && (
                <p className="text-sm text-slate-500">No external contact provided.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
