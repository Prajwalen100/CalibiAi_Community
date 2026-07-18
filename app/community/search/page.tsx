import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SearchResults } from "./search-results";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createServerSupabaseClient();

  let posts: Array<Record<string, unknown>> = [];
  let communities: Array<Record<string, unknown>> = [];
  let members: Array<Record<string, unknown>> = [];

  if (q && q.trim().length > 0) {
    try {
      const [postsResult, communitiesResult, membersResult] = await Promise.all([
        supabase.from("comm_posts").select(`*, comm_communities(slug, name, emoji), profiles(full_name, username)`).or(`title.ilike.%${q}%,content.ilike.%${q}%`).order("upvotes", { ascending: false }).limit(20),
        supabase.from("comm_communities").select("*").or(`name.ilike.%${q}%,description.ilike.%${q}%`).limit(10),
        supabase.from("profiles").select("user_id, full_name, username, target_role").or(`full_name.ilike.%${q}%,username.ilike.%${q}%`).limit(10),
      ]);
      posts = (postsResult.data ?? []) as Array<Record<string, unknown>>;
      communities = (communitiesResult.data ?? []) as Array<Record<string, unknown>>;
      members = (membersResult.data ?? []) as Array<Record<string, unknown>>;
    } catch { /* tables might not exist */ }
  }

  return (
    <div>
      <h1 className="text-2xl font-black">🔍 Search</h1>
      <p className="mt-2 text-slate-600">Search across posts, communities, members, and more.</p>

      <form action="/community/search" method="GET" className="mt-6">
        <div className="flex gap-3">
          <input
            className="input flex-1"
            name="q"
            defaultValue={q}
            placeholder="Search posts, communities, members..."
            autoFocus
          />
          <button type="submit" className="btn-primary">Search</button>
        </div>
      </form>

      {q && q.trim().length > 0 && (
        <SearchResults posts={posts} communities={communities} members={members} query={q} />
      )}
    </div>
  );
}
