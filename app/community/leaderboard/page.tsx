import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { attachCommunityProfiles } from "@/lib/community/public-profiles";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const supabase = await createServerSupabaseClient();

  type XpRow = { user_id: string; xp: number; level: number; contribution_level: string; total_posts: number; total_comments: number; profiles: { full_name: string | null; username: string | null } | null };
  type ScoreRow = { user_id: string; total: number; tier: string; profiles: { full_name: string | null; username: string | null } | null };

  let topContributors: XpRow[] = [];
  let topScore: ScoreRow[] = [];

  try {
    const [xpResult, scoreResult] = await Promise.all([
      supabase.from("comm_xp").select("user_id, xp, level, contribution_level, total_posts, total_comments").order("xp", { ascending: false }).limit(25),
      supabase.from("scores").select("user_id, total, tier").order("total", { ascending: false }).limit(10),
    ]);
    topContributors = await attachCommunityProfiles(supabase, (xpResult.data ?? []) as Array<Record<string, unknown>>) as XpRow[];
    topScore = await attachCommunityProfiles(supabase, (scoreResult.data ?? []) as Array<Record<string, unknown>>) as ScoreRow[];
  } catch { /* tables might not exist */ }

  const contributionLevels: Record<string, { color: string; bg: string }> = {
    newcomer: { color: "text-slate-600", bg: "bg-slate-100" },
    contributor: { color: "text-brand-700", bg: "bg-brand-50" },
    expert: { color: "text-purple-700", bg: "bg-purple-50" },
    legend: { color: "text-amber-700", bg: "bg-amber-50" },
  };

  return (
    <div>
      <h1 className="text-2xl font-black">🏆 Leaderboard</h1>
      <p className="mt-2 text-slate-600">Top contributors, most helpful members, and best projects in the community.</p>

      <div className="mt-8">
        <h2 className="font-bold text-lg">🏆 Top Contributors</h2>
        <div className="mt-4 space-y-2">
          {topContributors.length > 0 ? topContributors.map((entry, i) => {
            const level = contributionLevels[entry.contribution_level ?? "newcomer"] ?? contributionLevels.newcomer;
            return (
              <div key={entry.user_id} className="flex items-center gap-4 rounded-xl border border-slate-100 p-4">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${i === 0 ? "bg-amber-50 text-amber-700" : i === 1 ? "bg-slate-100 text-slate-700" : i === 2 ? "bg-orange-50 text-orange-700" : "bg-slate-50 text-slate-500"}`}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <Link href={`/community/members/${entry.profiles?.username ?? ""}`} className="font-bold hover:text-brand-700">{entry.profiles?.full_name ?? "Anonymous"}</Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${level.bg} ${level.color}`}>{entry.contribution_level ?? "newcomer"}</span>
                    <span className="text-xs text-slate-500">Level {entry.level}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-700">{entry.xp} XP</p>
                  <p className="text-xs text-slate-500">{entry.total_posts} posts · {entry.total_comments} comments</p>
                </div>
              </div>
            );
          }) : (
            <p className="text-sm text-slate-500">No leaderboard data yet. Start posting and commenting to climb the ranks!</p>
          )}
        </div>
      </div>

      {topScore.length > 0 && (
        <div className="mt-8">
          <h2 className="font-bold text-lg">⭐ Highest Talent Score</h2>
          <div className="mt-4 space-y-2">
            {topScore.map((entry, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-slate-100 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">{i + 1}</span>
                <div className="flex-1">
                  <Link href={`/community/members/${entry.profiles?.username ?? ""}`} className="font-bold hover:text-brand-700">{entry.profiles?.full_name ?? "Anonymous"}</Link>
                </div>
                <div className="text-right">
                  <p className="font-bold text-ink">{entry.total}/1000</p>
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold capitalize text-brand-700">{entry.tier}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
