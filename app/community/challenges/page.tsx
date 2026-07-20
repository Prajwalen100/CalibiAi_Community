import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/community/post-card";
import { mapPostToCardData } from "@/lib/community/mappers";
import { attachCommunityProfiles } from "@/lib/community/public-profiles";
import { ScrollReveal, StaggerReveal, Floating, GlowOnHover } from "@/components/scroll-reveal";
import { Trophy, Target, Award, Crown } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ChallengesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let active: Array<Record<string, unknown>> = [];
  let past: Array<Record<string, unknown>> = [];
  let topEntries: Array<Record<string, unknown>> = [];

  const { data, error } = await supabase
    .from("comm_posts")
    .select(`id, title, content, post_type, upvotes, downvotes, comment_count, save_count,
      is_pinned, is_featured, is_solved, created_at, user_id, challenge_deadline,
      comm_communities(slug, name, emoji)`)
    .eq("post_type", "challenge")
    .order("created_at", { ascending: false });
  if (!error) {
    const all = await attachCommunityProfiles(supabase, (data ?? []) as Array<Record<string, unknown>>);
    const now = new Date();
    active = all.filter((challenge) => !challenge.challenge_deadline || new Date(String(challenge.challenge_deadline)) > now);
    past = all.filter((challenge) => challenge.challenge_deadline && new Date(String(challenge.challenge_deadline)) <= now);
  }

  const entriesResult = await supabase.from("comm_challenge_entries").select("*").order("ai_score", { ascending: false }).limit(10);
  if (!entriesResult.error) {
    topEntries = await attachCommunityProfiles(supabase, (entriesResult.data ?? []) as Array<Record<string, unknown>>);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <ScrollReveal direction="up" className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 mb-3">
            <Trophy className="h-3.5 w-3.5" />
            <span>Weekly Challenges</span>
          </div>
          <h1 className="text-2xl font-black text-primary">🏆 AI Challenges</h1>
          <p className="mt-2 text-secondary">Weekly challenges to build your skills. Submit entries, climb the leaderboard, earn XP.</p>
        </div>
        {user && (
          <Link href="/community/create?type=challenge" className="btn-primary">
            <Target className="h-4 w-4" />
            Launch a Challenge
          </Link>
        )}
      </ScrollReveal>

      {/* Active Challenges */}
      {active.length > 0 && (
        <ScrollReveal direction="up" delay={100} className="mt-8">
          <h2 className="font-bold text-lg text-primary flex items-center gap-2">
            <span className="animate-pulse">🔥</span> Active Challenges
          </h2>
          <StaggerReveal staggerDelay={100} direction="up" className="mt-4 space-y-4">
            {active.map((c) => (
              <GlowOnHover key={String(c.id)} color="warning" intensity="subtle">
                <PostCard {...mapPostToCardData(c, { currentUserId: user?.id })} />
              </GlowOnHover>
            ))}
          </StaggerReveal>
        </ScrollReveal>
      )}

      {/* Past Challenges */}
      {past.length > 0 && (
        <ScrollReveal direction="up" delay={200} className="mt-8">
          <h2 className="font-bold text-lg text-primary flex items-center gap-2">
            <Award className="h-4 w-4" /> Past Challenges
          </h2>
          <StaggerReveal staggerDelay={80} direction="up" className="mt-4 grid gap-3 sm:grid-cols-2">
            {past.map((c) => (
              <GlowOnHover key={String(c.id)} color="brand" intensity="subtle" className="group">
                <Link href={`/community/post/${c.id}`} className="glass-panel block opacity-80 transition-all duration-300 hover:opacity-100 hover:border-brand-500/50 hover:shadow-xl hover:-translate-y-1">
                  <p className="text-2xl">🏆</p>
                  <h3 className="mt-2 font-bold text-primary">{String(c.title ?? "")}</h3>
                  <p className="mt-1 text-xs text-subtle">{new Date(String(c.created_at)).toLocaleDateString()} · {((c as Record<string, unknown>).comment_count as number) ?? 0} entries</p>
                </Link>
              </GlowOnHover>
            ))}
          </StaggerReveal>
        </ScrollReveal>
      )}

      {/* Empty State */}
      {active.length === 0 && past.length === 0 && (
        <ScrollReveal direction="up" delay={100} className="mt-8">
          <div className="glass-panel text-center py-12">
            <Floating amplitude={10} duration={3000}>
              <p className="text-4xl">🏆</p>
            </Floating>
            <h3 className="mt-4 font-bold text-primary">No challenges yet</h3>
            <p className="mt-2 text-sm text-secondary">Launch the first AI challenge for the community!</p>
            {user && (
              <Link href="/community/create?type=challenge" className="btn-primary mt-4 inline-block">
                <Target className="h-4 w-4" />
                Create Challenge
              </Link>
            )}
          </div>
        </ScrollReveal>
      )}

      {/* Challenge Leaderboard */}
      {topEntries.length > 0 && (
        <ScrollReveal direction="up" delay={300} className="mt-8">
          <h2 className="font-bold text-lg text-primary flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" /> Challenge Leaderboard
          </h2>
          <StaggerReveal staggerDelay={80} direction="up" className="mt-4 space-y-2">
            {topEntries.map((e, i) => (
              <GlowOnHover key={i} color={i < 3 ? "warning" : "brand"} intensity="subtle" className="group">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200/60 p-3 transition-all duration-300 hover:border-brand-500/50 hover:shadow-lg hover:bg-slate-50/50 dark:border-slate-800/60 dark:hover:bg-slate-800/50">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    i === 0 ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" :
                    i === 1 ? "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300" :
                    i === 2 ? "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300" :
                    "bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400"
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-primary truncate">{String(e.title ?? "")}</p>
                    <p className="text-xs text-subtle">by {(e.profiles as Record<string, string> | null)?.full_name ?? "Anonymous"}</p>
                  </div>
                  {e.ai_score != null && (
                    <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{Number(e.ai_score)} pts</span>
                  )}
                </div>
              </GlowOnHover>
            ))}
          </StaggerReveal>
        </ScrollReveal>
      )}
    </div>
  );
}