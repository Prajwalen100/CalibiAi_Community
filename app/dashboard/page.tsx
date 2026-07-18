import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { GeneratedRoadmap } from "@/lib/ai/schemas";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { submitted } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const [{ data: profile }, { data: score }, { data: roadmap }, { data: projects }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    supabase.from("scores").select("*").eq("user_id", user.id).single(),
    supabase.from("roadmaps").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single(),
    supabase.from("projects").select("id,title,ai_score,verified,complexity_tier,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);
  if (!profile?.target_role) redirect("/onboarding");
  const plan = roadmap?.generated_plan as GeneratedRoadmap | undefined;
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-semibold text-brand-700">Dashboard</p>
          <h1 className="mt-2 text-3xl font-black">What to do next</h1>
        </div>
        {profile.username ? (
          <Link href={`/p/${profile.username}`} className="btn-secondary">View public profile</Link>
        ) : null}
      </div>

      {submitted === "1" && (
        <div className="mt-6 rounded-2xl border border-signal/30 bg-green-50 p-4 text-sm text-green-800">
          <p className="font-semibold">Project submitted successfully!</p>
          <p className="mt-1">Amazon Bedrock has reviewed your project. Your updated score is reflected below.</p>
        </div>
      )}

      <div className="mt-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-5">
          {/* Score card */}
          <div className="card">
            <p className="text-sm font-semibold text-slate-500">CalibiAI Score</p>
            <p className="mt-3 text-6xl font-black">{score?.total ?? 0}</p>
            <p className="mt-2 inline-flex rounded-full bg-brand-50 px-3 py-1 text-sm font-bold capitalize text-brand-700">{score?.tier ?? "bronze"}</p>
            <p className="mt-4 text-sm text-slate-600">Only verified projects, verified skills and current activity contribute to this score.</p>
          </div>

          {/* Submitted projects */}
          <div className="card">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">Your Projects</p>
              <Link href="/dashboard/submit" className="text-sm font-semibold text-brand-700 hover:text-brand-600">+ Submit new</Link>
            </div>
            <div className="mt-4 grid gap-3">
              {projects?.length ? projects.map((project) => (
                <div key={project.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{project.title}</p>
                    {project.verified && (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">Verified</span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-sm">
                    <span className="font-medium text-brand-700">AI Score: {project.ai_score ?? "—"}</span>
                    <span className="capitalize text-slate-500">{typeof project.complexity_tier === "number" ? ["beginner", "beginner", "intermediate", "advanced", "advanced"][project.complexity_tier - 1] ?? "beginner" : String(project.complexity_tier ?? "beginner")}</span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-600">No projects yet. Submit one from the action cards below!</p>
              )}
            </div>
          </div>
        </div>

        {/* Action cards */}
        <div className="card">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">Recommended next action</p>
            <Link href="/dashboard/submit" className="text-sm font-semibold text-brand-700 hover:text-brand-600">Submit a project</Link>
          </div>
          <h2 className="mt-2 text-2xl font-black">{plan?.next_action ?? "Start your first verified build task."}</h2>
          <div className="mt-6 grid gap-3">
            {plan?.modules?.map((module, index) => (
              <Link
                key={module.id}
                href={`/dashboard/submit?module_id=${encodeURIComponent(module.id)}&module_title=${encodeURIComponent(module.title)}&build_task=${encodeURIComponent(module.build_task)}`}
                className="group rounded-2xl border border-slate-100 p-4 transition-all hover:border-brand-500 hover:bg-brand-50/50 hover:shadow-sm"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-brand-700">
                  Module {index + 1} · {module.verification_artifact.replaceAll("_", " ")}
                </p>
                <h3 className="mt-1 font-bold group-hover:text-brand-700">{module.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{module.build_task}</p>
                <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                  Submit project →
                </p>
              </Link>
            )) ?? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
                <p className="text-slate-500">No roadmap modules yet. Complete onboarding to get your personalized plan.</p>
                <Link href="/onboarding" className="btn-primary mt-4 inline-block">Set up roadmap</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
