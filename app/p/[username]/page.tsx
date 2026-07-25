import { BrainCircuit, CheckCircle2, Code2, Trophy } from "lucide-react";
import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

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

export default async function ProfilePage({ params }: { params: Params }) {
  const { username } = await params;
  const supabase = createAdminSupabaseClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, username, full_name, college, target_role, github_url, linkedin_url, portfolio_url, bio")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const [{ data: score }, { data: projects }, { data: skills }, { data: labProjectRows }] = await Promise.all([
    supabase.from("scores").select("total,tier,last_calculated_at").eq("user_id", profile.user_id).single(),
    supabase
      .from("projects")
      .select("title,description,repo_url,live_url,complexity_tier,verified,points_awarded,ai_score")
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

  const verifiedSkills = (skills ?? []) as unknown as VerifiedSkillRow[];
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
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-ink p-8 text-white">
        <p className="text-sm font-semibold text-brand-100">Verified AI Profile</p>
        <h1 className="mt-2 text-4xl font-black">{profile.full_name}</h1>
        <p className="mt-2 text-slate-300">{profile.target_role} {profile.college ? `· ${profile.college}` : ""}</p>
        <div className="mt-6 flex gap-3">
          <span className="rounded-full bg-white px-4 py-2 font-black text-ink dark:bg-white dark:text-slate-900">{score?.total ?? 0}/1000</span>
          <span className="rounded-full bg-signal px-4 py-2 font-bold capitalize text-ink">{score?.tier ?? "bronze"}</span>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="card">
          <h2 className="font-bold">Verified projects</h2>
          <div className="mt-4 grid gap-3">
            {projects?.length ? projects.map((project) => (
              <div key={project.title} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{project.title}</p>
                  {project.verified && <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">Verified</span>}
                </div>
                <p className="mt-1 text-sm text-slate-600">{project.description}</p>
                <div className="mt-2 flex items-center gap-3 text-sm font-semibold text-brand-700">
                  {project.repo_url ? <a href={project.repo_url}>GitHub</a> : null}
                  {project.live_url ? <a href={project.live_url}>Live</a> : null}
                  {project.ai_score != null && <span className="text-slate-500 font-medium">AI Score: {project.ai_score}/100</span>}
                </div>
              </div>
            )) : <p className="text-sm text-slate-600">No verified projects yet.</p>}
          </div>
        </div>

        <div className="card">
          <h2 className="font-bold">Verified skills</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {verifiedSkills.length ? verifiedSkills.map((row) => (
              <span key={row.skills?.name} className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
                {row.skills?.name}
              </span>
            )) : <p className="text-sm text-slate-600">No verified skills yet.</p>}
          </div>
        </div>
      </div>

      <div className="card mt-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-violet-700 dark:text-violet-300">
              <BrainCircuit className="h-4 w-4" /> AI-reviewed roadmap work
            </p>
            <h2 className="mt-1 text-xl font-black">Mini Project Submissions</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Best passed AI Lab submission for each roadmap mini project. Failed attempts remain private.
            </p>
          </div>
          <span className="rounded-full bg-violet-50 px-3 py-1 text-sm font-black text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
            {labProjects.length} verified
          </span>
        </div>

        <div className="mt-5 grid gap-4">
          {labProjects.length > 0 ? labProjects.map((project) => (
            <article key={project.id} className="rounded-2xl border border-violet-100 p-5 dark:border-violet-900/60">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 capitalize text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
                      Day {project.day} · {project.level}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                      <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" /> Passed
                    </span>
                    <span className="uppercase text-slate-500">{project.submission_language}</span>
                  </div>
                  <h3 className="mt-3 font-bold leading-6">{project.task_description}</h3>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-white">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <span className="font-black">{project.score}/100</span>
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{project.feedback}</p>

              {Array.isArray(project.strengths) && project.strengths.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {project.strengths.slice(0, 3).map((strength) => (
                    <span key={strength} className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
                      {strength}
                    </span>
                  ))}
                </div>
              )}

              <details className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <summary className="flex cursor-pointer list-none items-center gap-2 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  <Code2 className="h-4 w-4" /> View submitted solution
                </summary>
                <pre className="max-h-96 overflow-auto whitespace-pre-wrap bg-slate-950 p-4 font-mono text-xs leading-6 text-sky-100">{project.submission}</pre>
                {project.explanation && (
                  <div className="border-t border-slate-200 p-4 text-sm dark:border-slate-800">
                    <p className="font-bold">Approach and validation</p>
                    <p className="mt-2 whitespace-pre-wrap leading-6 text-slate-600 dark:text-slate-300">{project.explanation}</p>
                  </div>
                )}
              </details>

              <p className="mt-3 text-xs text-slate-500">
                {project.ai_enriched ? "Evaluated by the CalibiAI AI rubric" : "Evaluated by the deterministic fallback rubric"}
                {project.points_awarded > 0 ? ` · +${project.points_awarded} points on this attempt` : ""}
              </p>
            </article>
          )) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
              <BrainCircuit className="mx-auto h-9 w-9 text-slate-300" />
              <p className="mt-3 font-bold">No passed mini projects yet</p>
              <p className="mt-1 text-sm text-slate-500">Passed AI Lab mini projects will appear here automatically.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
