import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type MentorProfile = { user_id: string; full_name: string | null; username: string | null; target_role: string | null; bio: string | null; github_url: string | null; linkedin_url: string | null };
type MentorPost = { id: string; title: string; content: string; created_at: string; user_id: string; profiles: { full_name: string | null; username: string | null } | null };

export default async function MentorsPage() {
  const supabase = await createServerSupabaseClient();

  let mentors: MentorProfile[] = [];
  let mentorPosts: MentorPost[] = [];

  try {
    const [profilesResult, postsResult] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, username, target_role, bio, github_url, linkedin_url").in("role", ["author", "admin"]).limit(20),
      supabase.from("comm_posts").select("id, title, content, created_at, user_id, profiles(full_name, username)").order("created_at", { ascending: false }).limit(10),
    ]);
    mentors = (profilesResult.data ?? []) as unknown as MentorProfile[];
    mentorPosts = (postsResult.data ?? []) as unknown as MentorPost[];
  } catch { /* tables might not exist */ }

  return (
    <div>
      <h1 className="text-2xl font-black">🎓 Mentor Corner</h1>
      <p className="mt-2 text-slate-600">Learn from experienced mentors. Office hours, resources, Q&A, and live sessions.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4 text-center">
          <p className="text-2xl">🕐</p>
          <p className="mt-2 font-bold text-sm">Office Hours</p>
        </div>
        <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4 text-center">
          <p className="text-2xl">📚</p>
          <p className="mt-2 font-bold text-sm">Learning Resources</p>
        </div>
        <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-center">
          <p className="text-2xl">🎙️</p>
          <p className="mt-2 font-bold text-sm">Live Sessions</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-bold text-lg">Our Mentors</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {mentors.length > 0 ? mentors.map((m) => (
            <div key={m.user_id} className="card">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-lg font-bold text-brand-700">
                  {m.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <Link href={`/community/members/${m.username ?? m.user_id}`} className="font-bold hover:text-brand-700">{m.full_name ?? "Anonymous"}</Link>
                  <p className="text-sm text-slate-600">{m.target_role ?? ""}</p>
                </div>
              </div>
              {m.bio && <p className="mt-2 text-sm text-slate-600 line-clamp-2">{m.bio}</p>}
              <div className="mt-3 flex gap-3">
                {m.github_url && <a href={m.github_url} target="_blank" className="text-xs font-semibold text-brand-700 hover:underline">GitHub</a>}
                {m.linkedin_url && <a href={m.linkedin_url} target="_blank" className="text-xs font-semibold text-brand-700 hover:underline">LinkedIn</a>}
              </div>
            </div>
          )) : (
            <p className="text-sm text-slate-500 col-span-2">Mentors will appear here once they join the platform.</p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-bold text-lg">Recent Activity</h2>
        <div className="mt-4 space-y-3">
          {mentorPosts.length > 0 ? mentorPosts.map((p) => (
            <Link key={p.id} href={`/community/post/${p.id}`} className="block rounded-xl border border-slate-100 p-4 hover:bg-slate-50">
              <p className="font-semibold">{p.title}</p>
              <p className="mt-1 text-sm text-slate-600 line-clamp-1">{p.content}</p>
              <p className="mt-1 text-xs text-slate-400">by {p.profiles?.full_name ?? "Anonymous"}</p>
            </Link>
          )) : (
            <p className="text-sm text-slate-500">No activity yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
