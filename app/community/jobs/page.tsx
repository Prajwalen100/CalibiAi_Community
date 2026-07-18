import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const jobTypeColors: Record<string, string> = {
  internship: "bg-blue-50 text-blue-700",
  full_time: "bg-green-50 text-green-700",
  freelance: "bg-purple-50 text-purple-700",
  campus_ambassador: "bg-amber-50 text-amber-700",
};

type JobRow = { id: string; title: string; content: string; job_type: string | null; job_company: string | null; job_location: string | null; created_at: string; profiles: { full_name: string | null; username: string | null } | null };

export default async function JobsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let jobs: JobRow[] = [];

  try {
    const { data } = await supabase
      .from("comm_posts")
      .select("id, title, content, job_type, job_company, job_location, created_at, profiles(full_name, username)")
      .eq("post_type", "job")
      .order("created_at", { ascending: false })
      .limit(30);
    jobs = (data ?? []) as unknown as JobRow[];
  } catch { /* table might not exist */ }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">💼 Jobs & Internships</h1>
          <p className="mt-2 text-slate-600">Internships, freelance gigs, full-time roles, and campus ambassador opportunities.</p>
        </div>
        {user && <Link href="/community/create?type=job" className="btn-primary">Post a Job</Link>}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {Object.entries(jobTypeColors).map(([type, color]) => {
          const count = jobs.filter((j) => j.job_type === type).length;
          return (
            <div key={type} className="card text-center">
              <p className="text-xl font-black">{count}</p>
              <p className={`text-xs font-semibold capitalize ${color.split(" ")[1]}`}>{type.replace("_", " ")}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 space-y-4">
        {jobs.length > 0 ? jobs.map((j) => {
          const color = jobTypeColors[j.job_type ?? ""] ?? "bg-slate-50 text-slate-700";
          return (
            <Link key={j.id} href={`/community/post/${j.id}`} className="card block hover:border-brand-500 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${color}`}>{(j.job_type ?? "job").replace("_", " ")}</span>
                  </div>
                  <h3 className="mt-2 font-bold">{j.title}</h3>
                  <p className="mt-1 text-sm text-slate-600 line-clamp-2">{j.content}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                {j.job_company && <span>🏢 {j.job_company}</span>}
                {j.job_location && <span>📍 {j.job_location}</span>}
                <span>by {j.profiles?.full_name ?? "Anonymous"}</span>
              </div>
            </Link>
          );
        }) : (
          <div className="card text-center">
            <p className="text-4xl">💼</p>
            <h3 className="mt-4 font-bold">No jobs posted yet</h3>
            <p className="mt-2 text-sm text-slate-600">Be the first to share an opportunity!</p>
          </div>
        )}
      </div>
    </div>
  );
}
