import Link from "next/link";
import { BriefcaseBusiness, Plus, Search, Building2 } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let openCount = 0;
  let myPostingsCount = 0;
  let myApplicationsCount = 0;

  const openResult = await supabase
    .from("comm_jobs")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");
  openCount = openResult.count ?? 0;

  if (user) {
    const [postings, apps] = await Promise.all([
      supabase.from("comm_jobs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("comm_job_applications").select("id", { count: "exact", head: true }).eq("applicant_id", user.id),
    ]);
    myPostingsCount = postings.count ?? 0;
    myApplicationsCount = apps.count ?? 0;
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-black">💼 Jobs &amp; Opportunities</h1>
          <p className="mt-2 text-slate-600">Post a role for your team or browse open opportunities and apply in one click.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Post the Job */}
        <Link href="/community/jobs/create" className="card group flex flex-col justify-between gap-4 border-2 border-transparent bg-gradient-to-br from-brand-50 to-white transition hover:border-brand-500">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
              <Plus className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-black">Post the Job</h2>
            <p className="mt-2 text-sm text-slate-600">Publish a role with skills, compensation, experience, and receive applications with instant notifications.</p>
            <ul className="mt-4 space-y-1 text-xs text-slate-600">
              <li>• Structured job form</li>
              <li>• Applications land in your inbox</li>
              <li>• Update statuses (shortlist, reject, hire)</li>
            </ul>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-brand-700">
            {user ? "Create posting" : "Sign in to post"} →
          </span>
        </Link>

        {/* Apply for Opportunity */}
        <Link href="/community/jobs/opportunities" className="card group flex flex-col justify-between gap-4 border-2 border-transparent bg-gradient-to-br from-indigo-50 to-white transition hover:border-indigo-500">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white">
              <Search className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-black">Apply for Opportunity</h2>
            <p className="mt-2 text-sm text-slate-600">Browse every open role in the community, filter by type or workplace, and apply — the poster gets notified instantly.</p>
            <ul className="mt-4 space-y-1 text-xs text-slate-600">
              <li>• {openCount} open opportunit{openCount === 1 ? "y" : "ies"} right now</li>
              <li>• One-click structured application</li>
              <li>• Track status in your dashboard</li>
            </ul>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-indigo-700">Browse opportunities →</span>
        </Link>
      </div>

      {user && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/community/jobs/manage" className="rounded-2xl border border-slate-200 p-5 transition hover:border-brand-500">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-slate-500" />
              <div>
                <p className="font-bold">My postings</p>
                <p className="text-xs text-slate-500">{myPostingsCount} job{myPostingsCount === 1 ? "" : "s"} · View applications received</p>
              </div>
            </div>
          </Link>
          <Link href="/community/jobs/applications" className="rounded-2xl border border-slate-200 p-5 transition hover:border-brand-500">
            <div className="flex items-center gap-3">
              <BriefcaseBusiness className="h-5 w-5 text-slate-500" />
              <div>
                <p className="font-bold">My applications</p>
                <p className="text-xs text-slate-500">{myApplicationsCount} submitted · Track your status</p>
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
