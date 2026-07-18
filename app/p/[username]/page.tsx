import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type VerifiedSkillRow = { skills: { name: string; category: string } | null };

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const supabase = createAdminSupabaseClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, username, full_name, college, target_role, github_url, linkedin_url, portfolio_url, bio")
    .eq("username", params.username)
    .single();

  if (!profile) notFound();

  const [{ data: score }, { data: projects }, { data: skills }] = await Promise.all([
    supabase.from("scores").select("total,tier,last_calculated_at").eq("user_id", profile.user_id).single(),
    supabase
      .from("projects")
      .select("title,description,repo_url,live_url,complexity_tier,verified,points_awarded")
      .eq("user_id", profile.user_id)
      .eq("verified", true),
    supabase
      .from("user_skills")
      .select("verified_at, skills(name, category)")
      .eq("user_id", profile.user_id)
      .eq("verified", true)
  ]);

  const verifiedSkills = (skills ?? []) as unknown as VerifiedSkillRow[];

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-ink p-8 text-white">
        <p className="text-sm font-semibold text-brand-100">Verified AI Profile</p>
        <h1 className="mt-2 text-4xl font-black">{profile.full_name}</h1>
        <p className="mt-2 text-slate-300">{profile.target_role} {profile.college ? `· ${profile.college}` : ""}</p>
        <div className="mt-6 flex gap-3">
          <span className="rounded-full bg-white px-4 py-2 font-black text-ink">{score?.total ?? 0}/1000</span>
          <span className="rounded-full bg-signal px-4 py-2 font-bold capitalize text-ink">{score?.tier ?? "bronze"}</span>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="card">
          <h2 className="font-bold">Verified projects</h2>
          <div className="mt-4 grid gap-3">
            {projects?.length ? projects.map((project) => (
              <div key={project.title} className="rounded-2xl border border-slate-100 p-4">
                <p className="font-semibold">{project.title}</p>
                <p className="mt-1 text-sm text-slate-600">{project.description}</p>
                <div className="mt-2 flex gap-3 text-sm font-semibold text-brand-700">
                  {project.repo_url ? <a href={project.repo_url}>GitHub</a> : null}
                  {project.live_url ? <a href={project.live_url}>Live</a> : null}
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
    </section>
  );
}
