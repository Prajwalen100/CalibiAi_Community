import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { GeneratedRoadmap } from "@/lib/ai/schemas";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const [{ data: profile }, { data: score }, { data: roadmap }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    supabase.from("scores").select("*").eq("user_id", user.id).single(),
    supabase.from("roadmaps").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single()
  ]);
  if (!profile?.target_role) redirect("/onboarding");
  const plan = roadmap?.generated_plan as GeneratedRoadmap | undefined;
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="font-semibold text-brand-700">Dashboard</p><h1 className="mt-2 text-3xl font-black">What to do next</h1></div><Link href={`/p/${profile.username}`} className="btn-secondary">View public profile</Link></div>
      <div className="mt-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="card"><p className="text-sm font-semibold text-slate-500">CalibiAI Score</p><p className="mt-3 text-6xl font-black">{score?.total ?? 0}</p><p className="mt-2 inline-flex rounded-full bg-brand-50 px-3 py-1 text-sm font-bold capitalize text-brand-700">{score?.tier ?? "bronze"}</p><p className="mt-4 text-sm text-slate-600">Only verified projects, verified skills and current activity contribute to this score.</p></div>
        <div className="card"><p className="text-sm font-semibold text-slate-500">Recommended next action</p><h2 className="mt-2 text-2xl font-black">{plan?.next_action ?? "Start your first verified build task."}</h2><div className="mt-6 grid gap-3">{plan?.modules?.map((module, index) => <div key={module.id} className="rounded-2xl border border-slate-100 p-4"><p className="text-xs font-bold uppercase tracking-wide text-brand-700">Module {index + 1} · {module.verification_artifact.replaceAll("_", " ")}</p><h3 className="mt-1 font-bold">{module.title}</h3><p className="mt-1 text-sm text-slate-600">{module.build_task}</p></div>)}</div></div>
      </div>
    </section>
  );
}
