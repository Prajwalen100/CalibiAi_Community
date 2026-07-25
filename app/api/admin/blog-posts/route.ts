import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin/auth";
import { createAdminBlogPost, listAdminBlogPosts } from "@/lib/admin/blog-store";

export const dynamic = "force-dynamic";

const linkSchema = z.object({
  label: z.string().trim().max(120).optional(),
  url: z.string().trim().url(),
});

const blogPostSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(180),
  slug: z.string().trim().max(120).optional().or(z.literal("")),
  authorName: z.string().trim().max(120).optional().or(z.literal("")),
  excerpt: z.string().trim().min(20, "Excerpt must be at least 20 characters").max(320),
  body: z.string().trim().min(80, "Body must be at least 80 characters"),
  category: z.string().trim().min(2).max(80).optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  links: z.union([z.string(), z.array(z.union([z.string(), linkSchema]))]).optional(),
  coverImageUrl: z.string().trim().url("Image must be a valid URL").optional().or(z.literal("")),
  readTimeMinutes: z.coerce.number().int().min(1).max(120).optional(),
  featured: z.boolean().optional(),
  status: z.enum(["draft", "in_review", "published"]).optional(),
});

function unauthorized() {
  return NextResponse.json(
    { error: { code: "UNAUTHENTICATED", message: "Sign in at /admin/signin to manage blog posts." } },
    { status: 401 }
  );
}

export async function GET() {
  if (!(await getAdminSession())) return unauthorized();

  try {
    const result = await listAdminBlogPosts();
    return NextResponse.json({ data: { posts: result.data, store: result.store, warning: result.warning } });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "STORE", message: error instanceof Error ? error.message : "Could not load blog posts." } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await getAdminSession())) return unauthorized();

  let payload: z.infer<typeof blogPostSchema>;
  try {
    payload = blogPostSchema.parse(await request.json());
  } catch (validationError) {
    const message =
      validationError instanceof z.ZodError
        ? validationError.issues[0]?.message ?? "Invalid blog post payload."
        : "Invalid blog post payload.";
    return NextResponse.json({ error: { code: "VALIDATION", message } }, { status: 422 });
  }

  try {
    const result = await createAdminBlogPost(payload);
    return NextResponse.json(
      { data: { post: result.data, store: result.store, warning: result.warning } },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: { code: "STORE", message: error instanceof Error ? error.message : "Could not create blog post." } },
      { status: 400 }
    );
  }
}
