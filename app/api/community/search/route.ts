import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStudentAccess } from "@/lib/auth/student-access";
import {
  buildOrIlikeFilter,
  isSearchableQuery,
  normalizeSearchQuery,
} from "@/lib/community/search-query";

export const dynamic = "force-dynamic";

/** Per-section cap. The nav dropdown is a preview, not the full results page. */
const SECTION_LIMIT = 5;

export type QuickSearchMember = {
  type: "member";
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export type QuickSearchCommunity = {
  type: "community";
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  href: string;
};

export type QuickSearchPost = {
  type: "post";
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export type QuickSearchResponse = {
  query: string;
  members: QuickSearchMember[];
  communities: QuickSearchCommunity[];
  posts: QuickSearchPost[];
  total: number;
};

/**
 * Quick-search endpoint backing the navigation bar dropdown.
 *
 * Returns a small preview across members, communities and posts. The full
 * search page stays the destination for complete results.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = normalizeSearchQuery(searchParams.get("q"));

  const empty: QuickSearchResponse = {
    query,
    members: [],
    communities: [],
    posts: [],
    total: 0,
  };

  if (!isSearchableQuery(query)) {
    return NextResponse.json(empty);
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // The nav search is a student-area feature; mirror the header's gating so
    // the endpoint cannot be used to enumerate the community from outside it.
    const access = await getStudentAccess(supabase, user.id);
    if (access.isEmployer || !access.canAccessStudentArea) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [membersResult, communitiesResult, postsResult] = await Promise.all([
      supabase
        .from("comm_public_profiles")
        .select("user_id, full_name, username")
        .or(buildOrIlikeFilter(["full_name", "username"], query))
        .limit(SECTION_LIMIT),
      supabase
        .from("comm_communities")
        .select("id, slug, name, emoji, member_count")
        .or(buildOrIlikeFilter(["name", "description"], query))
        .limit(SECTION_LIMIT),
      supabase
        .from("comm_posts")
        .select("id, title, content, post_type, upvotes")
        .or(buildOrIlikeFilter(["title", "content"], query))
        .order("upvotes", { ascending: false })
        .limit(SECTION_LIMIT),
    ]);

    const members: QuickSearchMember[] = (membersResult.data ?? [])
      .filter((row) => typeof row.username === "string" && row.username)
      .map((row) => ({
        type: "member" as const,
        id: String(row.user_id),
        title: (row.full_name as string) || `@${row.username as string}`,
        subtitle: `@${row.username as string}`,
        href: `/community/members/${row.username as string}`,
      }));

    const communities: QuickSearchCommunity[] = (communitiesResult.data ?? []).map(
      (row) => ({
        type: "community" as const,
        id: String(row.id),
        title: String(row.name ?? ""),
        subtitle: `${Number(row.member_count ?? 0)} members`,
        emoji: String(row.emoji ?? "🏘️"),
        href: `/community/community/${row.slug as string}`,
      })
    );

    const posts: QuickSearchPost[] = (postsResult.data ?? []).map((row) => ({
      type: "post" as const,
      id: String(row.id),
      title: String(row.title ?? ""),
      subtitle: String(row.post_type ?? "discussion").replace(/_/g, " "),
      href: `/community/post/${row.id as string}`,
    }));

    return NextResponse.json({
      query,
      members,
      communities,
      posts,
      total: members.length + communities.length + posts.length,
    } satisfies QuickSearchResponse);
  } catch (error) {
    console.error("Community quick search failed", error);
    return NextResponse.json({ error: "Search unavailable" }, { status: 500 });
  }
}
