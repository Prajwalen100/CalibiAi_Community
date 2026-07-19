import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApplyForm } from "./apply-form";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function ApplyPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: job, error } = await supabase
    .from("comm_jobs")
    .select("id, title, company_name, employment_type, workplace_type, location, status, user_id")
    .eq("id", id)
    .single();
  if (error || !job) notFound();

  if (job.user_id === user.id) {
    redirect(`/community/jobs/${id}`);
  }

  const [{ data: existing }, { data: profile }] = await Promise.all([
    supabase.from("comm_job_applications").select("id, status").eq("job_id", id).eq("applicant_id", user.id).maybeSingle(),
    supabase.from("profiles").select("full_name, portfolio_url").eq("user_id", user.id).maybeSingle(),
  ]);

  return (
    <div>
      <Link href={`/community/jobs/${id}`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to job
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <h1 className="text-2xl font-black">Apply for this opportunity</h1>
          <p className="mt-2 text-slate-600">Fill out the short application below. The job poster will get a notification the moment you submit.</p>

          {existing ? (
            <div className="mt-6 rounded-3xl border border-green-200 bg-green-50 p-6">
              <h2 className="font-bold text-green-900">✅ You&apos;ve already applied</h2>
              <p className="mt-2 text-sm text-green-800">Current status: <span className="font-semibold capitalize">{String(existing.status).replace(/_/g, " ")}</span>.</p>
              <Link href="/community/jobs/applications" className="btn-secondary mt-4 inline-flex">Track your applications</Link>
            </div>
          ) : (
            <ApplyForm jobId={job.id} defaultEmail={user.email ?? ""} defaultPortfolio={(profile?.portfolio_url as string) ?? ""} />
          )}
        </div>

        <aside className="h-fit rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Applying to</p>
          <h2 className="mt-1 font-bold">{job.title}</h2>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-700"><Building2 className="h-4 w-4" /> {job.company_name}</p>
          <p className="mt-3 text-xs text-slate-500 capitalize">{String(job.employment_type).replace(/_/g, " ")} · {String(job.workplace_type).replace(/_/g, " ")}{job.location ? ` · ${job.location}` : ""}</p>
          <p className="mt-4 rounded-xl bg-white p-3 text-xs text-slate-600">🔔 Your application (name, cover letter, and links) is shared with the poster along with an instant notification.</p>
        </aside>
      </div>
    </div>
  );
}
