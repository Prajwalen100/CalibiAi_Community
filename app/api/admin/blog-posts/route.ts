import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { estimateReadTimeMinutes, normalizeTags, slugifyBlogTitle, toBlogPost } from "@/lib/blog/posts";

export const dynamic = "force-dynamic";

type AppRole = "student" | "author" | "admin";

const blogPostSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(180),
  slug: z.string().trim().max(120).optional().or(z.literal("")),
  excerpt: z.string().trim().min(20, "Excerpt must be at least 20 characters").max(320),
  body: z.string().trim().min(80, "Body must be at least 80 characters"),
  category: z.string().trim().min(2).max(80).default("Education"),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  coverImageUrl: z.string().trim().url().optional().or(z.literal("")),
  featured: z.boolean().optional().default(false),
  status: z.enum(["draft", "in_review", "published"]).default("draft"),
});

async function getSessionContext() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { supabase, user: null, role: null as AppRole | null, error: "UNAUTHENTICATED" as const };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const role = profile?.role === "admin" || profile?.role === "author" || profile?.role === "student" ? profile.role : "student";
    return { supabase, user, role, error: null };
  } catch {
    return { supabase: null, user: null, role: null as AppRole | null, error: "SUPABASE_NOT_CONFIGURED" as const };
  }
}

function errorResponse(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

export async function GET() {
  const { supabase, user, role, error } = await getSessionContext();
  if (error === "SUPABASE_NOT_CONFIGURED") return errorResponse("SUPABASE_NOT_CONFIGURED", "Supabase env vars are missing.", 503);
  if (error || !user || !supabase) return errorResponse("UNAUTHENTICATED", "Sign in to manage blog posts.", 401);
  if (role !== "author" && role !== "admin") {
    return errorResponse("FORBIDDEN", "Blog posting requires profiles.role = author or admin.", 403, { role });
  }

  const { data, error: queryError } = await supabase
    .from("posts")
    .select("id,author_id,slug,title,excerpt,body,status,category,read_time_minutes,cover_image_url,tags,featured,published_at,created_at,updated_at")
    .eq("type", "blog")
    .order("updated_at", { ascending: false });

  if (queryError) return errorResponse("DATABASE", queryError.message, 500);
  return NextResponse.json({ data: { posts: (data ?? []).map((row) => toBlogPost(row)) } });
}

export async function POST(request: Request) {
  const { supabase, user, role, error } = await getSessionContext();
  if (error === "SUPABASE_NOT_CONFIGURED") return errorResponse("SUPABASE_NOT_CONFIGURED", "Supabase env vars are missing.", 503);
  if (error || !user || !supabase) return errorResponse("UNAUTHENTICATED", "Sign in to create blog posts.", 401);
  if (role !== "author" && role !== "admin") {
    return errorResponse("FORBIDDEN", "Blog posting requires profiles.role = author or admin.", 403, { role });
  }

  let payload: z.infer<typeof blogPostSchema>;
  try {
    payload = blogPostSchema.parse(await request.json());
  } catch (validationError) {
    return errorResponse("VALIDATION", "Invalid blog post payload.", 422, validationError instanceof z.ZodError ? validationError.flatten() : validationError);
  }

  const requestedStatus = payload.status;
  const status = requestedStatus === "published" && role !== "admin" ? "in_review" : requestedStatus;
  const body = payload.body.trim();
  const title = payload.title.trim();
  const slug = slugifyBlogTitle(payload.slug?.trim() || title);
  const now = new Date().toISOString();

  const { data, error: insertError } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      type: "blog",
      title,
      slug,
      excerpt: payload.excerpt.trim(),
      body,
      status,
      category: payload.category.trim(),
      read_time_minutes: estimateReadTimeMinutes(body),
      cover_image_url: payload.coverImageUrl?.trim() || null,
      tags: normalizeTags(payload.tags),
      featured: Boolean(payload.featured) && role === "admin",
      published_at: status === "published" ? now : null,
    })
    .select("id,author_id,slug,title,excerpt,body,status,category,read_time_minutes,cover_image_url,tags,featured,published_at,created_at,updated_at")
    .single();

  if (insertError) {
    return errorResponse("DATABASE", insertError.message, insertError.code === "23505" ? 409 : 500, { code: insertError.code });
  }

  return NextResponse.json({ data: { post: toBlogPost(data), published: status === "published" } }, { status: 201 });
}
