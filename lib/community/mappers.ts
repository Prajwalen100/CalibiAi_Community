import type { PostCardData } from "@/components/community/post-card";

/**
 * Maps a raw Supabase comm_posts row (with joined profiles + comm_communities)
 * to the typed PostCardData structure.
 */
export function mapPostToCardData(
  p: Record<string, unknown>,
  opts?: { currentUserId?: string }
): PostCardData {
  const profile = (p.profiles ?? {}) as Record<string, string | null>;
  const community = (p.comm_communities ?? {}) as Record<string, string | null>;
  return {
    id: String(p.id ?? ""),
    title: String(p.title ?? ""),
    content: String(p.content ?? ""),
    postType: String(p.post_type ?? "discussion"),
    authorName: String(profile.full_name ?? "Anonymous"),
    authorUsername: profile.username ? String(profile.username) : undefined,
    authorId: String(p.user_id ?? ""),
    upvotes: Number(p.upvotes ?? 0),
    downvotes: Number(p.downvotes ?? 0),
    commentCount: Number(p.comment_count ?? 0),
    saveCount: Number(p.save_count ?? 0),
    isSolved: Boolean(p.is_solved),
    isFeatured: Boolean(p.is_featured),
    isPinned: Boolean(p.is_pinned),
    communityName: community.name ? String(community.name) : undefined,
    communityEmoji: community.emoji ? String(community.emoji) : undefined,
    communitySlug: community.slug ? String(community.slug) : undefined,
    repoUrl: p.repo_url ? String(p.repo_url) : null,
    liveUrl: p.live_url ? String(p.live_url) : null,
    techStack: Array.isArray(p.tech_stack) ? (p.tech_stack as string[]) : null,
    jobType: p.job_type ? String(p.job_type) : null,
    jobCompany: p.job_company ? String(p.job_company) : null,
    createdAt: String(p.created_at ?? new Date().toISOString()),
    currentUserId: opts?.currentUserId,
  };
}
