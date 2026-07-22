import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/community/post-card";
import { mapPostToCardData } from "@/lib/community/mappers";
import { attachCommunityProfiles } from "@/lib/community/public-profiles";
import { CommunityCreatePostButton } from "./create-post-button";
import { ScrollReveal, StaggerReveal } from "@/components/scroll-reveal";

export const dynamic = "force-dynamic";

const pinnedSections = [
  { icon: "🔥", label: "Trending Discussions", href: "/community?tab=discussion", color: "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900/30", gradient: "from-orange-500/20 to-transparent" },
  { icon: "🚀", label: "Featured AI Projects", href: "/community/showcase", color: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900/30", gradient: "from-emerald-500/20 to-transparent" },
  { icon: "🏆", label: "Weekly Challenge", href: "/community/challenges", color: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/30", gradient: "from-amber-500/20 to-transparent" },
  { icon: "📅", label: "Upcoming Events", href: "/community/events", color: "bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/30", gradient: "from-rose-500/20 to-transparent" },
  { icon: "📰", label: "AI News", href: "/community?tab=research", color: "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-900/30", gradient: "from-indigo-500/20 to-transparent" },
] as const;

const feedTabs = [
  { key: "all", label: "For You" },
  { key: "showcase", label: "🚀 Showcase" },
  { key: "discussion", label: "💬 Discussion" },
  { key: "question", label: "❓ Question" },
  { key: "research", label: "📄 Research" },
  { key: "tutorial", label: "📚 Tutorial" },
  { key: "career", label: "💼 Career" },
];

export default async function CommunityHomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "all" } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let posts: Array<Record<string, unknown>> = [];
  let trendingCommunities: Array<{ id: string; slug: string; name: string; emoji: string; member_count: number }> = [];
  let feedError: string | null = null;

  const postQuery = supabase
    .from("comm_posts")
    // Do not embed profiles here. comm_posts.user_id references auth.users and
    // PostgREST cannot infer a comm_posts -> profiles relationship through it.
    .select(`id, title, content, post_type, upvotes, downvotes, comment_count, save_count,
      is_pinned, is_featured, is_solved, repo_url, live_url, tech_stack,
      created_at, user_id, comm_communities(slug, name, emoji)`)
    .neq("post_type", "job")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30);

  if (tab !== "all") {
    postQuery.eq("post_type", tab);
  }

  const [postResult, communitiesResult] = await Promise.all([
    postQuery,
    supabase.from("comm_communities").select("id, slug, name, emoji, member_count").order("member_count", { ascending: false }).limit(8),
  ]);

  if (postResult.error) {
    feedError = "The community posts could not be loaded. Please refresh the page; if this continues, confirm that migration 002_community.sql has been applied.";
  } else {
    posts = await attachCommunityProfiles(supabase, (postResult.data ?? []) as Array<Record<string, unknown>>);
  }

  if (!communitiesResult.error) {
    trendingCommunities = (communitiesResult.data ?? []) as typeof trendingCommunities;
  }

  return (
    <div className="space-y-8">
      {/* Pinned Section */}
      <ScrollReveal direction="up" className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-primary">🔥 Trending Today</h2>
        </div>
        <StaggerReveal staggerDelay={80} direction="up" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {pinnedSections.map((s) => (
            <Link 
              key={s.label} 
              href={s.href} 
              className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${s.color} group`}
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `var(--tw-gradient-from, ${s.gradient})` }} />
              <span className="relative text-2xl animate-float-slow">{s.icon}</span>
              <p className="relative mt-2 text-sm font-bold text-primary">{s.label}</p>
            </Link>
          ))}
        </StaggerReveal>
      </ScrollReveal>

      {/* Create a Post */}
      <ScrollReveal direction="up" delay={100}>
        {user ? (
          <CommunityCreatePostButton username={user.email?.split("@")[0] ?? ""} />
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