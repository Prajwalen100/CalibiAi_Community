import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";

export type CommunityPostRow = Record<string, unknown>;
export type TrendingCommunity = {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  member_count: number;
};

function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars are missing");
  // This client deliberately has no request cookies: public feed data is safe
  // to share between visitors and can therefore use Next's data cache.
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function loadPosts(tab: "all" | "showcase" | "question") {
  const supabase = createPublicClient();
  let query = supabase
    .from("comm_posts")
    .select(`id, title, content, post_type, upvotes, downvotes, comment_count, save_count,
      is_pinned, is_featured, is_solved, repo_url, live_url, tech_stack, image_url,
      created_at, user_id, comm_communities(slug, name, emoji)`)
    .neq("post_type", "job")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30);

  if (tab !== "all") query = query.eq("post_type", tab);
  const result = await query;
  if (result.error) throw new Error(result.error.message);
  return (result.data ?? []) as CommunityPostRow[];
}

export function getCachedCommunityPosts(tab: "all" | "showcase" | "question") {
  return unstable_cache(
    () => loadPosts(tab),
    ["community-feed", tab],
    { revalidate: 60, tags: ["community-feed"] },
  )();
}

export const getCachedTrendingCommunities = unstable_cache(
  async () => {
    const result = await createPublicClient()
      .from("comm_communities")
      .select("id, slug, name, emoji, member_count")
      .order("member_count", { ascending: false })
      .limit(8);
    if (result.error) throw new Error(result.error.message);
    return (result.data ?? []) as TrendingCommunity[];
  },
  ["community-trending"],
  { revalidate: 60, tags: ["community-feed"] },
);
