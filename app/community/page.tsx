import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/community/post-card";
import { mapPostToCardData } from "@/lib/community/mappers";
import { attachCommunityProfiles } from "@/lib/community/public-profiles";
import { CommunityCreatePostButton } from "./create-post-button";

export const dynamic = "force-dynamic";

const pinnedSections = [
  { icon: "🔥", label: "Trending Discussions", href: "/community?tab=discussion", color: "bg-orange-50 border-orange-200" },
  { icon: "🚀", label: "Featured AI Projects", href: "/community/showcase", color: "bg-green-50 border-green-200" },
  { icon: "🏆", label: "Weekly Challenge", href: "/community/challenges", color: "bg-amber-50 border-amber-200" },
  { icon: "📅", label: "Upcoming Events", href: "/community/events", color: "bg-rose-50 border-rose-200" },
  { icon: "💼", label: "Latest Internships", href: "/community/jobs", color: "bg-teal-50 border-teal-200" },
  { icon: "📰", label: "AI News", href: "/community?tab=research", color: "bg-indigo-50 border-indigo-200" },
];

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
    <div>
      {/* Pinned Section */}
      <div className="mb-6">
        <h2 className="text-lg font-bold">🔥 Trending Today</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {pinnedSections.map((s) => (
            <Link key={s.label} href={s.href} className={`rounded-2xl border p-4 transition-all hover:shadow-md ${s.color}`}>
              <span className="text-2xl">{s.icon}</span>
              <p className="mt-2 text-sm font-bold">{s.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Create a Post */}
      {user ? (
        <CommunityCreatePostButton username={user.email?.split("@")[0] ?? ""} />
      ) : (
        <div className="card mb-6 flex items-center justify-between">
          <p className="text-sm text-slate-600">Login to join the conversation and post in the community.</p>
          <Link href="/" className="btn-primary">Join with Google</Link>
        </div>
      )}

      {/* Feed Tabs */}
      <div className="mb-4 flex items-center gap-1 overflow-x-auto border-b border-slate-100 pb-px">
        {feedTabs.map((t) => (
          <Link
            key={t.key}
            href={`/community${t.key === "all" ? "" : `?tab=${t.key}`}`}
            className={`whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-semibold transition ${tab === t.key ? "border-b-2 border-brand-500 text-brand-700" : "text-slate-500 hover:text-slate-700"}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Posts Feed */}
      {feedError && (
        <div role="alert" className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <p className="font-bold">Unable to load the community feed</p>
          <p className="mt-1">{feedError}</p>
        </div>
      )}
      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map((p) => <PostCard key={String(p.id)} {...mapPostToCardData(p, { currentUserId: user?.id })} />)
        ) : (
          <div className="card text-center">
            <p className="text-4xl">🚀</p>
            <h3 className="mt-4 text-xl font-bold">Be the first to post!</h3>
            <p className="mt-2 text-slate-600">This is where the AI community comes alive. Start a discussion, share a project, or ask a question.</p>
            {user && <Link href="/community/create" className="btn-primary mt-6 inline-block">Create your first post</Link>}
          </div>
        )}
      </div>

      {/* Trending Communities (mobile) */}
      {trendingCommunities.length > 0 && (
        <div className="mt-8 lg:hidden">
          <h2 className="text-lg font-bold">Trending Communities</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {trendingCommunities.map((c) => (
              <Link key={c.id} href={`/community/community/${c.slug}`} className="card hover:border-brand-500">
                <span className="text-2xl">{c.emoji}</span>
                <p className="mt-2 font-bold text-sm">{c.name}</p>
                <p className="text-xs text-slate-500">{c.member_count} members</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
