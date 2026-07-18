import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { FollowButton } from "./follow-button";

export const dynamic = "force-dynamic";

type Params = Promise<{ username: string }>;

type ProfileData = {
  user_id: string; full_name: string; username: string; target_role: string;
  college: string; bio: string; github_url: string; linkedin_url: string; portfolio_url: string;
};

export default async function MemberProfilePage({ params }: { params: Params }) {
  const { username } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: ProfileData;

  try {
    const profileResult = await supabase.from("profiles").select("user_id, full_name, username, target_role, college, bio, github_url, linkedin_url, portfolio_url").eq("username", username).single();
    if (!profileResult.data) notFound();
    const pd = profileResult.data as Record<string, unknown>;
    profile = {
      user_id: String(pd.user_id ?? ""),
      full_name: String(pd.full_name ?? ""),
      username: String(pd.username ?? username),
      target_role: String(pd.target_role ?? ""),
      college: String(pd.college ?? ""),
      bio: String(pd.bio ?? ""),
      github_url: String(pd.github_url ?? ""),
      linkedin_url: String(pd.linkedin_url ?? ""),
      portfolio_url: String(pd.portfolio_url ?? ""),
    };
  } catch {
    notFound();
  }

  // Data from other tables (defaults to empty)
  let scoreTotal = 0;
  let scoreTier = "bronze";
  let xpVal = 0;
  let xpLevel = 1;
  let xpContributionLevel = "newcomer";
  let badgeList: Array<{ name: string; emoji: string; description: string }> = [];
  let userPosts: Array<{ id: string; title: string; post_type: string; upvotes: number; comment_count: number; created_at: string }> = [];
  let userCommunities: Array<{ slug: string; name: string; emoji: string }> = [];
  let isFollowing = false;
  let followerCount = 0;
  let followingCount = 0;

  try {
    const userId = profile.user_id;

    const [scoreResult, xpResult, badgesResult, postsResult, communitiesResult, followsResult, followersResult] = await Promise.all([
      supabase.from("scores").select("total, tier").eq("user_id", userId).single(),
      supabase.from("comm_xp").select("xp, level, contribution_level").eq("user_id", userId).single(),
      supabase.from("comm_member_badges").select("comm_badges(name, emoji, description)").eq("user_id", userId),
      supabase.from("comm_posts").select("id, title, post_type, upvotes, comment_count, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
      supabase.from("comm_members").select("comm_communities(slug, name, emoji)").eq("user_id", userId),
      supabase.from("comm_follows").select("id").eq("follower_id", userId),
      supabase.from("comm_follows").select("id").eq("following_id", userId),
    ]);

    if (scoreResult.data) { scoreTotal = Number(scoreResult.data.total); scoreTier = String(scoreResult.data.tier); }
    if (xpResult.data) { xpVal = Number(xpResult.data.xp); xpLevel = Number(xpResult.data.level); xpContributionLevel = String(xpResult.data.contribution_level); }

    const rawBadges = badgesResult.data as Array<Record<string, unknown>> | null;
    if (rawBadges) {
      badgeList = rawBadges.map((b) => {
        const badge = b.comm_badges as Record<string, unknown> | null;
        return { name: String(badge?.name ?? ""), emoji: String(badge?.emoji ?? ""), description: String(badge?.description ?? "") };
      });
    }

    userPosts = (postsResult.data ?? []) as typeof userPosts;

    const rawCommunities = communitiesResult.data as Array<Record<string, unknown>> | null;
    if (rawCommunities) {
      userCommunities = rawCommunities.map((c) => {
        const comm = c.comm_communities as Record<string, unknown> | null;
        return { slug: String(comm?.slug ?? ""), name: String(comm?.name ?? ""), emoji: String(comm?.emoji ?? "") };
      });
    }

    followingCount = followsResult.data?.length ?? 0;
    followerCount = followersResult.data?.length ?? 0;

    if (user && user.id !== userId) {
      const followCheck = await supabase.from("comm_follows").select("id").eq("follower_id", user.id).eq("following_id", userId).single();
      isFollowing = !!followCheck.data;
    }
  } catch {
    // Other tables might not exist yet — use defaults
  }

  const contributionLevels: Record<string, { color: string; bg: string; label: string }> = {
    newcomer: { color: "text-slate-600", bg: "bg-slate-100", label: "🌱 Newcomer" },
    contributor: { color: "text-brand-700", bg: "bg-brand-50", label: "⚡ Contributor" },
    expert: { color: "text-purple-700", bg: "bg-purple-50", label: "💎 Expert" },
    legend: { color: "text-amber-700", bg: "bg-amber-50", label: "👑 Legend" },
  };
  const cLevel = contributionLevels[xpContributionLevel] ?? contributionLevels.newcomer;

  return (
    <div>
      <div className="rounded-3xl bg-ink p-8 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl font-bold text-white">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-black">{profile.full_name}</h1>
              <p className="text-slate-300">@{username} · {profile.target_role}</p>
              {profile.college && <p className="text-sm text-slate-400">{profile.college}</p>}
            </div>
          </div>
          {user && user.id !== profile.user_id && <FollowButton userId={profile.user_id} isFollowing={isFollowing} />}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <span className="rounded-full bg-white px-4 py-2 font-black text-ink">{scoreTotal}/1000</span>
          <span className="rounded-full bg-signal px-4 py-2 font-bold capitalize text-ink">{scoreTier}</span>
          <span className={`rounded-full px-4 py-2 font-bold ${cLevel.bg} ${cLevel.color}`}>{cLevel.label}</span>
          {xpVal > 0 && <span className="rounded-full bg-white/10 px-4 py-2 font-bold">{xpVal} XP</span>}
        </div>

        <div className="mt-4 flex gap-6 text-sm text-slate-300">
          <span>{followerCount} followers</span>
          <span>{followingCount} following</span>
          <span>{userPosts.length} posts</span>
        </div>

        {profile.bio && <p className="mt-4 text-slate-300">{profile.bio}</p>}

        <div className="mt-4 flex gap-3">
          {profile.github_url && <a href={profile.github_url} target="_blank" className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20">GitHub</a>}
          {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20">LinkedIn</a>}
          {profile.portfolio_url && <a href={profile.portfolio_url} target="_blank" className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20">Portfolio</a>}
        </div>
      </div>

      {badgeList.length > 0 && (
        <div className="mt-6">
          <h2 className="font-bold">🏅 Badges</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {badgeList.map((b, i) => (
              <span key={i} className="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700" title={b.description}>{b.emoji} {b.name}</span>
            ))}
          </div>
        </div>
      )}

      {userCommunities.length > 0 && (
        <div className="mt-6">
          <h2 className="font-bold">🏘️ Communities</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {userCommunities.map((c, i) => (
              <Link key={i} href={`/community/community/${c.slug}`} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium hover:bg-slate-200">{c.emoji} {c.name}</Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h2 className="font-bold">📝 Recent Posts</h2>
        <div className="mt-3 space-y-3">
          {userPosts.length > 0 ? userPosts.map((p) => (
            <Link key={p.id} href={`/community/post/${p.id}`} className="block rounded-xl border border-slate-100 p-4 hover:bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold capitalize">{p.post_type.replace("_", " ")}</span>
              </div>
              <h3 className="mt-1 font-semibold">{p.title}</h3>
              <div className="mt-1 flex gap-3 text-xs text-slate-500">
                <span>👍 {p.upvotes}</span>
                <span>💬 {p.comment_count}</span>
                <span>{new Date(p.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          )) : <p className="text-sm text-slate-500">No posts yet.</p>}
        </div>
      </div>
    </div>
  );
}
