import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Mail,
  ShieldCheck,
  Trophy,
  FolderGit2,
  MapPin,
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CandidateActions } from "./candidate-actions";
import { OfferForm } from "./offer-form";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function CandidateApplicationPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/employer/signin?mode=sign-in");

  const { data: app, error } = await supabase
    .from("comm_job_applications")
    .select(
      "id, job_id, applicant_id, cover_letter, portfolio_url, resume_url, contact_email, status, created_at"
    )
    .eq("id", id)
    .single();

  if (error || !app) notFound();

  const { data: job } = await supabase
    .from("comm_jobs")
    .select("id, title, company_name, user_id")
    .eq("id", app.job_id)
    .single();

  if (!job || job.user_id !== user.id) notFound();

  const [{ data: profile }, { data: score }, { data: projects }, { data: skills }] =
    await Promise.all([
      supabase
        .from("comm_public_profiles")
        .select("user_id, full_name, username, target_role")
        .eq("user_id", app.applicant_id)
        .maybeSingle(),
      supabase.from("scores").select("*").eq("user_id", app.applicant_id).maybeSingle(),
      supabase
        .from("projects")
        .select("id, title, description, verified, complexity_tier, repo_url, live_url")
        .eq("user_id", app.applicant_id)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("user_skills")
        .select("verified, skills:skill_id(name, category)")
        .eq("user_id", app.applicant_id)
        .limit(20),
    ]);

  // Also try full profiles for extra fields if readable
  let location: string | null = null;
  let bio: string | null = null;
  let college: string | null = null;
  try {
    const { data: full } = await supabase
      .from("profiles")
      .select("location, bio, college, github_url, linkedin_url, portfolio_url")
      .eq("user_id", app.applicant_id)
      .maybeSingle();
    location = full?.location ?? null;
    bio = full?.bio ?? null;
    college = full?.college ?? null;
  } catch {
    /* RLS may block */
  }

  const skillRows = (skills ?? []).map((s) => {
    const sk = s.skills as unknown as { name?: string; category?: string } | null;
    return {
      name: sk?.name ?? "Skill",
      category: sk?.category ?? "",
      verified: !!s.verified,
    };
  });

  return (
    <div>
      <Link
        href="/employer/dashboard/applications"
        className="inline-flex items-center gap-2 text-sm font-medium text-secondary hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to inbox
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-6">
          <section className="card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-subtle">
                  Application for {job.title}
                </p>
                <h1 className="mt-1 text-2xl font-black text-primary">
                  {profile?.full_name || profile?.username || "Candidate"}
                </h1>
                <p className="mt-1 text-sm text-secondary">
                  {profile?.username ? `@${profile.username}` : ""}
                  {profile?.target_role ? ` · ${profile.target_role}` : ""}
                  {college ? ` · ${college}` : ""}
                </p>
                {location && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-subtle">
                    <MapPin className="h-3.5 w-3.5" /> {location}
                  </p>
                )}
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700 dark:bg-slate-800">
                {app.status.replace(/_/g, " ")}
              </span>
            </div>

            {bio && <p className="mt-4 text-sm text-secondary">{bio}</p>}

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-brand-50 p-4 dark:bg-brand-950/30">
                <p className="text-xs font-bold uppercase text-brand-700">CalibiAI score</p>
                <p className="mt-1 text-3xl font-black text-brand-900 dark:text-brand-100">
                  {score?.total ?? "—"}
                </p>
                <p className="text-xs capitalize text-brand-700">{score?.tier ?? "unscored"}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/20">
                <p className="text-xs font-bold uppercase text-emerald-700">Verified projects</p>
                <p className="mt-1 text-3xl font-black text-emerald-900 dark:text-emerald-100">
                  {(projects ?? []).filter((p) => p.verified).length}
                </p>
              </div>
              <div className="rounded-2xl bg-indigo-50 p-4 dark:bg-indigo-950/20">
                <p className="text-xs font-bold uppercase text-indigo-700">Skills listed</p>
                <p className="mt-1 text-3xl font-black text-indigo-900 dark:text-indigo-100">
                  {skillRows.length}
                </p>
              </div>
            </div>
          </section>

          <section className="card">
            <h2 className="text-lg font-bold text-primary">Cover letter</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-secondary">{app.cover_letter}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <a
                href={`mailto:${app.contact_email}?subject=${encodeURIComponent(`Re: ${job.title}`)}`}
                className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline"
              >
                <Mail className="h-4 w-4" /> {app.contact_email}
              </a>
              {app.portfolio_url && (
                <a
                  href={app.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-secondary hover:underline"
                >
                  Portfolio <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {app.resume_url && (
                <a
                  href={app.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-secondary hover:underline"
                >
                  Resume <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </section>

          <section className="card">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-primary">Verified skills &amp; capability</h2>
            </div>
            {skillRows.length === 0 ? (
              <p className="mt-3 text-sm text-secondary">No skills on file yet.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {skillRows.map((s) => (
                  <span
                    key={s.name + s.category}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      s.verified
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {s.verified ? "✓ " : ""}
                    {s.name}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <div className="flex items-center gap-2">
              <FolderGit2 className="h-5 w-5 text-brand-500" />
              <h2 className="text-lg font-bold text-primary">Projects &amp; assessment proof</h2>
            </div>
            <div className="mt-4 space-y-3">
              {(projects ?? []).length === 0 && (
                <p className="text-sm text-secondary">No projects submitted yet.</p>
              )}
              {(projects ?? []).map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-primary">{p.title}</p>
                    {p.verified && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                        Verified
                      </span>
                    )}
                  </div>
                  {p.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-secondary">{p.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
                    {p.repo_url && (
                      <a href={p.repo_url} target="_blank" rel="noopener noreferrer" className="text-brand-600">
                        Repo
                      </a>
                    )}
                    {p.live_url && (
                      <a href={p.live_url} target="_blank" rel="noopener noreferrer" className="text-brand-600">
                        Live
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {profile?.username && (
            <Link
              href={`/community/members/${profile.username}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:underline"
            >
              <Trophy className="h-4 w-4" /> Open full community profile
            </Link>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card">
            <h2 className="font-bold text-primary">Pipeline</h2>
            <p className="mt-1 text-xs text-secondary">Move this candidate through your hiring stages.</p>
            <div className="mt-4">
              <CandidateActions applicationId={app.id} currentStatus={app.status} />
            </div>
          </div>

          <div className="card">
            <h2 className="font-bold text-primary">Make an offer</h2>
            <p className="mt-1 text-xs text-secondary">
              Send a formal offer. The student is notified and can accept or decline.
            </p>
            <OfferForm applicationId={app.id} />
          </div>
        </aside>
      </div>
    </div>
  );
}
