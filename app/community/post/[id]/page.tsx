import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PostDetailView } from "./post-detail-view";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function PostPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let post: Record<string, unknown> | null = null;
  let rawComments: Array<Record<string, unknown>> = [];
  let authorXpLevel = 0;
  let authorXpXp = 0;
  let isFollowing = false;
  let userVote = 0;
  let isSaved = false;
  let rsvpCount = 0;
  let isRsvped = false;
  let rawChallengeEntries: Array<Record<string, unknown>> = [];

  try {
    const [postResult, commentsResult] = await Promise.all([
      supabase.from("comm_posts").select(`*, comm_communities(slug, name, emoji), profiles(full_name, username)`).eq("id", id).single(),
      supabase.from("comm_comments").select(`*, profiles(full_name, username)`).eq("post_id", id).order("created_at", { ascending: true }),
    ]);

    post = postResult.data as Record<string, unknown> | null;
    rawComments = (commentsResult.data ?? []) as Array<Record<string, unknown>>;

    if (!post) notFound();

    const authorId = String(post.user_id);

    const xpResult = await supabase.from("comm_xp").select("xp, level").eq("user_id", authorId).single();
    if (xpResult.data) { authorXpLevel = Number(xpResult.data.level); authorXpXp = Number(xpResult.data.xp); }

    if (user && user.id !== authorId) {
      const followResult = await supabase.from("comm_follows").select("id").eq("follower_id", user.id).eq("following_id", authorId).single();
      isFollowing = !!followResult.data;
    }

    if (user) {
      const [voteResult, saveResult] = await Promise.all([
        supabase.from("comm_post_votes").select("vote_type").eq("user_id", user.id).eq("post_id", id).single(),
        supabase.from("comm_post_saves").select("id").eq("user_id", user.id).eq("post_id", id).single(),
      ]);
      userVote = (voteResult.data as Record<string, number> | null)?.vote_type ?? 0;
      isSaved = !!saveResult.data;
    }

    if (post.post_type === "event") {
      const rsvpResult = await supabase.from("comm_event_rsvps").select("id", { count: "exact" }).eq("post_id", id);
      rsvpCount = rsvpResult.count ?? 0;
      if (user) {
        const myRsvp = await supabase.from("comm_event_rsvps").select("id").eq("user_id", user.id).eq("post_id", id).single();
        isRsvped = !!myRsvp.data;
      }
    }

    if (post.post_type === "challenge") {
      const entriesResult = await supabase.from("comm_challenge_entries").select("*, profiles(full_name, username)").eq("post_id", id).order("created_at", { ascending: false });
      rawChallengeEntries = (entriesResult.data ?? []) as Array<Record<string, unknown>>;
    }
  } catch {
    notFound();
  }

  const authorProfile = (post.profiles ?? {}) as Record<string, string | null>;
  const community = (post.comm_communities ?? {}) as Record<string, string | null>;

  // Map comments to typed structure
  const comments = rawComments.map((c) => {
    const cp = (c.profiles ?? {}) as Record<string, string | null>;
    return {
      id: String(c.id),
      content: String(c.content),
      is_best_answer: Boolean(c.is_best_answer),
      created_at: String(c.created_at),
      user_id: String(c.user_id),
      profiles: { full_name: cp.full_name, username: cp.username },
    };
  });

  // Map challenge entries to typed structure
  const challengeEntries = rawChallengeEntries.map((e) => {
    const ep = (e.profiles ?? {}) as Record<string, string | null>;
    return {
      id: String(e.id ?? ""),
      title: String(e.title ?? ""),
      repo_url: e.repo_url ? String(e.repo_url) : null,
      live_url: e.live_url ? String(e.live_url) : null,
      profiles: { full_name: ep.full_name, username: ep.username },
    };
  });

  return (
    <PostDetailView
      id={String(post.id)}
      title={String(post.title)}
      content={String(post.content)}
      postType={String(post.post_type)}
      upvotes={Number(post.upvotes)}
      downvotes={Number(post.downvotes)}
      commentCount={Number(post.comment_count)}
      isSolved={Boolean(post.is_solved)}
      isFeatured={Boolean(post.is_featured)}
      isPinned={Boolean(post.is_pinned)}
      repoUrl={post.repo_url ? String(post.repo_url) : null}
      liveUrl={post.live_url ? String(post.live_url) : null}
      demoVideoUrl={post.demo_video_url ? String(post.demo_video_url) : null}
      techStack={Array.isArray(post.tech_stack) ? post.tech_stack as string[] : null}
      jobType={post.job_type ? String(post.job_type) : null}
      jobCompany={post.job_company ? String(post.job_company) : null}
      jobLocation={post.job_location ? String(post.job_location) : null}
      eventType={post.event_type ? String(post.event_type) : null}
      eventDate={post.event_date ? String(post.event_date) : null}
      eventLocation={post.event_location ? String(post.event_location) : null}
      challengeDeadline={post.challenge_deadline ? String(post.challenge_deadline) : null}
      resourceType={post.resource_type ? String(post.resource_type) : null}
      resourceUrl={post.resource_url ? String(post.resource_url) : null}
      linkUrl={post.link_url ? String(post.link_url) : null}
      tags={Array.isArray(post.tags) ? post.tags as string[] : []}
      createdAt={String(post.created_at)}
      authorId={String(post.user_id)}
      authorName={String(authorProfile.full_name ?? "Anonymous")}
      authorUsername={authorProfile.username ? String(authorProfile.username) : undefined}
      communityName={community.name ? String(community.name) : null}
      communityEmoji={community.emoji ? String(community.emoji) : null}
      communitySlug={community.slug ? String(community.slug) : null}
      authorXpLevel={authorXpLevel}
      authorXpXp={authorXpXp}
      isFollowing={isFollowing}
      userVote={userVote}
      isSaved={isSaved}
      rsvpCount={rsvpCount}
      isRsvped={isRsvped}
      challengeEntries={challengeEntries}
      comments={comments}
      currentUserId={user?.id}
    />
  );
}
