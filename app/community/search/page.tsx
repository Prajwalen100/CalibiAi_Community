import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SearchResults } from "./search-results";
import { LiveSearchForm } from "./live-search-form";
import { attachCommunityProfiles } from "@/lib/community/public-profiles";
import { buildOrIlikeFilter, isSearchableQuery, normalizeSearchQuery } from "@/lib/community/search-query";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = normalizeSearchQuery(q);
  const supabase = await createServerSupabaseClient();

  let posts: Array<Record<string, unknown>> = [];
  let communities: Array<Record<string, unknown>> = [];
  let members: Array<Record<string, unknown>> = [];

  if (isSearchableQuery(query)) {
    // Shared with the nav-bar quick search so both escape input identically.
    const [postsResult, communitiesResult, membersResult] = await Promise.all([
      supabase.from("comm_posts").select("*, comm_communities(slug, name, emoji)").or(buildOrIlikeFilter(["title", "content"], query)).order("upvotes", { ascending: false }).limit(20),
      supabase.from("comm_communities").select("*").or(buildOrIlikeFilter(["name", "description"], query)).limit(10),
      supabase.from("comm_public_profiles").select("user_id, full_name, username, target_role").or(buildOrIlikeFilter(["full_name", "username"], query)).limit(10),
    ]);
    if (!postsResult.error) posts = await attachCommunityProfiles(supabase, (postsResult.data ?? []) as Array<Record<string, unknown>>);
    if (!communitiesResult.error) communities = (communitiesResult.data ?? []) as Array<Record<string, unknown>>;
    if (!membersResult.error) members = (membersResult.data ?? []) as Array<Record<string, unknown>>;
  }

  return (
    <div>
      <h1 className="text-2xl font-black">🔍 Search</h1>
      <p className="mt-2 text-slate-600">Search across posts, communities, members, and more.</p>

      <LiveSearchForm initialQuery={q ?? ""} />

      {isSearchableQuery(query) && (
        <SearchResults posts={posts} communities={communities} members={members} query={query} />
      )}
    </div>
  );
}
