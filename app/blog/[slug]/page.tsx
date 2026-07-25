import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, FileText } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { STATIC_BLOG_POSTS, toBlogPost, type BlogPost } from "@/lib/blog/posts";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("posts")
      .select("id,author_id,slug,title,excerpt,body,status,category,read_time_minutes,cover_image_url,tags,featured,published_at,created_at,updated_at")
      .eq("type", "blog")
      .eq("status", "published")
      .eq("slug", slug)
      .maybeSingle();

    if (!error && data) return toBlogPost(data);
  } catch {
    // Fall through to static fallback.
  }

  return STATIC_BLOG_POSTS.find((post) => post.slug === slug) ?? null;
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
        <ArrowLeft className="h-4 w-4" /> Back to blog
      </Link>

      <article className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 bg-gradient-to-br from-brand-50 via-white to-indigo-50 p-6 dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-brand-950/40 sm:p-10">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
              <FileText className="h-3.5 w-3.5" /> {post.category}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 dark:bg-slate-800">
              <Clock className="h-3.5 w-3.5" /> {post.readTimeMinutes} min read
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 dark:bg-slate-800">
              <Calendar className="h-3.5 w-3.5" /> {formatDate(post.publishedAt ?? post.createdAt)}
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-black tracking-tight text-primary sm:text-5xl">{post.title}</h1>
          <p className="mt-4 text-lg leading-8 text-secondary">{post.excerpt}</p>

          {post.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 sm:p-10">
          <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-black prose-a:text-brand-600 dark:prose-a:text-brand-400">
            {post.body.split("\n").map((line, index) => {
              if (line.startsWith("### ")) return <h3 key={index}>{line.replace("### ", "")}</h3>;
              if (line.startsWith("## ")) return <h2 key={index}>{line.replace("## ", "")}</h2>;
              if (line.startsWith("# ")) return <h2 key={index}>{line.replace("# ", "")}</h2>;
              if (line.trim().startsWith("- ")) return <li key={index}>{line.trim().replace("- ", "")}</li>;
              if (line.trim() === "") return <br key={index} />;
              return <p key={index}>{line}</p>;
            })}
          </div>
        </div>
      </article>
    </section>
  );
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date(value));
  } catch {
    return value;
  }
}
