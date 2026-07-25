import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { estimateReadTimeMinutes, normalizeTags, slugifyBlogTitle, toBlogPost } from "@/lib/blog/posts";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type AppRole = "student" | "author" | "admin";

const blogPatchSchema = z.object({
  title: z.string().trim().min(3).max(180).optional(),
  slug: z.string().trim().max(120).optional().or(z.literal("")),
  excerpt: z.string().trim().min(20).max(320).optional(),
  body: z.string().trim().min(80).optional(),
  category: z.string().trim().min(2).max(80).optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  coverImageUrl: z.string().trim().url().optional().or(z.literal("")),
  featured: z.boolean().optional(),
  status: z.enum(["draft", "in_review", "published"]).optional(),
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

export async function PATCH(request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const { supabase, user, role, error } = await getSessionContext();
  if (error === "SUPABASE_NOT_CONFIGURED") return errorResponse("SUPABASE_NOT_CONFIGURED", "Supabase env vars are missing.", 503);
  if (error || !user || !supabase) return errorResponse("UNAUTHENTICATED", "Sign in to update blog posts.", 401);
  if (role !== "author" && role !== "admin") {
    return errorResponse("FORBIDDEN", "Blog posting requires profiles.role = author or admin.", 403, { role });
  }

  let payload: z.infer<typeof blogPatchSchema>;
  try {
    payload = blogPatchSchema.parse(await request.json());
  } catch (validationError) {
    return errorResponse("VALIDATION", "Invalid blog post payload.", 422, validationError instanceof z.ZodError ? validationError.flatten() : validationError);
  }

  const update: Record<string, unknown> = {};
  if (payload.title !== undefined) update.title = payload.title.trim();
  if (payload.slug !== undefined || payload.title !== undefined) update.slug = slugifyBlogTitle(payload.slug?.trim() || payload.title?.trim() || "untitled-post");
  if (payload.excerpt !== undefined) update.excerpt = payload.excerpt.trim();
  if (payload.body !== undefined) {
    update.body = payload.body.trim();
    update.read_time_minutes = estimateReadTimeMinutes(payload.body.trim());
  }
  if (payload.category !== undefined) update.category = payload.category.trim();
  if (payload.tags !== undefined) update.tags = normalizeTags(payload.tags);
  if (payload.coverImageUrl !== undefined) update.cover_image_url = payload.coverImageUrl?.trim() || null;
  if (payload.featured !== undefined) update.featured = role === "admin" ? payload.featured : false;
  if (payload.status !== undefined) {
    update.status = payload.status === "published" && role !== "admin" ? "in_review" : payload.status;
    update.published_at = update.status === "published" ? new Date().toISOString() : null;
  }

  if (Object.keys(update).length === 0) {
    return errorResponse("VALIDATION", "No fields to update.", 422);
  }

  const { data, error: updateError } = await supabase
    .from("posts")
    .update(update)
    .eq("id", id)
    .eq("type", "blog")
    .select("id,author_id,slug,title,excerpt,body,status,category,read_time_minutes,cover_image_url,tags,featured,published_at,created_at,updated_at")
    .single();

  if (updateError) {
    return errorResponse("DATABASE", updateError.message, updateError.code === "23505" ? 409 : 500, { code: updateError.code });
  }

  return NextResponse.json({ data: { post: toBlogPost(data) } });
}
