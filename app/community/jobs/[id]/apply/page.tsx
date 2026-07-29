import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApplyForm } from "./apply-form";
import { ArrowLeft, Building2 } from "lucide-react";

type Params = Promise<{ id: string }>;

export default async function ApplyPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin?mode=sign-in");

  const { data: job, error } = await supabase
    .from("comm_jobs")
    .select("id, title, company_name, employment_type, workplace_type, location")
    .eq("id", id)
    .single();

  if (error || !job) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, portfolio_url")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-[radial-gradient(#e0e7ff_0.8px,transparent_1px)] bg-[length:4px_4px] py-12">
      <div className="mx-auto max-w-3xl px-6">
        {/* Top bar */}
        <div className="mb-8 flex items-center justify-between">
          <a
            href={`/community/jobs/${id}`}
            className="inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-lg transition hover:bg-white/80"
          >
            <ArrowLeft className="h-4 w-4" /> Back to job
          </a>
          <div className="text-xs text-slate-500">Step 1 of 1</div>
        </div>

        {/* Hero header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-xs font-bold tracking-[3px] text-brand-700 shadow-sm backdrop-blur">
            APPLICATION
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-950">Apply for this opportunity</h1>
          <p className="mt-3 max-w-md mx-auto text-lg text-slate-600">
            Your application will be sent instantly to the hiring team.
          </p>
        </div>

        {/* Main glass card */}
        <div className="glass-panel-strong relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-10 shadow-2xl backdrop-blur-3xl">
          <div className="mb-8 flex items-center gap-4 rounded-2xl bg-white/60 p-5 backdrop-blur">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 text-white shadow-inner">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <div className="font-bold text-xl tracking-tight">{job.title}</div>
              <div className="text-sm text-slate-600">{job.company_name}</div>
              <div className="mt-0.5 text-xs text-slate-500">
                {job.employment_type} · {job.workplace_type}
                {job.location && ` · ${job.location}`}
              </div>
            </div>
          </div>

          <ApplyForm
            jobId={job.id}
            defaultEmail={user.email ?? ""}
            defaultPortfolio={(profile?.portfolio_url as string) ?? ""}
          />
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Your cover letter, resume, and contact details are shared only with the employer.
        </p>
      </div>
    </div>
  );
}
