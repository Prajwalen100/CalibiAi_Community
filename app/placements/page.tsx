import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  BriefcaseBusiness,
  Building2,
  Wallet,
  Send,
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
  created_at: string;
  user_id: string;
  category?: string | null;
};

function humanize(v: string) {
  return v.replace(/_/g, " ");
}

export default async function PlacementsPage() {
  let jobs: JobRow[] = [];
  let gigs: JobRow[] = [];
  let userId: string | null = null;
  let appliedIds = new Set<string>();
  let setupIssue = false;

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;

    let { data, error } = await supabase
      .from("comm_jobs")
      .select(
        "id, title, company_name, description, employment_type, workplace_type, location, skills_required, compensation, experience_required, created_at, user_id, category"
      )
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(60);

    // category column arrives with migration 006 — fall back if missing
    if (error && /category|column/i.test(error.message)) {
      const fallback = await supabase
        .from("comm_jobs")
        .select(
          "id, title, company_name, description, employment_type, workplace_type, location, skills_required, compensation, experience_required, created_at, user_id"
        )
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(60);
      data = fallback.data as typeof data;
      error = fallback.error;
    }

    if (error && /comm_jobs|relation .* does not exist/i.test(error.message)) {
      setupIssue = true;
    } else if (!error) {
      const all = (data ?? []) as JobRow[];
      gigs = all.filter(
        (j) => j.employment_type === "freelance" || j.category === "freelance"
      );
      jobs = all.filter(
        (j) => j.employment_type !== "freelance" && j.category !== "freelance"
      );
    }

    if (user && (jobs.length > 0 || gigs.length > 0)) {
      const ids = [...jobs, ...gigs].map((j) => j.id);
      const { data: myApps } = await supabase
        .from("comm_job_applications")
        .select("job_id")
        .eq("applicant_id", user.id)
        .in("job_id", ids);
      appliedIds = new Set((myApps ?? []).map((a) => a.job_id as string));
    }
  } catch {
    setupIssue = true;
  }

  return (
    <main className="container py-12 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-bold text-brand-600">Student opportunities</p>
          <h1 className="mt-2 heading-1 text-primary">Find your next opportunity.</h1>
          <p className="mt-4 max-w-2xl body-lg text-secondary">
            Live jobs and freelance gigs posted by employers — apply with your verified CalibiAI profile.
          </p>
        </div>
        <Link href="/employer" className="btn-secondary">
          I&apos;m an employer <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-10 flex gap-2 border-b border-slate-200 dark:border-slate-800">
        <a href="#jobs" className="border-b-2 border-brand-500 px-4 py-3 text-sm font-bold text-brand-600">
          Jobs ({jobs.length})
        </a>
        <a href="#freelance" className="px-4 py-3 text-sm font-bold text-secondary hover:text-primary">
          Freelance gigs ({gigs.length})
        </a>
      </div>

      {setupIssue && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Job database is not connected yet. Employers can post once Supabase migrations 003 and 006 are applied.
        </div>
      )}

      <section id="jobs" className="mt-8 space-y-4">
        {jobs.length === 0 && !setupIssue && (
          <div className="card text-center">
            <p className="text-4xl">💼</p>
            <h2 className="mt-4 font-bold text-primary">No open jobs right now</h2>
            <p className="mt-2 text-sm text-secondary">
              When employers post roles, they will show up here automatically. Check Community → Jobs too.
            </p>
            <Link href="/community/jobs/opportunities" className="btn-primary mt-4 inline-flex">
              Browse all opportunities
            </Link>
          </div>
        )}

        {jobs.map((j) => {
          const already = appliedIds.has(j.id);
          const isOwn = userId === j.user_id;
          return (
            <article className="card" key={j.id}>
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <BriefcaseBusiness className="h-5 w-5 text-brand-500" />
                    <h2 className="text-xl font-bold text-primary">{j.title}</h2>
                    <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold capitalize text-brand-700">
                      {humanize(j.employment_type)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-secondary">
                    <Building2 className="mr-1 inline h-3.5 w-3.5" />
                    {j.company_name} · <MapPin className="inline h-3.5 w-3.5" />{" "}
                    {j.location || humanize(j.workplace_type)}
                  </p>
                </div>
                {isOwn ? (
                  <span className="text-xs font-semibold text-subtle">Your posting</span>
                ) : already ? (
                  <Link href="/community/jobs/applications" className="btn-secondary py-2.5">
                    Applied
                  </Link>
                ) : (
                  <Link href={`/community/jobs/${j.id}/apply`} className="btn-primary py-2.5">
                    <Send className="h-4 w-4" /> Apply now
                  </Link>
                )}
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-secondary">{j.description}</p>
              <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-subtle">Compensation</p>
                  <b className="text-primary">{j.compensation}</b>
                </div>
                <div>
                  <p className="text-subtle">Experience</p>
                  <b className="text-primary">{j.experience_required}</b>
                </div>
                <div>
                  <p className="text-subtle">Workplace</p>
                  <b className="capitalize text-primary">{humanize(j.workplace_type)}</b>
                </div>
              </div>
              {j.skills_required && j.skills_required.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {j.skills_required.slice(0, 8).map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-secondary">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Posted by a verified employer on CalibiAI
                </span>
                <Link href={`/community/jobs/${j.id}`} className="font-bold text-brand-600 hover:underline">
                  View full JD →
                </Link>
              </div>
            </article>
          );
        })}
      </section>

      <section id="freelance" className="mt-16">
        <h2 className="heading-2 text-primary">Freelance gigs</h2>
        <p className="mt-2 text-secondary">Make an offer on work that fits your skills.</p>

        {gigs.length === 0 && !setupIssue && (
          <div className="mt-6 card text-center">
            <p className="text-sm text-secondary">No freelance gigs posted yet. Employers can post gigs from their dashboard.</p>
          </div>
        )}

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {gigs.map((g) => {
            const already = appliedIds.has(g.id);
            return (
              <article className="card flex flex-col" key={g.id}>
                <h3 className="text-lg font-bold text-primary">{g.title}</h3>
                <p className="mt-1 text-sm text-secondary">{g.company_name}</p>
                <p className="mt-4 line-clamp-3 text-sm text-secondary">{g.description}</p>
                <p className="mt-5 text-sm">
                  <span className="text-subtle">Budget</span>
                  <br />
                  <b className="inline-flex items-center gap-1 text-primary">
                    <Wallet className="h-4 w-4" /> {g.compensation}
                  </b>
                </p>
                {g.skills_required && g.skills_required.length > 0 && (
                  <p className="mt-3 text-sm text-secondary">{g.skills_required.slice(0, 4).join(" · ")}</p>
                )}
                <div className="mt-auto pt-5">
                  {already ? (
                    <Link href="/community/jobs/applications" className="btn-outline w-full py-2.5 text-center">
                      Offer sent
                    </Link>
                  ) : (
                    <Link
                      href={`/community/jobs/${g.id}/apply`}
                      className="btn-outline flex w-full items-center justify-center py-2.5"
                    >
                      Make an offer
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
