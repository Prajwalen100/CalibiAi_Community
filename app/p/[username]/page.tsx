import type { CSSProperties } from "react";
import Link from "next/link";
import {
  Award,
  BrainCircuit,
  CheckCircle2,
  Code2,
  ExternalLink,
  Github,
  Radar,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import { notFound } from "next/navigation";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { ProjectCard, type ProjectDetail } from "@/components/project-detail-modal";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { recalculateAndPersistScore } from "@/lib/score/recalculate";
import { WhyScoreButton } from "@/components/profile/why-score-button";

const PROFILE_MAX_SCORE = 1000;

const skillStyles = [
  "border-sky-300/50 bg-sky-400/10 text-sky-700 dark:border-sky-300/20 dark:bg-sky-300/10 dark:text-sky-200",
  "border-violet-300/50 bg-violet-400/10 text-violet-700 dark:border-violet-300/20 dark:bg-violet-300/10 dark:text-violet-200",
  "border-emerald-300/50 bg-emerald-400/10 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200",
  "border-amber-300/50 bg-amber-400/10 text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200",
  "border-fuchsia-300/50 bg-fuchsia-400/10 text-fuchsia-700 dark:border-fuchsia-300/20 dark:bg-fuchsia-300/10 dark:text-fuchsia-200",
];

type ProfileRow = {
  user_id: string;
  username: string | null;
  full_name: string | null;
  college: string | null;
  target_role: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  bio: string | null;
  avatar_id?: number | null;
  avatar_url?: string | null;
};

type VerifiedSkillRow = { skills: { name: string; category: string } | null };
type LabProjectRow = {
  id: string;
  role: string;
  level: string;
  day: number;
  task_description: string;
  submission_language: string;
  submission: string;
  explanation: string;
  score: number;
  points_awarded: number;
  feedback: string;
  strengths: string[];
  ai_enriched: boolean;
  created_at: string;
};

export const dynamic = "force-dynamic";

type Params = Promise<{ username: string }>;

function normalizeTier(tier?: string | null) {
  return String(tier ?? "bronze").replace(/[_-]/g, " ");
}

function getTierClasses(tier?: string | null) {
  const normalized = normalizeTier(tier).toLowerCase();
  if (normalized.includes("gold")) {
    return "from-amber-200 via-yellow-400 to-amber-600 text-amber-950 shadow-amber-500/25";
  }
  if (normalized.includes("silver")) {
    return "from-slate-100 via-slate-300 to-slate-500 text-slate-950 shadow-slate-400/25";
  }
  if (normalized.includes("platinum") || normalized.includes("diamond")) {
    return "from-cyan-100 via-blue-200 to-indigo-400 text-slate-950 shadow-cyan-400/25";
  }
  return "from-orange-200 via-amber-500 to-orange-700 text-orange-950 shadow-orange-500/25";
}

function profileSelect(includeAvatar = true) {
  return includeAvatar
    ? "user_id, username, full_name, college, target_role, github_url, linkedin_url, portfolio_url, bio, avatar_id, avatar_url"
    : "user_id, username, full_name, college, target_role, github_url, linkedin_url, portfolio_url, bio";
}

async function getProfile(username: string): Promise<ProfileRow | null> {
  const supabase = createAdminSupabaseClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(username);
  
  let query = supabase
    .from("profiles")
    .select(profileSelect(true));
    
  if (isUuid) {
    query = query.eq("user_id", username);
  } else {
    query = query.eq("username", username.toLowerCase());
  }
  
  const response = await query.single();

  if (response.data) return response.data as unknown as ProfileRow;

  // Older databases may not have avatar_url yet (migration 019). Retry with
  // just avatar_id, then with neither, so public profiles stay available.
  if (response.error && /avatar_(id|url)/i.test(response.error.message)) {
    let midQuery = supabase
      .from("profiles")
      .select("user_id, username, full_name, college, target_role, github_url, linkedin_url, portfolio_url, bio, avatar_id");
    if (isUuid) {
      midQuery = midQuery.eq("user_id", username);
    } else {
      midQuery = midQuery.eq("username", username.toLowerCase());
    }
    const mid = await midQuery.single();
    if (mid.data) return mid.data as unknown as ProfileRow;

    if (mid.error && /avatar_id/i.test(mid.error.message)) {
      let fallbackQuery = supabase
        .from("profiles")
        .select(profileSelect(false));

      if (isUuid) {
        fallbackQuery = fallbackQuery.eq("user_id", username);
      } else {
        fallbackQuery = fallbackQuery.eq("username", username.toLowerCase());
      }

      const fallback = await fallbackQuery.single();
      return (fallback.data as ProfileRow | null) ?? null;
    }
  }

  return null;
}

function getScoreAgeMs(lastCalculatedAt?: string | null): number {
  if (!lastCalculatedAt) return Infinity;
  return Date.now() - new Date(lastCalculatedAt).getTime();
}

export default async function ProfilePage({ params }: { params: Params }) {
  const { username } = await params;
  const supabase = createAdminSupabaseClient();
  const profile = await getProfile(username);

  if (!profile) notFound();

  const [{ data: scoreRow }, { data: projects }, { data: skills }, { data: labProjectRows }] = await Promise.all([
    supabase
      .from("scores")
      .select("total,tier,projects_pts,skills_pts,community_pts,completion_pts,recognition_pts,reading_pts,quizzes_pts,last_calculated_at")
      .eq("user_id", profile.user_id)
      .maybeSingle(),
    supabase
      .from("projects")
      .select("id,title,description,repo_url,live_url,complexity_tier,verified,points_awarded,ai_score,created_at,how_it_works,tech_stack,ai_feedback,ai_strengths,ai_improvements")
      .eq("user_id", profile.user_id)
      .eq("verified", true),
    supabase
      .from("user_skills")
      .select("verified_at, skills(name, category)")
      .eq("user_id", profile.user_id)
      .eq("verified", true),
    supabase
      .from("roadmap_task_assessments")
      .select("id,role,level,day,task_description,submission_language,submission,explanation,score,points_awarded,feedback,strengths,ai_enriched,created_at")
      .eq("user_id", profile.user_id)
      .eq("task_type", "mini_project")
      .eq("passed", true)
      .order("score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  // Self-healing recompute-on-read: if the stored score has never been
  // calculated, or is more than 5 minutes stale, recompute it from live
  // data (verified projects/skills, roadmap completion, community XP) so a
  // visited profile never shows a number that silently drifted out of date.
  const scoreAgeMs = getScoreAgeMs(scoreRow?.last_calculated_at);
  const score = scoreAgeMs > 5 * 60 * 1000
    ? (await recalculateAndPersistScore(profile.user_id)) ?? scoreRow
    : scoreRow;

  const totalScore = Math.max(0, Math.min(PROFILE_MAX_SCORE, Number(score?.total ?? 0)));
  const scorePercent = Math.round((totalScore / PROFILE_MAX_SCORE) * 100);
  const tier = normalizeTier(score?.tier);
  const verifiedSkills = (skills ?? []) as unknown as VerifiedSkillRow[];
  const scoreBreakdown = {
    projects: Number(score?.projects_pts ?? 0),
    skills: Number(score?.skills_pts ?? 0),
    community: Number(score?.community_pts ?? 0),
    completion: Number(score?.completion_pts ?? 0),
    recognition: Number(score?.recognition_pts ?? 0),
    reading: Number(score?.reading_pts ?? 0),
    quizzes: Number(score?.quizzes_pts ?? 0),
  };

  // Keep only the best passed submission for each role/level/day. Failed work
  // remains private; a better retry replaces the version shown publicly.
  const labProjectsByTask = new Map<string, LabProjectRow>();
  for (const row of (labProjectRows ?? []) as LabProjectRow[]) {
    const key = `${row.role}:${row.level}:${row.day}`;
    const existing = labProjectsByTask.get(key);
    if (!existing || row.score > existing.score) labProjectsByTask.set(key, row);
  }
  const labProjects = [...labProjectsByTask.values()].sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  );

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 font-sans sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-slate-950 p-6 pb-24 text-white shadow-2xl shadow-slate-900/10 dark:border-white/10 dark:shadow-black/40 sm:p-8 sm:pb-14 sm:pl-44">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(59,130,246,0.35),transparent_34%),radial-gradient(circle_at_85%_0%,rgba(168,85,247,0.25),transparent_34%),linear-gradient(135deg,#020617_0%,#0f172a_48%,#111827_100%)]" />
        <div className="noise-overlay !absolute !z-0 opacity-[0.08]" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="absolute bottom-0 left-6 z-10 translate-y-1/2 sm:bottom-1/2 sm:left-8 sm:translate-y-1/2">
          <ProfileAvatar
            avatarId={profile.avatar_id ?? null}
            avatarUrl={profile.avatar_url ?? null}
            size={120}
            className="border-4 border-[#eef4ff] shadow-[0_0_0_8px_rgba(255,255,255,0.08),0_24px_60px_rgba(59,130,246,0.35)] dark:border-slate-950"
          />
        </div>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3">
            <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.24em] text-cyan-100/80">
              <ShieldCheck className="h-4 w-4 text-cyan-300" />
              Verified AI Profile
            </p>
            <span className={`profile-metal-badge inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-br px-3 py-1 text-xs font-black capitalize shadow-lg ${getTierClasses(score?.tier)}`}>
              <Award className="h-3.5 w-3.5" />
              {tier}
            </span>
          </div>

          <h1 className="mt-5 max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
            {profile.full_name ?? profile.username ?? "CalibiAI Builder"}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 font-mono text-cyan-100 backdrop-blur-md">
              @{profile.username ?? username}
            </span>
            {profile.target_role && (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-white/70 backdrop-blur-md">
                {profile.target_role}
              </span>
            )}
            {profile.college && <span className="text-white/50">· {profile.college}</span>}
          </div>

          {profile.bio && <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-300">{profile.bio}</p>}

          <div className="mt-6 max-w-2xl">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/45">
                Talent score
                <WhyScoreButton breakdown={scoreBreakdown} total={totalScore} tier={tier} />
              </span>
              <span className="font-mono text-sm font-black text-cyan-100">
                {totalScore}/{PROFILE_MAX_SCORE}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-white/10 shadow-inner shadow-black/20">
              <div
                className="profile-score-fill h-full rounded-full bg-gradient-to-r from-cyan-300 via-brand-400 to-violet-400 shadow-[0_0_24px_rgba(59,156,255,0.65)]"
                style={{ "--score-width": `${scorePercent}%` } as CSSProperties}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {profile.github_url && (
              <Link href={profile.github_url} target="_blank" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-white/80 backdrop-blur-md transition hover:bg-white/15 hover:text-white">
                <Github className="h-3.5 w-3.5" /> GitHub
              </Link>
            )}
            {profile.linkedin_url && (
              <Link href={profile.linkedin_url} target="_blank" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-white/80 backdrop-blur-md transition hover:bg-white/15 hover:text-white">
                LinkedIn <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
            {profile.portfolio_url && (
              <Link href={profile.portfolio_url} target="_blank" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-white/80 backdrop-blur-md transition hover:bg-white/15 hover:text-white">
                Portfolio <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mt-20 grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="rounded-3xl border border-slate-200/70 bg-white/75 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.05] dark:shadow-black/20 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-600 dark:text-brand-300">Portfolio proof</p>
              <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">Verified projects</h2>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-xs font-black text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
              {projects?.length ?? 0} live
            </span>
          </div>

          <div className="mt-5 grid gap-4">
            {projects?.length ? projects.map((project) => (
              <ProjectCard key={project.id ?? project.title} variant="profile" project={project as ProjectDetail} />
            )) : (
              <div className="rounded-2xl border border-dashed border-slate-300/70 p-8 text-center dark:border-white/10">
                <Sparkles className="mx-auto h-9 w-9 text-slate-300 dark:text-slate-600" />
                <p className="mt-3 font-bold text-slate-900 dark:text-white">No verified projects yet</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Verified portfolio work will appear here once approved.</p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-white/75 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.05] dark:shadow-black/20 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">Skill graph</p>
              <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">Verified skills</h2>
            </div>
            <Radar className="h-5 w-5 text-violet-500" />
          </div>

          {verifiedSkills.length ? (
            <div className="mt-5 flex flex-wrap gap-2.5">
              {verifiedSkills.map((row, index) => (
                <span key={`${row.skills?.name}-${index}`} className={`rounded-full border px-3 py-1.5 font-mono text-xs font-black shadow-sm backdrop-blur-xl ${skillStyles[index % skillStyles.length]}`}>
                  {row.skills?.name ?? "Verified skill"}
                </span>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300/70 bg-slate-50/50 p-8 text-center dark:border-white/10 dark:bg-white/[0.03]">
              <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.16),transparent_68%)]">
                <svg viewBox="0 0 160 160" className="h-36 w-36 text-slate-300 dark:text-slate-600" aria-hidden="true">
                  <g fill="none" stroke="currentColor" strokeWidth="1">
                    <polygon points="80,18 138,56 124,126 36,126 22,56" opacity="0.35" />
                    <polygon points="80,42 114,64 106,106 54,106 46,64" opacity="0.55" />
                    <line x1="80" y1="18" x2="80" y2="126" opacity="0.35" />
                    <line x1="22" y1="56" x2="124" y2="126" opacity="0.35" />
                    <line x1="138" y1="56" x2="36" y2="126" opacity="0.35" />
                  </g>
                  <polygon points="80,50 104,67 98,98 64,106 50,70" fill="currentColor" opacity="0.14" />
                  <circle cx="80" cy="50" r="4" fill="currentColor" opacity="0.55" />
                  <circle cx="104" cy="67" r="4" fill="currentColor" opacity="0.45" />
                  <circle cx="98" cy="98" r="4" fill="currentColor" opacity="0.38" />
                  <circle cx="64" cy="106" r="4" fill="currentColor" opacity="0.32" />
                  <circle cx="50" cy="70" r="4" fill="currentColor" opacity="0.42" />
                </svg>
              </div>
              <p className="font-bold text-slate-900 dark:text-white">No verified skills yet</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">A radar of proven skills will form as assessments verify this profile.</p>
            </div>
          )}
        </section>
      </div>

      <section className="mt-5 rounded-3xl border border-slate-200/70 bg-white/75 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.05] dark:shadow-black/20 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-black text-violet-700 dark:text-violet-300">
              <BrainCircuit className="h-4 w-4" /> AI-reviewed roadmap work
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">Mini Project Submissions</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Best passed AI Lab submission for each roadmap mini project. Failed attempts remain private.
            </p>
          </div>
          <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 font-mono text-sm font-black text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200">
            {labProjects.length} verified
          </span>
        </div>

        <div className="mt-5 grid gap-4">
          {labProjects.length > 0 ? labProjects.map((project) => (
            <article key={project.id} className="rounded-2xl border border-violet-200/70 bg-white/60 p-5 backdrop-blur-xl dark:border-violet-300/15 dark:bg-white/[0.035]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                    <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 font-mono capitalize text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200">
                      Day {project.day} · {project.level}
                    </span>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                      <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" /> Passed
                    </span>
                    <span className="font-mono uppercase text-slate-500 dark:text-slate-400">{project.submission_language}</span>
                  </div>
                  <h3 className="mt-3 font-bold leading-6 text-slate-950 dark:text-white">{project.task_description}</h3>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-white shadow-lg dark:bg-white/10">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <span className="font-mono font-black">{project.score}/100</span>
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{project.feedback}</p>

              {Array.isArray(project.strengths) && project.strengths.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {project.strengths.slice(0, 3).map((strength) => (
                    <span key={strength} className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
                      {strength}
                    </span>
                  ))}
                </div>
              )}

              <details className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
                <summary className="flex cursor-pointer list-none items-center gap-2 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 dark:bg-white/[0.04] dark:text-slate-200">
                  <Code2 className="h-4 w-4" /> View submitted solution
                </summary>
                <pre className="max-h-96 overflow-auto whitespace-pre-wrap bg-slate-950 p-4 font-mono text-xs leading-6 text-sky-100">{project.submission}</pre>
                {project.explanation && (
                  <div className="border-t border-slate-200 p-4 text-sm dark:border-white/10">
                    <p className="font-bold text-slate-950 dark:text-white">Approach and validation</p>
                    <p className="mt-2 whitespace-pre-wrap leading-6 text-slate-600 dark:text-slate-300">{project.explanation}</p>
                  </div>
                )}
              </details>

              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                {project.ai_enriched ? "Evaluated by the CalibiAI AI rubric" : "Evaluated by the deterministic fallback rubric"}
                {project.points_awarded > 0 ? ` · +${project.points_awarded} points on this attempt` : ""}
              </p>
            </article>
          )) : (
            <div className="rounded-[1.75rem] border border-dashed border-slate-300/70 bg-gradient-to-br from-white/70 to-slate-50/50 p-10 text-center dark:border-white/10 dark:from-white/[0.05] dark:to-white/[0.02] sm:p-14">
              <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-violet-400/20 via-cyan-400/10 to-brand-400/20 blur-2xl" />
                <div className="relative flex h-24 w-24 rotate-[-8deg] items-center justify-center rounded-[1.75rem] border border-white/70 bg-white/50 shadow-2xl shadow-violet-500/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
                  <BrainCircuit className="h-12 w-12 text-violet-400/70" />
                </div>
              </div>
              <p className="mt-6 text-lg font-black text-slate-950 dark:text-white">No passed mini projects yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">Passed AI Lab mini projects will appear here automatically as polished, employer-ready proof of work.</p>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
