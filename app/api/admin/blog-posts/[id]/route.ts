import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin/auth";
import { deleteAdminBlogPost, updateAdminBlogPost } from "@/lib/admin/blog-store";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

const linkSchema = z.object({
  label: z.string().trim().max(120).optional(),
  url: z.string().trim().url(),
});

const blogPatchSchema = z.object({
  title: z.string().trim().min(3).max(180).optional(),
  slug: z.string().trim().max(120).optional().or(z.literal("")),
  authorName: z.string().trim().max(120).optional().or(z.literal("")),
  excerpt: z.string().trim().min(20).max(320).optional(),
  body: z.string().trim().min(80).optional(),
  category: z.string().trim().min(2).max(80).optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  links: z.union([z.string(), z.array(z.union([z.string(), linkSchema]))]).optional(),
  coverImageUrl: z.string().trim().url().optional().or(z.literal("")),
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

export async function PATCH(request: Request, { params }: { params: Params }) {
  if (!(await getAdminSession())) return unauthorized();
  const { id } = await params;

  let payload: z.infer<typeof blogPatchSchema>;
  try {
    payload = blogPatchSchema.parse(await request.json());
  } catch (validationError) {
    const message =
      validationError instanceof z.ZodError
        ? validationError.issues[0]?.message ?? "Invalid blog post payload."
        : "Invalid blog post payload.";
    return NextResponse.json({ error: { code: "VALIDATION", message } }, { status: 422 });
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: { code: "VALIDATION", message: "No fields to update." } }, { status: 422 });
  }

  try {
    const result = await updateAdminBlogPost(id, payload);
    return NextResponse.json({ data: { post: result.data, store: result.store, warning: result.warning } });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "STORE", message: error instanceof Error ? error.message : "Could not update blog post." } },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Params }) {
  if (!(await getAdminSession())) return unauthorized();
  const { id } = await params;

  try {
    const result = await deleteAdminBlogPost(id);
    return NextResponse.json({ data: { id: result.data.id, store: result.store } });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "STORE", message: error instanceof Error ? error.message : "Could not delete blog post." } },
      { status: 400 }
    );
  }
}
