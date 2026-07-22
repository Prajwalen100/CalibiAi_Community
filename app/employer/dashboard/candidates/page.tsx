import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, Users } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EmployerCandidatesPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/employer/signin?mode=sign-in");

  const { data: jobs } = await supabase.from("comm_jobs").select("id, title").eq("user_id", user.id);
  const jobList = jobs ?? [];
  const jobIds = jobList.map((j) => j.id);
  const jobTitle = new Map(jobList.map((j) => [j.id, j.title]));

  if (jobIds.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-black text-primary">Candidates</h1>
        <p className="mt-2 text-secondary">
          See score, verified skills, projects, assessment proof, experience and capability for your jobs.
        </p>
        <div className="mt-6 card text-center">
          <Users className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-3 font-bold">No candidates yet</p>
          <p className="mt-1 text-sm text-secondary">Post a job to start receiving applications.</p>
          <Link href="/employer/dashboard/post" className="btn-primary mt-4 inline-flex">
            Post a job
          </Link>
        </div>
      </div>
    );
  }

  const { data: appsData } = await supabase
    .from("comm_job_applications")
    .select("id, job_id, applicant_id, status, created_at, contact_email")
    .in("job_id", jobIds)
    .order("created_at", { ascending: false });

  const apps = appsData ?? [];
  const applicantIds = [...new Set(apps.map((a) => a.applicant_id))];

  const [{ data: profiles }, { data: scores }] = await Promise.all([
    applicantIds.length
      ? supabase
          .from("comm_public_profiles")
          .select("user_id, full_name, username, target_role")
          .in("user_id", applicantIds)
      : Promise.resolve({ data: [] as Array<{ user_id: string; full_name: string | null; username: string | null; target_role: string | null }> }),
    applicantIds.length
      ? supabase.from("scores").select("user_id, total, tier").in("user_id", applicantIds)
      : Promise.resolve({ data: [] as Array<{ user_id: string; total: number; tier: string }> }),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  const scoreMap = new Map((scores ?? []).map((s) => [s.user_id, s]));

  // Dedupe by applicant (latest app)
  const seen = new Set<string>();
  const unique = apps.filter((a) => {
    if (seen.has(a.applicant_id)) return false;
    seen.add(a.applicant_id);
    return true;
  });

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-primary">Full candidate profiles</h1>
          <p className="text-secondary">
            Score, verified skills, projects, assessment proof, experience and capability for your jobs.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {unique.length === 0 && (
          <div className="card col-span-full text-center">
            <p className="text-sm text-secondary">No applicants yet.</p>
          </div>
        )}
        {unique.map((a) => {
          const p = profileMap.get(a.applicant_id);
          const s = scoreMap.get(a.applicant_id);
          return (
            <Link
              key={a.applicant_id}
              href={`/employer/dashboard/applications/${a.id}`}
              className="card transition hover:border-brand-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-primary">
                    {p?.full_name || p?.username || "Candidate"}
                  </p>
                  <p className="text-xs text-subtle">
                    {p?.username ? `@${p.username}` : a.contact_email}
                    {p?.target_role ? ` · ${p.target_role}` : ""}
                  </p>
                </div>
                <div className="rounded-xl bg-brand-50 px-3 py-2 text-center dark:bg-brand-950/40">
                  <p className="text-lg font-black text-brand-700">{s?.total ?? "—"}</p>
                  <p className="text-[10px] font-bold uppercase text-brand-600">{s?.tier ?? "n/a"}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-secondary">
                Applied to <span className="font-semibold">{jobTitle.get(a.job_id)}</span>
              </p>
              <span className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold capitalize text-slate-700 dark:bg-slate-800">
                {a.status.replace(/_/g, " ")}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
