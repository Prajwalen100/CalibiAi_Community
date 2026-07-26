"use client";

import { ChangeEvent, FormEvent, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  ExternalLink,
  FileText,
  ImageIcon,
  Link2,
  Upload,
  Loader2,
  Pencil,
  PenLine,
  Plus,
  Save,
  Search,
  Send,
  Tag,
  Trash2,
  User,
  X,
} from "lucide-react";
import { BlogMarkdown } from "@/components/blog/blog-markdown";
import { estimateReadTimeMinutes, slugifyBlogTitle, type BlogPost, type BlogStatus } from "@/lib/blog/posts";
import { Panel, Pill, StatCard, EmptyState, formatDate } from "./ui";

type FormState = {
  title: string;
  slug: string;
  authorName: string;
  readTimeMinutes: string;
  excerpt: string;
  body: string;
  category: string;
  tags: string;
  links: string;
  coverImageUrl: string;
  status: BlogStatus;
  featured: boolean;
};

type Message = { tone: "success" | "error" | "info"; text: string };

const CATEGORIES = [
  "Education",
  "Hiring Insights",
  "Technical Deep Dive",
  "Success Story",
  "Methodology",
  "Product Update",
  "Announcement",
];

function emptyForm(author: string): FormState {
  return {
    title: "",
    slug: "",
    authorName: author,
    readTimeMinutes: "",
    excerpt: "",
    body: "",
    category: "Education",
    tags: "",
    links: "",
    coverImageUrl: "",
    status: "draft",
    featured: false,
  };
}

function formFromPost(post: BlogPost): FormState {
  return {
    title: post.title,
    slug: post.slug,
    authorName: post.authorName ?? "",
    readTimeMinutes: String(post.readTimeMinutes ?? ""),
    excerpt: post.excerpt,
    body: post.body,
    category: post.category,
    tags: post.tags.join(", "),
    links: post.links.map((link) => (link.label === link.url ? link.url : `${link.label} | ${link.url}`)).join("\n"),
    coverImageUrl: post.coverImageUrl ?? "",
    status: post.status,
    featured: post.featured,
  };
}

export function BlogPostManager({
  initialPosts,
  store,
  warning,
  authorFallback,
}: {
  initialPosts: BlogPost[];
  store: "supabase" | "local";
  warning: string | null;
  authorFallback: string;
}) {
  const defaultAuthor = "CalibiAI Team";
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultAuthor));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<Message | null>(
    warning ? { tone: "info", text: warning } : null
  );
  const [filter, setFilter] = useState<"all" | BlogStatus>("all");
  const [search, setSearch] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isPending, startTransition] = useTransition();

  const counts = useMemo(
    () => ({
      published: posts.filter((post) => post.status === "published").length,
      review: posts.filter((post) => post.status === "in_review").length,
      draft: posts.filter((post) => post.status === "draft").length,
    }),
    [posts]
  );

  const visiblePosts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return posts.filter((post) => {
      if (filter !== "all" && post.status !== filter) return false;
      if (!needle) return true;
      return [post.title, post.excerpt, post.category, post.authorName ?? "", post.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [posts, filter, search]);

  const autoSlug = slugifyBlogTitle(form.slug.trim() || form.title || "untitled-post");
  const autoReadTime = form.body.trim() ? estimateReadTimeMinutes(form.body) : 0;

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm(defaultAuthor));
    setShowPreview(false);
  }

  function startEdit(post: BlogPost) {
    setEditingId(post.id);
    setForm(formFromPost(post));
    setMessage(null);
    setShowPreview(false);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function payloadFromForm(overrides: Partial<FormState> = {}) {
    const merged = { ...form, ...overrides };
    return {
      title: merged.title.trim(),
      slug: merged.slug.trim(),
      authorName: merged.authorName.trim() || defaultAuthor,
      excerpt: merged.excerpt.trim(),
      body: merged.body.trim(),
      category: merged.category.trim() || "Education",
      tags: merged.tags,
      links: merged.links,
      coverImageUrl: merged.coverImageUrl.trim(),
      readTimeMinutes: merged.readTimeMinutes ? Number(merged.readTimeMinutes) : undefined,
      featured: merged.featured,
      status: merged.status,
    };
  }

  async function submitForm(status: BlogStatus) {
    setMessage(null);
    const body = payloadFromForm({ status });

    if (body.title.length < 3) {
      setMessage({ tone: "error", text: "Title must be at least 3 characters." });
      return;
    }
    if (body.excerpt.length < 20) {
      setMessage({ tone: "error", text: "Excerpt must be at least 20 characters." });
      return;
    }
    if (body.body.length < 80) {
      setMessage({ tone: "error", text: "Body must be at least 80 characters." });
      return;
    }

    startTransition(async () => {
      try {
        const url = editingId ? `/api/admin/blog-posts/${editingId}` : "/api/admin/blog-posts";
        const response = await fetch(url, {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.error?.message ?? "Could not save the blog post.");

        const post = payload.data.post as BlogPost;
        setPosts((current) =>
          editingId ? current.map((item) => (item.id === post.id ? post : item)) : [post, ...current]
        );
        resetForm();
        setMessage({
          tone: "success",
          text:
            post.status === "published"
              ? `“${post.title}” is live on the Blog tab at /blog/${post.slug}.`
              : `“${post.title}” saved as ${post.status.replace("_", " ")}.`,
        });
      } catch (error) {
        setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not save the blog post." });
      }
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitForm(form.status);
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setMessage(null);
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/blog-posts/upload-image", { method: "POST", body: formData });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message ?? "Could not upload the image.");
      const uploadedUrl = payload?.data?.url;
      if (typeof uploadedUrl !== "string" || !uploadedUrl) throw new Error("Upload finished but no image URL was returned.");
      setForm((current) => ({ ...current, coverImageUrl: uploadedUrl }));
      setMessage({ tone: "success", text: "Image uploaded and attached to this blog post." });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not upload the image." });
    } finally {
      setUploadingImage(false);
    }
  }

  function removeAsterisksFromBody() {
    setForm((current) => ({ ...current, body: current.body.replace(/\*/g, "") }));
  }

  function updateStatus(post: BlogPost, status: BlogStatus) {
    setMessage(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/blog-posts/${post.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.error?.message ?? "Could not update the post.");
        const updated = payload.data.post as BlogPost;
        setPosts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setMessage({
          tone: "success",
          text:
            updated.status === "published"
              ? `“${updated.title}” published to the Blog tab.`
              : `“${updated.title}” moved to ${updated.status.replace("_", " ")}.`,
        });
      } catch (error) {
        setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not update the post." });
      }
    });
  }

  function deletePost(post: BlogPost) {
    if (typeof window !== "undefined" && !window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
    setMessage(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/blog-posts/${post.id}`, { method: "DELETE" });
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.error?.message ?? "Could not delete the post.");
        setPosts((current) => current.filter((item) => item.id !== post.id));
        if (editingId === post.id) resetForm();
        setMessage({ tone: "success", text: `“${post.title}” deleted.` });
      } catch (error) {
        setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not delete the post." });
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CheckCircle2} label="Published" value={counts.published} detail="Live on the Blog tab" accent="emerald" />
        <StatCard icon={Clock} label="In review" value={counts.review} detail="Waiting for approval" accent="brand" />
        <StatCard icon={PenLine} label="Drafts" value={counts.draft} detail="Not visible to students" accent="amber" />
        <StatCard
          icon={FileText}
          label="Storage"
          value={store === "supabase" ? "Supabase" : "Local file"}
          detail={store === "supabase" ? "public.posts · type = blog" : ".data/admin-blog-posts.json"}
          accent="violet"
        />
      </div>

      {message ? (
        <div
          className={`flex items-start gap-2.5 rounded-2xl border p-4 text-sm ${
            message.tone === "success"
              ? "border-emerald-300/60 bg-emerald-50/80 text-emerald-800"
              : message.tone === "error"
                ? "border-rose-300/60 bg-rose-50/80 text-rose-700"
                : "border-sky-300/60 bg-sky-50/80 text-sky-800"
          }`}
        >
          {message.tone === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0" />
          )}
          <p className="min-w-0 flex-1">{message.text}</p>
          <button type="button" onClick={() => setMessage(null)} className="shrink-0 rounded-lg p-0.5 hover:bg-white/60">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        {/* ── Editor ─────────────────────────────────────────── */}
        <Panel
          title={editingId ? "Edit blog post" : "Create blog post"}
          description={
            editingId
              ? "Update the article, then save or publish. Published posts refresh immediately on /blog."
              : "Fill the fields below. Publishing sends the article to the Blog tab in the student navigation."
          }
          icon={editingId ? Pencil : Plus}
          action={
            editingId ? (
              <button type="button" onClick={resetForm} className="admin-btn admin-btn-ghost admin-btn-sm">
                <X className="h-3.5 w-3.5" /> Cancel edit
              </button>
            ) : null
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="admin-label" htmlFor="post-title">
                Title <span className="text-rose-500">*</span>
              </label>
              <input
                id="post-title"
                className="admin-input"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="How CalibiAI verifies applied AI skills"
                required
                minLength={3}
              />
              <p className="admin-mono mt-1.5 text-[11px] admin-faint">/blog/{autoSlug}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="admin-label" htmlFor="post-author">
                  Authored by
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="post-author"
                    className="admin-input pl-9"
                    value={form.authorName}
                    onChange={(event) => setForm({ ...form, authorName: event.target.value })}
                    placeholder={authorFallback}
                  />
                </div>
              </div>
              <div>
                <label className="admin-label" htmlFor="post-readtime">
                  Reading time (minutes)
                </label>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="post-readtime"
                    type="number"
                    min={1}
                    max={120}
                    className="admin-input pl-9"
                    value={form.readTimeMinutes}
                    onChange={(event) => setForm({ ...form, readTimeMinutes: event.target.value })}
                    placeholder={autoReadTime ? `auto: ${autoReadTime}` : "auto"}
                  />
                </div>
                <p className="mt-1.5 text-[11px] admin-faint">
                  Leave blank to calculate from the body{autoReadTime ? ` (~${autoReadTime} min)` : ""}.
                </p>
              </div>
            </div>

            <div>
              <label className="admin-label" htmlFor="post-excerpt">
                Excerpt <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="post-excerpt"
                className="admin-textarea min-h-[76px]"
                value={form.excerpt}
                onChange={(event) => setForm({ ...form, excerpt: event.target.value })}
                placeholder="One or two sentences shown on the blog card."
                required
                minLength={20}
                maxLength={320}
              />
              <p className="mt-1.5 text-[11px] admin-faint">{form.excerpt.length}/320 characters</p>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="admin-label" htmlFor="post-body">
                  Body <span className="text-rose-500">*</span>
                </label>
                <div className="mb-1 flex flex-wrap gap-2">
                  <button type="button" onClick={removeAsterisksFromBody} className="admin-btn admin-btn-ghost admin-btn-sm">
                    Remove *
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreview((current) => !current)}
                    className="admin-btn admin-btn-ghost admin-btn-sm"
                  >
                    <Eye className="h-3.5 w-3.5" /> {showPreview ? "Hide preview" : "Preview"}
                  </button>
                </div>
              </div>
              {showPreview ? (
                <div className="admin-glass-soft max-h-[420px] overflow-y-auto p-4 admin-scroll">
                  <BlogMarkdown body={form.body} mode="admin" />
                </div>
              ) : (
                <textarea
                  id="post-body"
                  className="admin-textarea min-h-[280px]"
                  value={form.body}
                  onChange={(event) => setForm({ ...form, body: event.target.value })}
                  placeholder={"# Heading\n\nParagraph text.\n\n## Sub heading\n\n- bullet point"}
                  required
                  minLength={80}
                />
              )}
              <p className="mt-1.5 text-[11px] admin-faint">
                Markdown-style headings (#, ##, ###), bullets and bold text are rendered on the public page. Use “Remove *” to clean AI-generated asterisks from the body.
              </p>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="admin-label" htmlFor="post-image">
                  Cover image
                </label>
                <label className={`admin-btn admin-btn-ghost admin-btn-sm ${uploadingImage ? "pointer-events-none opacity-60" : ""}`}>
                  {uploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  Upload image
                  <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageUpload} disabled={uploadingImage} />
                </label>
              </div>
              <div className="relative">
                <ImageIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="post-image"
                  className="admin-input pl-9"
                  value={form.coverImageUrl}
                  onChange={(event) => setForm({ ...form, coverImageUrl: event.target.value })}
                  placeholder="Upload an image or paste https://images.example.com/cover.jpg"
                />
              </div>
              {form.coverImageUrl.trim() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.coverImageUrl.trim()}
                  alt="Cover preview"
                  className="mt-2.5 h-36 w-full rounded-xl border border-white/70 object-cover"
                  onError={(event) => {
                    (event.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="admin-label" htmlFor="post-category">
                  Category
                </label>
                <select
                  id="post-category"
                  className="admin-select"
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                >
                  {[...new Set([form.category, ...CATEGORIES])].filter(Boolean).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="admin-label" htmlFor="post-tags">
                  Tags (comma separated)
                </label>
                <div className="relative">
                  <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="post-tags"
                    className="admin-input pl-9"
                    value={form.tags}
                    onChange={(event) => setForm({ ...form, tags: event.target.value })}
                    placeholder="AI, RAG, Careers"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="admin-label" htmlFor="post-links">
                Links (one per line — “Label | https://url” or just the URL)
              </label>
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <textarea
                  id="post-links"
                  className="admin-textarea min-h-[86px] pl-9"
                  value={form.links}
                  onChange={(event) => setForm({ ...form, links: event.target.value })}
                  placeholder={"Official docs | https://docs.example.com\nhttps://github.com/example/repo"}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="admin-label" htmlFor="post-status">
                  Status
                </label>
                <select
                  id="post-status"
                  className="admin-select"
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value as BlogStatus })}
                >
                  <option value="draft">Draft — not visible</option>
                  <option value="in_review">In review</option>
                  <option value="published">Published — live on Blog tab</option>
                </select>
              </div>
              <label className="admin-glass-soft flex cursor-pointer items-center gap-3 px-4 py-3 text-sm font-bold admin-muted sm:mt-[22px]">
                <input
                  type="checkbox"
                  className="admin-checkbox"
                  checked={form.featured}
                  onChange={(event) => setForm({ ...form, featured: event.target.checked })}
                />
                Feature this post
              </label>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-1">
              <button type="submit" disabled={isPending} className="admin-btn admin-btn-primary">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingId ? "Save changes" : "Save post"}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => void submitForm("published")}
                className="admin-btn admin-btn-ghost"
              >
                <Send className="h-4 w-4" /> Publish to Blog tab
              </button>
            </div>
          </form>
        </Panel>

        {/* ── Post list ──────────────────────────────────────── */}
        <Panel
          title="All posts"
          description="Published posts appear under the Blog tab in the student navigation."
          icon={FileText}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="admin-input pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, author, tag…"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["all", "published", "in_review", "draft"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`admin-btn admin-btn-sm ${filter === value ? "admin-btn-primary" : "admin-btn-ghost"}`}
                >
                  {value === "all" ? "All" : value.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 max-h-[900px] space-y-3 overflow-y-auto pr-1 admin-scroll">
            {visiblePosts.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={posts.length === 0 ? "No blog posts yet" : "No posts match this filter"}
                description={
                  posts.length === 0
                    ? "Use the editor to write your first article, then publish it to the student Blog tab."
                    : "Try a different status filter or clear the search box."
                }
              />
            ) : (
              visiblePosts.map((post) => (
                <article key={post.id} className="admin-glass-soft p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={post.status} />
                    <Pill tone="neutral">{post.category}</Pill>
                    {post.featured ? <Pill tone="warn">Featured</Pill> : null}
                    <span className="text-[11px] admin-faint">{post.readTimeMinutes} min read</span>
                  </div>

                  <div className="mt-3 flex gap-3">
                    {post.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.coverImageUrl}
                        alt=""
                        className="h-16 w-16 shrink-0 rounded-xl border border-white/70 object-cover"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 font-black admin-title">{post.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm admin-muted">{post.excerpt}</p>
                      <p className="mt-1.5 text-[11px] admin-faint">
                        {post.authorName ?? "CalibiAI Team"} · {formatDate(post.publishedAt ?? post.updatedAt ?? post.createdAt)}
                        {post.links.length > 0 ? ` · ${post.links.length} link${post.links.length > 1 ? "s" : ""}` : ""}
                      </p>
                    </div>
                  </div>

                  {post.tags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {post.tags.slice(0, 5).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold admin-muted"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => startEdit(post)}
                      disabled={isPending}
                      className="admin-btn admin-btn-ghost admin-btn-sm"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    {post.status !== "published" ? (
                      <button
                        type="button"
                        onClick={() => updateStatus(post, "published")}
                        disabled={isPending}
                        className="admin-btn admin-btn-primary admin-btn-sm"
                      >
                        <Send className="h-3.5 w-3.5" /> Publish
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateStatus(post, "draft")}
                        disabled={isPending}
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                      >
                        Unpublish
                      </button>
                    )}
                    {post.status === "published" ? (
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                      >
                        View <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => deletePost(post)}
                      disabled={isPending}
                      className="admin-btn admin-btn-danger admin-btn-sm"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: BlogStatus }) {
  if (status === "published") return <Pill tone="ok">Published</Pill>;
  if (status === "in_review") return <Pill tone="info">In review</Pill>;
  return <Pill tone="warn">Draft</Pill>;
}

