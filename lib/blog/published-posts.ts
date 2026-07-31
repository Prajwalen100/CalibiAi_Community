import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listLocalPublishedPosts } from "@/lib/admin/blog-store";
import { STATIC_BLOG_POSTS, sortBlogPosts, toBlogPost, type BlogPost } from "@/lib/blog/posts";

const BLOG_COLUMNS =
  "id,author_id,author_name,slug,title,excerpt,body,status,category,read_time_minutes,cover_image_url,tags,links,featured,published_at,created_at,updated_at";

const LEGACY_COLUMNS =
  "id,author_id,slug,title,excerpt,body,status,category,read_time_minutes,cover_image_url,tags,featured,published_at,created_at,updated_at";

/**
 * The single source of truth for "which blog posts are published right
 * now" — used by the `/blog` index and by the Reading Engagement
 * calculation (which needs the total published-post count to turn a
 * learner's completed reads into a percentage).
 *
 * Falls back to the local admin store (offline Supabase) and finally the
 * bundled static sample posts, exactly like the original inline
 * implementation on the `/blog` page.
 */
export async function getPublishedBlogPosts(): Promise<{ posts: BlogPost[]; fromAdmin: boolean }> {
  const collected: BlogPost[] = [];

  try {
    const supabase = await createServerSupabaseClient();

    const query = (columns: string) =>
      supabase
        .from("posts")
        .select(columns)
        .eq("type", "blog")
        .eq("status", "published")
        .not("slug", "is", null)
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

    // Primary: the same table the Admin CMS writes to (type = blog, status = published).
    const primary = await query(BLOG_COLUMNS);
    // Databases that have not run migration 016 yet lack author_name/links.
    const result = primary.error ? await query(LEGACY_COLUMNS) : primary;

    if (!result.error && result.data) {
      collected.push(...(result.data as unknown as Record<string, unknown>[]).map((row) => toBlogPost(row)));
    }
  } catch {
    // Supabase is not configured — fall through to the local admin store.
  }

  // Posts written from /admin while Supabase is unavailable.
  try {
    const localPosts = await listLocalPublishedPosts();
    const seen = new Set(collected.map((post) => post.slug));
    collected.push(...localPosts.filter((post) => !seen.has(post.slug)));
  } catch {
    // Local store is optional.
  }

  if (collected.length > 0) {
    return { posts: sortBlogPosts(collected), fromAdmin: true };
  }

  return { posts: STATIC_BLOG_POSTS, fromAdmin: false };
}
