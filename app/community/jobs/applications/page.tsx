import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Building2, CheckCircle2, Gift } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { RespondToOffer } from "./respond-offer";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  submitted: "bg-slate-100 text-slate-700",
  shortlisted: "bg-amber-50 text-amber-800",
  interviewed: "bg-indigo-50 text-indigo-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-rose-50 text-rose-700",
};

type SearchParams = Promise<{ submitted?: string }>;

export default async function MyApplicationsPage({ searchParams }: { searchParams: SearchParams }) {
  const { submitted } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin?mode=sign-in");

  const { data, error } = await supabase
    .from("comm_job_applications")
    .select(
      "id, status, cover_letter, created_at, job_id, comm_jobs:job_id(id, title, company_name, employment_type, status)"
    )
    .eq("applicant_id", user.id)
    .order("created_at", { ascending: false });

  type RawApp = {
    id: string;
    status: string;
    cover_letter: string;
    created_at: string;
    job_id: string;
    comm_jobs:
      | { id: string; title: string; company_name: string; employment_type: string; status: string }
      | Array<{ id: string; title: string; company_name: string; employment_type: string; status: string }>
      | null;
  };
  const rawApps = (data ?? []) as unknown as RawApp[];
  const apps = rawApps.map((a) => {
    const job = Array.isArray(a.comm_jobs) ? a.comm_jobs[0] ?? null : a.comm_jobs;
    return { ...a, comm_jobs: job };
  });

  let offers: Array<{
    id: string;
    application_id: string;
    message: string;
    compensation: string | null;
    start_date: string | null;
    status: string;
    created_at: string;
  }> = [];
  try {
    const { data: offerRows } = await supabase
      .from("comm_job_offers")
      .select("id, application_id, message, compensation, start_date, status, created_at")
      .eq("applicant_id", user.id)
      .order("created_at", { ascending: false });
    offers = (offerRows ?? []) as typeof offers;
  } catch {
    /* optional table */
  }

  const offersByApp = new Map<string, typeof offers>();
  for (const o of offers) {
    const list = offersByApp.get(o.application_id) ?? [];
    list.push(o);
    offersByApp.set(o.application_id, list);
  }

  const setupIssue = error && /comm_job_applications|relation .* does not exist/i.test(error.message);

  return (
    <div>
      <Link
        href="/community/jobs"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Jobs hub
      </Link>

      <h1 className="mt-4 text-2xl font-black">📨 My applications</h1>
      <p className="mt-2 text-slate-600">
        Track every opportunity you&apos;ve applied to, see pipeline updates, and respond to employer offers.
      </p>

      {submitted && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle2 className="h-5 w-5" /> Your application has been sent and the employer has been notified.
        </div>
      )}

      {setupIssue && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Applications database needs setup. Apply migration 004_squads_events_applications.sql.
        </div>
      )}

      <div className="mt-6 space-y-4">
        {apps.length === 0 && !setupIssue && (
          <div className="card text-center">
            <p className="text-4xl">📨</p>
            <h2 className="mt-4 font-bold">You haven&apos;t applied to any opportunities yet</h2>
            <p className="mt-2 text-sm text-slate-600">Browse opportunities and apply in one click.</p>
            <Link href="/community/jobs/opportunities" className="btn-primary mt-4 inline-flex">
              Browse opportunities
            </Link>
          </div>
        )}

        {apps.map((a) => {
          const appOffers = offersByApp.get(a.id) ?? [];
          return (
            <div key={a.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Link
                    href={`/community/jobs/${a.job_id}`}
                    className="text-lg font-bold hover:text-brand-700"
                  >
                    {a.comm_jobs?.title ?? "Opportunity"}
                  </Link>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                    <Building2 className="h-4 w-4" /> {a.comm_jobs?.company_name ?? "—"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                    statusStyles[a.status] ?? "bg-slate-100 text-slate-700"
                  }`}
                >
                  {a.status.replace(/_/g, " ")}
                </span>
              </div>
              <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm text-slate-600">{a.cover_letter}</p>
              <p className="mt-3 text-xs text-slate-500">
                Submitted {new Date(a.created_at).toLocaleString()}
              </p>

              {appOffers.map((o) => (
                <div
                  key={o.id}
                  className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                >
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-emerald-600" />
                    <p className="font-bold text-emerald-900 dark:text-emerald-100">
                      Offer from employer · {o.status}
                    </p>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-emerald-900 dark:text-emerald-100">
                    {o.message}
                  </p>
                  {(o.compensation || o.start_date) && (
                    <p className="mt-2 text-xs text-emerald-800 dark:text-emerald-200">
                      {o.compensation ? `Compensation: ${o.compensation}` : ""}
                      {o.compensation && o.start_date ? " · " : ""}
                      {o.start_date ? `Start: ${o.start_date}` : ""}
                    </p>
                  )}
                  {o.status === "pending" && <RespondToOffer offerId={o.id} />}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
