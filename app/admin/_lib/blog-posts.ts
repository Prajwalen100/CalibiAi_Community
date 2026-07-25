import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toBlogPost, type BlogPost } from "@/lib/blog/posts";

export type AdminBlogPostsResult = {
  posts: BlogPost[];
  user: { id: string; email: string | null; role: string | null } | null;
  error: string | null;
  canWrite: boolean;
};

export async function getAdminBlogPosts(): Promise<AdminBlogPostsResult> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        posts: [],
        user: null,
        canWrite: false,
        error: "Sign in with a Supabase account that has role author or admin to create blog posts.",
      };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role,email")
      .eq("user_id", user.id)
      .maybeSingle();

    const role = typeof profile?.role === "string" ? profile.role : null;
    const canWrite = role === "author" || role === "admin";

    const { data, error } = await supabase
      .from("posts")
      .select(
        "id,author_id,slug,title,excerpt,body,status,category,read_time_minutes,cover_image_url,tags,featured,published_at,created_at,updated_at"
      )
      .eq("type", "blog")
      .order("updated_at", { ascending: false });

    if (error) {
      return {
        posts: [],
        user: { id: user.id, email: user.email ?? null, role },
        canWrite,
        error: error.message,
      };
    }

    return {
      posts: (data ?? []).map((row) => toBlogPost(row)),
      user: { id: user.id, email: user.email ?? null, role },
      canWrite,
      error: canWrite ? null : "Your account is signed in, but profiles.role must be author or admin to post blogs.",
    };
  } catch (error) {
    return {
      posts: [],
      user: null,
      canWrite: false,
      error: error instanceof Error ? error.message : "Supabase is not configured for blog posting yet.",
    };
  }
}
