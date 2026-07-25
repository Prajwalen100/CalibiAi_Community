"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ExternalLink, FileText, Loader2, Send, Sparkles } from "lucide-react";
import type { AdminBlogPostsResult } from "../_lib/blog-posts";
import type { BlogPost, BlogStatus } from "@/lib/blog/posts";

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  tags: string;
  coverImageUrl: string;
  status: BlogStatus;
  featured: boolean;
};

const emptyForm: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  category: "Education",
  tags: "AI, CalibiAI",
  coverImageUrl: "",
  status: "draft",
  featured: false,
};

export function BlogPostManager({ initial }: { initial: AdminBlogPostsResult }) {
  const [posts, setPosts] = useState(initial.posts);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(
    initial.error ? { tone: initial.canWrite ? "info" : "error", text: initial.error } : null
  );
  const [isPending, startTransition] = useTransition();

  const publishedCount = useMemo(() => posts.filter((post) => post.status === "published").length, [posts]);
  const draftCount = useMemo(() => posts.filter((post) => post.status === "draft").length, [posts]);
  const reviewCount = useMemo(() => posts.filter((post) => post.status === "in_review").length, [posts]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/blog-posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            slug: form.slug,
            excerpt: form.excerpt,
            body: form.body,
            category: form.category,
            tags: form.tags,
            coverImageUrl: form.coverImageUrl,
            status: form.status,
            featured: form.featured,
          }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error?.message ?? "Could not create blog post.");
        const post = payload.data.post as BlogPost;
        setPosts((current) => [post, ...current]);
        setForm(emptyForm);
        setMessage({
          tone: "success",
          text: post.status === "published" ? "Blog post published and live on /blog." : "Blog post saved. Submit or publish when ready.",
        });
      } catch (error) {
        setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not create blog post." });
      }
    });
  }

  async function updateStatus(post: BlogPost, status: BlogStatus) {
    setMessage(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/blog-posts/${post.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error?.message ?? "Could not update post status.");
        const updated = payload.data.post as BlogPost;
        setPosts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setMessage({ tone: "success", text: `Post moved to ${updated.status.replace("_", " ")}.` });
      } catch (error) {
        setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not update post status." });
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <BlogStat label="Published" value={publishedCount} tone="success" />
        <BlogStat label="In review" value={reviewCount} tone="info" />
        <BlogStat label="Drafts" value={draftCount} tone="warning" />
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-black text-white">Posting access</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Signed in as {initial.user?.email ?? "not signed in"}. Role: {initial.user?.role ?? "none"}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {initial.canWrite ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-xs font-black text-emerald-100">
                <CheckCircle2 className="h-4 w-4" /> author/admin enabled
              </span>
            ) : (
              <Link href="/signin?mode=sign-in" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-slate-950 hover:bg-brand-100">
                Sign in <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div className={`rounded-2xl border p-4 text-sm ${
          message.tone === "success"
            ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
            : message.tone === "error"
              ? "border-rose-300/30 bg-rose-300/10 text-rose-100"
              : "border-sky-300/30 bg-sky-300/10 text-sky-100"
        }`}>
          <div className="flex gap-2">
            {message.tone === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            <p>{message.text}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={handleSubmit} className="rounded-[2rem] border border-white/10 bg-slate-950/35 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-400/15 text-brand-100">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-white">Create blog post</h3>
              <p className="text-xs text-slate-400">Saves to Supabase public.posts with type=blog.</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <Field label="Title">
              <input className="admin-input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required minLength={3} />
            </Field>
            <Field label="Slug (optional)">
              <input className="admin-input" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="auto-generated from title" />
            </Field>
            <Field label="Excerpt">
              <textarea className="admin-input min-h-20" value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} required minLength={20} />
            </Field>
            <Field label="Body / article content">
              <textarea className="admin-input min-h-56" value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} required minLength={80} placeholder="Markdown-style headings (#, ##) and paragraphs are supported." />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <input className="admin-input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
              </Field>
              <Field label="Tags (comma-separated)">
                <input className="admin-input" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} />
              </Field>
            </div>
            <Field label="Cover image URL (optional)">
              <input className="admin-input" value={form.coverImageUrl} onChange={(event) => setForm({ ...form, coverImageUrl: event.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Initial status">
                <select className="admin-input" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as BlogStatus })}>
                  <option value="draft">Draft</option>
                  <option value="in_review">In review</option>
                  <option value="published">Publish now (admin only)</option>
                </select>
              </Field>
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-bold text-slate-200">
                <input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} />
                Featured post
              </label>
            </div>
            <button
              type="submit"
              disabled={!initial.canWrite || isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Save blog post
            </button>
          </div>
        </form>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/35 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-400/15 text-violet-100">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-white">Blog posts</h3>
              <p className="text-xs text-slate-400">Published posts are visible publicly at /blog/[slug].</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-400">
                No Supabase blog posts yet. Create the first post from the form.
              </div>
            ) : (
              posts.map((post) => (
                <article key={post.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${statusClass(post.status)}`}>
                          {post.status.replace("_", " ")}
                        </span>
                        <span className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-bold text-slate-300">{post.category}</span>
                      </div>
                      <h4 className="mt-3 line-clamp-2 font-black text-white">{post.title}</h4>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-400">{post.excerpt}</p>
                      <p className="mt-2 break-all font-mono text-[11px] text-slate-500">/{post.slug}</p>
                    </div>
                    {post.status === "published" && (
                      <Link href={`/blog/${post.slug}`} target="_blank" className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-brand-100 hover:bg-white/10">
                        View <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" disabled={isPending} onClick={() => updateStatus(post, "draft")} className="admin-action-button">Draft</button>
                    <button type="button" disabled={isPending} onClick={() => updateStatus(post, "in_review")} className="admin-action-button">Send to review</button>
                    <button type="button" disabled={isPending} onClick={() => updateStatus(post, "published")} className="admin-action-button">Publish</button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .admin-input {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.045);
          padding: 0.8rem 0.95rem;
          color: white;
          outline: none;
        }
        .admin-input:focus {
          border-color: rgba(125, 211, 252, 0.6);
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
        }
        .admin-input::placeholder { color: rgb(100 116 139); }
        .admin-action-button {
          border-radius: 9999px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          padding: 0.45rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 800;
          color: rgb(226 232 240);
        }
        .admin-action-button:hover { background: rgba(255,255,255,0.1); }
        .admin-action-button:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function BlogStat({ label, value, tone }: { label: string; value: number; tone: "success" | "info" | "warning" }) {
  const className = tone === "success" ? "from-emerald-400/20 to-emerald-600/10 text-emerald-100" : tone === "info" ? "from-sky-400/20 to-blue-600/10 text-sky-100" : "from-amber-400/20 to-orange-600/10 text-amber-100";
  return (
    <div className={`rounded-3xl border border-white/10 bg-gradient-to-br ${className} p-5`}>
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm font-bold opacity-80">{label}</p>
    </div>
  );
}

function statusClass(status: BlogStatus) {
  if (status === "published") return "bg-emerald-300/10 text-emerald-100 border border-emerald-300/30";
  if (status === "in_review") return "bg-sky-300/10 text-sky-100 border border-sky-300/30";
  return "bg-amber-300/10 text-amber-100 border border-amber-300/30";
}
