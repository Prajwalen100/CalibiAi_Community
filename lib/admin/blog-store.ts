import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  estimateReadTimeMinutes,
  normalizeLinks,
  normalizeTags,
  slugifyBlogTitle,
  sortBlogPosts,
  toBlogPost,
  type BlogPost,
  type BlogStatus,
} from "@/lib/blog/posts";

export type BlogPostInput = {
  title: string;
  slug?: string;
  authorName?: string;
  excerpt: string;
  body: string;
  category?: string;
  tags?: string | string[];
  links?: unknown;
  coverImageUrl?: string;
  readTimeMinutes?: number;
  featured?: boolean;
  status?: BlogStatus;
};

export type BlogStoreKind = "supabase" | "local";

export type BlogStoreResult<T> = {
  data: T;
  store: BlogStoreKind;
  warning: string | null;
};

const SELECT_COLUMNS =
  "id,author_id,author_name,slug,title,excerpt,body,status,category,read_time_minutes,cover_image_url,tags,links,featured,published_at,created_at,updated_at";

/**
 * Local JSON fallback.
 *
 * The admin portal must stay usable on a fresh checkout (for example
 * `localhost:3000/admin` before Supabase keys exist). When the service-role
 * client cannot be created, posts are persisted to a gitignored JSON file so
 * the full create → publish → /blog flow can still be demonstrated.
 */
const LOCAL_DIR = path.join(process.cwd(), ".data");
const LOCAL_FILE = path.join(LOCAL_DIR, "admin-blog-posts.json");

function supabaseOrNull(): SupabaseClient | null {
  try {
    return createAdminSupabaseClient();
  } catch {
    return null;
  }
}

async function readLocalPosts(): Promise<BlogPost[]> {
  try {
    const raw = await fs.readFile(LOCAL_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((row) => toBlogPost(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

async function writeLocalPosts(posts: BlogPost[]) {
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  const rows = posts.map((post) => ({
    id: post.id,
    author_id: post.authorId ?? null,
    author_name: post.authorName,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    body: post.body,
    status: post.status,
    category: post.category,
    read_time_minutes: post.readTimeMinutes,
    cover_image_url: post.coverImageUrl,
    tags: post.tags,
    links: post.links,
    featured: post.featured,
    published_at: post.publishedAt,
    created_at: post.createdAt,
    updated_at: post.updatedAt,
  }));
  await fs.writeFile(LOCAL_FILE, JSON.stringify(rows, null, 2), "utf8");
}

function buildRow(input: BlogPostInput, existing?: BlogPost) {
  const title = input.title?.trim() ?? existing?.title ?? "";
  const body = input.body?.trim() ?? existing?.body ?? "";
  const status: BlogStatus = input.status ?? existing?.status ?? "draft";
  const now = new Date().toISOString();
  const slug = slugifyBlogTitle(input.slug?.trim() || title || existing?.slug || "untitled-post");
  const readTime =
    typeof input.readTimeMinutes === "number" && input.readTimeMinutes > 0
      ? Math.min(120, Math.round(input.readTimeMinutes))
      : estimateReadTimeMinutes(body);

  return {
    title,
    slug,
    author_name: input.authorName?.trim() || existing?.authorName || "CalibiAI Team",
    excerpt: input.excerpt?.trim() ?? existing?.excerpt ?? "",
    body,
    status,
    category: input.category?.trim() || existing?.category || "Education",
    read_time_minutes: readTime,
    cover_image_url: input.coverImageUrl?.trim() || existing?.coverImageUrl || null,
    tags: input.tags !== undefined ? normalizeTags(input.tags) : existing?.tags ?? [],
    links: input.links !== undefined ? normalizeLinks(input.links) : existing?.links ?? [],
    featured: input.featured ?? existing?.featured ?? false,
    published_at: status === "published" ? existing?.publishedAt ?? now : null,
    updated_at: now,
  };
}

function missingColumnHint(message: string) {
  return /column .* does not exist|could not find the .* column/i.test(message);
}

const MIGRATION_HINT =
  "Run supabase/migrations/016_admin_blog_and_student_export.sql — the posts table is missing the admin blog columns (author_name, links).";

export async function listAdminBlogPosts(): Promise<BlogStoreResult<BlogPost[]>> {
  const client = supabaseOrNull();
  if (!client) {
    return {
      data: sortBlogPosts(await readLocalPosts()),
      store: "local",
      warning:
        "Supabase is not configured, so posts are saved to the local .data/admin-blog-posts.json file for testing.",
    };
  }

  const { data, error } = await client
    .from("posts")
    .select(SELECT_COLUMNS)
    .eq("type", "blog")
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) {
    return {
      data: sortBlogPosts(await readLocalPosts()),
      store: "local",
      warning: missingColumnHint(error.message) ? MIGRATION_HINT : error.message,
    };
  }

  return { data: (data ?? []).map((row) => toBlogPost(row)), store: "supabase", warning: null };
}

export async function createAdminBlogPost(input: BlogPostInput): Promise<BlogStoreResult<BlogPost>> {
  const row = buildRow(input);
  const client = supabaseOrNull();

  if (client) {
    const { data, error } = await client
      .from("posts")
      .insert({ ...row, type: "blog", created_at: new Date().toISOString() })
      .select(SELECT_COLUMNS)
      .single();

    if (!error && data) return { data: toBlogPost(data), store: "supabase", warning: null };
    if (error && error.code === "23505") {
      throw new Error(`The slug "${row.slug}" is already used by another post. Choose a different title or slug.`);
    }
    if (error && !missingColumnHint(error.message)) {
      throw new Error(error.message);
    }
  }

  const posts = await readLocalPosts();
  if (posts.some((post) => post.slug === row.slug)) {
    throw new Error(`The slug "${row.slug}" is already used by another post. Choose a different title or slug.`);
  }
  const created = toBlogPost({
    ...row,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  });
  await writeLocalPosts([created, ...posts]);
  return {
    data: created,
    store: "local",
    warning: client
      ? MIGRATION_HINT
      : "Supabase is not configured; the post was saved locally to .data/admin-blog-posts.json.",
  };
}

export async function updateAdminBlogPost(
  id: string,
  input: Partial<BlogPostInput>
): Promise<BlogStoreResult<BlogPost>> {
  const client = supabaseOrNull();

  if (client) {
    const { data: existingRow, error: readError } = await client
      .from("posts")
      .select(SELECT_COLUMNS)
      .eq("id", id)
      .eq("type", "blog")
      .maybeSingle();

    if (!readError && existingRow) {
      const existing = toBlogPost(existingRow);
      const row = buildRow({ ...existing, ...input } as BlogPostInput, existing);
      const { data, error } = await client
        .from("posts")
        .update(row)
        .eq("id", id)
        .eq("type", "blog")
        .select(SELECT_COLUMNS)
        .single();

      if (!error && data) return { data: toBlogPost(data), store: "supabase", warning: null };
      if (error && error.code === "23505") {
        throw new Error(`The slug "${row.slug}" is already used by another post.`);
      }
      if (error && !missingColumnHint(error.message)) throw new Error(error.message);
    } else if (readError && !missingColumnHint(readError.message)) {
      throw new Error(readError.message);
    }
  }

  const posts = await readLocalPosts();
  const existing = posts.find((post) => post.id === id);
  if (!existing) throw new Error("Blog post not found.");
  const row = buildRow({ ...existing, ...input } as BlogPostInput, existing);
  const updated = toBlogPost({ ...row, id: existing.id, created_at: existing.createdAt });
  await writeLocalPosts(posts.map((post) => (post.id === id ? updated : post)));
  return { data: updated, store: "local", warning: null };
}

export async function deleteAdminBlogPost(id: string): Promise<BlogStoreResult<{ id: string }>> {
  const client = supabaseOrNull();

  if (client) {
    const { error } = await client.from("posts").delete().eq("id", id).eq("type", "blog");
    if (!error) return { data: { id }, store: "supabase", warning: null };
    if (!missingColumnHint(error.message)) throw new Error(error.message);
  }

  const posts = await readLocalPosts();
  await writeLocalPosts(posts.filter((post) => post.id !== id));
  return { data: { id }, store: "local", warning: null };
}

/** Published posts for the public /blog experience, including local fallback rows. */
export async function listLocalPublishedPosts(): Promise<BlogPost[]> {
  const posts = await readLocalPosts();
  return sortBlogPosts(posts.filter((post) => post.status === "published"));
}
