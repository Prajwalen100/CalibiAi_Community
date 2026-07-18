import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/community/post-card";
import { mapPostToCardData } from "@/lib/community/mappers";

export const dynamic = "force-dynamic";

export default async function ChallengesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let active: Array<Record<string, unknown>> = [];
  let past: Array<Record<string, unknown>> = [];
  let topEntries: Array<Record<string, unknown>> = [];

  try {
    const { data } = await supabase
      .from("comm_posts")
      .select(`id, title, content, post_type, upvotes, downvotes, comment_count, save_count,
        is_pinned, is_featured, is_solved, created_at, user_id, challenge_deadline,
        comm_communities(slug, name, emoji), profiles(full_name, username)`)
      .eq("post_type", "challenge")
      .order("created_at", { ascending: false });
    const all = (data ?? []) as Array<Record<string, unknown>>;
    const now = new Date();
    active = all.filter((c) => !c.challenge_deadline || new Date(String(c.challenge_deadline)) > now);
    past = all.filter((c) => c.challenge_deadline && new Date(String(c.challenge_deadline)) <= now);

    const entriesResult = await supabase.from("comm_challenge_entries").select("*, profiles(full_name, username)").order("ai_score", { ascending: false }).limit(10);
    topEntries = (entriesResult.data ?? []) as Array<Record<string, unknown>>;
  } catch { /* table might not exist */ }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">🏆 AI Challenges</h1>
          <p className="mt-2 text-slate-600">Weekly challenges to build your skills. Submit entries, climb the leaderboard, earn XP.</p>
        </div>
        {user && <Link href="/community/create?type=challenge" className="btn-primary">Launch a Challenge</Link>}
      </div>

      {active.length > 0 && (
        <div className="mt-8">
          <h2 className="font-bold text-lg">🔥 Active Challenges</h2>
          <div className="mt-4 space-y-4">
            {active.map((c) => <PostCard key={String(c.id)} {...mapPostToCardData(c, { currentUserId: user?.id })} />)}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div className="mt-8">
          <h2 className="font-bold text-lg">📜 Past Challenges</h2>
          <div className="mt-4 space-y-4">
            {past.map((c) => <PostCard key={String(c.id)} {...mapPostToCardData(c, { currentUserId: user?.id })} />)}
          </div>
        </div>
      )}

      {active.length === 0 && past.length === 0 && (
        <div className="mt-8 card text-center">
          <p className="text-4xl">🏆</p>
          <h3 className="mt-4 font-bold">No challenges yet</h3>
          <p className="mt-2 text-sm text-slate-600">Launch the first AI challenge for the community!</p>
        </div>
      )}

      {/* Challenge Leaderboard */}
      {topEntries.length > 0 && (
        <div className="mt-8">
          <h2 className="font-bold text-lg">🏅 Challenge Leaderboard</h2>
          <div className="mt-4 space-y-2">
            {topEntries.map((e, i) => {
              const ep = e.profiles as Record<string, string> | null;
              return (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${i === 0 ? "bg-amber-50 text-amber-700" : i === 1 ? "bg-slate-100 text-slate-700" : i === 2 ? "bg-orange-50 text-orange-700" : "bg-slate-50 text-slate-500"}`}>
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-sm">{String(e.title ?? "")}</p>
                    <p className="text-xs text-slate-500">by {ep?.full_name ?? "Anonymous"}</p>
                  </div>
                  {e.ai_score != null && <span className="ml-auto text-sm font-bold text-brand-700">{Number(e.ai_score)} pts</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
