import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/community/post-card";
import { CommunityJoinButton } from "./join-button";
import { attachCommunityProfiles } from "@/lib/community/public-profiles";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export default async function CommunityDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let community: Record<string, unknown> | null = null;
  let posts: Array<Record<string, unknown>> = [];
  let isMember = false;

  try {
    const communityResult = await supabase.from("comm_communities").select("*").eq("slug", slug).single();
    community = communityResult.data as Record<string, unknown> | null;
    if (!community) notFound();

    const communityId = community.id as string;

    const [postsResult, memberResult] = await Promise.all([
      supabase
        .from("comm_posts")
        .select("*, comm_communities(slug, name, emoji)")
        .eq("community_id", communityId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(30),
      user ? supabase.from("comm_members").select("id").eq("user_id", user.id).eq("community_id", communityId).single() : { data: null },
    ]);

    if (postsResult.error) throw postsResult.error;
    posts = await attachCommunityProfiles(supabase, (postsResult.data ?? []) as Array<Record<string, unknown>>);
    isMember = !!memberResult.data;
  } catch {
    notFound();
  }

  return (
    <div>
      {/* Community header */}
      <div className="rounded-3xl bg-ink p-8 text-white">
        <span className="text-4xl">{community.emoji as string}</span>
        <h1 className="mt-3 text-3xl font-black">{community.name as string}</h1>
        <p className="mt-2 text-slate-300">{community.description as string}</p>
        <div className="mt-4 flex items-center gap-4">
          <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold">👥 {community.member_count as number} members</span>
          <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold">📝 {community.post_count as number} posts</span>
          {user && <CommunityJoinButton communityId={community.id as string} isMember={isMember} />}
        </div>
      </div>

      {/* Create post link */}
      {user && (
        <Link
          href={`/community/create?community=${community.id as string}`}
          className="mt-6 card flex items-center gap-4 hover:border-brand-500 transition-colors"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
            +
          </div>
          <span className="text-sm text-slate-500">Post in {community.name as string}...</span>
        </Link>
      )}

      {/* Posts */}
      <div className="mt-6 space-y-4">
        {posts.length > 0 ? posts.map((post) => (
          <PostCard
            key={post.id as string}
            id={post.id as string}
            title={post.title as string}
            content={post.content as string}
            postType={post.post_type as string}
            authorName={(post.profiles as Record<string, string>)?.full_name ?? "Anonymous"}
            authorUsername={(post.profiles as Record<string, string>)?.username ?? undefined}
            authorId={post.user_id as string}
            upvotes={post.upvotes as number}
            downvotes={post.downvotes as number}
            commentCount={post.comment_count as number}
            saveCount={post.save_count as number}
            isSolved={post.is_solved as boolean}
            isFeatured={post.is_featured as boolean}
            isPinned={post.is_pinned as boolean}
            communityName={(post.comm_communities as Record<string, string>)?.name}
            communityEmoji={(post.comm_communities as Record<string, string>)?.emoji}
            communitySlug={(post.comm_communities as Record<string, string>)?.slug}
            repoUrl={post.repo_url as string | null}
            liveUrl={post.live_url as string | null}
            techStack={post.tech_stack as string[] | null}
            createdAt={post.created_at as string}
            currentUserId={user?.id}
          />
        )) : (
          <div className="card text-center">
            <p className="text-3xl">{community.emoji as string}</p>
            <h3 className="mt-4 font-bold">No posts yet</h3>
            <p className="mt-2 text-sm text-slate-600">Be the first to post in {community.name as string}!</p>
            {user && <Link href={`/community/create?community=${community.id as string}`} className="btn-primary mt-4 inline-block">Create a post</Link>}
          </div>
        )}
      </div>
    </div>
  );
}
