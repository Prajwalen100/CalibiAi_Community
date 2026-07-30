import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCachedCommunityPosts, getCachedTrendingCommunities, type TrendingCommunity } from "@/lib/community/public-feed";
import { PostCard } from "@/components/community/post-card";
import { mapPostToCardData } from "@/lib/community/mappers";
import { attachCommunityProfiles } from "@/lib/community/public-profiles";
import { CommunityComposer } from "@/components/community/community-composer";
import { ScrollReveal, StaggerReveal } from "@/components/scroll-reveal";
import { CommunityUnavailable } from "@/components/community/community-unavailable";

export const dynamic = "force-dynamic";

function isCommunityConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

const feedTabs = [
  { key: "all", label: "Feed" },
  { key: "showcase", label: "Showcase" },
  { key: "question", label: "Q&A" },
];

export default async function CommunityHomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  if (!isCommunityConfigured()) {
    return <CommunityUnavailable />;
  }

  const { tab: requestedTab = "all" } = await searchParams;
  const tab = requestedTab === "showcase" || requestedTab === "question" ? requestedTab : "all";
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let posts: Array<Record<string, unknown>> = [];
  let trendingCommunities: TrendingCommunity[] = [];
  let feedError: string | null = null;
  let currentUserAvatar: { avatar_id: number | null; avatar_url: string | null } = { avatar_id: null, avatar_url: null };

  if (user) {
    try {
      let profileResp = await supabase
        .from("profiles")
        .select("avatar_id, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profileResp.error && /avatar_(id|url)/.test(profileResp.error.message)) {
        profileResp = await supabase
          .from("profiles")
          .select("avatar_id")
          .eq("user_id", user.id)
          .maybeSingle() as unknown as typeof profileResp;
      }
      if (profileResp.data) {
        const raw = profileResp.data as Record<string, unknown>;
        currentUserAvatar = {
          avatar_id: (raw.avatar_id as number | null) ?? null,
          avatar_url: (raw.avatar_url as string | null) ?? null,
        };
      }
    } catch { /* avatar columns might not exist yet */ }
  }

  // The feed and community list are public and shared between visitors. Cache
  // them for one minute; mutations invalidate the tag immediately.
  const [postsResult, communitiesResult] = await Promise.allSettled([
    getCachedCommunityPosts(tab),
    getCachedTrendingCommunities(),
  ]);

  if (postsResult.status === "rejected") {
    feedError = "The community posts could not be loaded. Please refresh the page; if this continues, confirm that migration 002_community.sql has been applied.";
  } else {
    posts = await attachCommunityProfiles(supabase, postsResult.value);
  }

  if (communitiesResult.status === "fulfilled") {
    trendingCommunities = communitiesResult.value;
  }

  return (
    <div className="space-y-8">
      {/* Pinned composer */}
      <ScrollReveal direction="up" delay={100}>
        {user ? (
          <CommunityComposer
            username={user.email?.split("@")[0] ?? ""}
            avatarId={currentUserAvatar.avatar_id}
            avatarUrl={currentUserAvatar.avatar_url}
            communities={trendingCommunities}
          />
        ) : (
          <div className="glass-panel mb-6 flex items-center justify-between p-6">
            <p className="text-sm text-secondary">Login to join the conversation and post in the community.</p>
            <Link href="/" className="btn-primary">Join with Google</Link>
          </div>
        )}
      </ScrollReveal>

      {/* Feed Tabs */}
      <ScrollReveal direction="up" delay={200} className="mb-4">
        <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200/60 pb-px dark:border-slate-800/60">
          {feedTabs.map((t) => (
            <Link
              key={t.key}
              href={`/community${t.key === "all" ? "" : `?tab=${t.key}`}`}
              className={`whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                tab === t.key
                  ? "border-b-2 border-brand-500 text-brand-700 dark:text-brand-300"
                  : "text-secondary hover:text-primary dark:hover:text-primary"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </ScrollReveal>

      {/* Posts Feed */}
      <ScrollReveal direction="up" delay={300}>
        {feedError && (
          <div role="alert" className="mb-4 rounded-2xl border border-rose-200/50 bg-rose-50/50 p-4 text-sm text-rose-800 dark:border-rose-900/30 dark:bg-rose-950/30 dark:text-rose-300 animate-fade-in-up">
            <p className="font-bold">Unable to load the community feed</p>
            <p className="mt-1">{feedError}</p>
          </div>
        )}
        <div className="space-y-4">
          {posts.length > 0 ? (
            <StaggerReveal staggerDelay={100} direction="up" className="space-y-4">
              {posts.map((p) => (
                <PostCard key={String(p.id)} {...mapPostToCardData(p, { currentUserId: user?.id })} />
              ))}
            </StaggerReveal>
          ) : (
            <div className="glass-panel text-center py-12">
              <p className="text-4xl animate-float-slow">🚀</p>
              <h3 className="mt-4 text-xl font-bold text-primary">Be the first to post!</h3>
              <p className="mt-2 text-secondary">This is where the AI community comes alive. Start a discussion, share a project, or ask a question.</p>
              {user && <Link href="/community/create" className="btn-primary mt-6 inline-block">Create your first post</Link>}
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* Trending Communities (mobile) */}
      {trendingCommunities.length > 0 && (
        <ScrollReveal direction="up" delay={400} className="mt-8 lg:hidden">
          <h2 className="text-lg font-bold text-primary">Trending Communities</h2>
          <StaggerReveal staggerDelay={80} direction="up" className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {trendingCommunities.map((c) => (
              <Link key={c.id} href={`/community/community/${c.slug}`} className="glass-panel hover:border-brand-500/50 hover:shadow-xl transition-all duration-300">
                <span className="text-2xl animate-float-slow">{c.emoji}</span>
                <p className="mt-2 font-bold text-sm text-primary">{c.name}</p>
                <p className="text-xs text-subtle">{c.member_count} members</p>
              </Link>
            ))}
          </StaggerReveal>
        </ScrollReveal>
      )}
    </div>
  );
}
