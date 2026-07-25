import Link from "next/link";
import { ArrowRight, Calendar, Clock, FileText, Sparkles } from "lucide-react";
import { ScrollReveal, StaggerReveal, GlowOnHover, Floating } from "@/components/scroll-reveal";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { STATIC_BLOG_POSTS, toBlogPost, type BlogPost } from "@/lib/blog/posts";

export const dynamic = "force-dynamic";

async function getPublishedBlogPosts(): Promise<{ posts: BlogPost[]; fromSupabase: boolean; source: string }> {
  try {
    const supabase = await createServerSupabaseClient();

    // === PRIMARY: Direct query on posts table (most reliable) ===
    // This matches exactly how the Admin CMS writes blogs (type='blog', status='published')
    // The RLS policy "published posts public" allows anyone to read published rows.
    const { data: directData, error: directError } = await supabase
      .from("posts")
      .select("id,author_id,slug,title,excerpt,body,status,category,read_time_minutes,cover_image_url,tags,featured,published_at,created_at,updated_at")
      .eq("type", "blog")
      .eq("status", "published")
      .not("slug", "is", null)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (!directError && directData && directData.length > 0) {
      return {
        posts: directData.map((row) => toBlogPost(row)),
        fromSupabase: true,
        source: "Supabase CMS (admin posts)"
      };
    }

    // === FALLBACK 1: Try the published view (if it exists) ===
    const { data: viewData, error: viewError } = await supabase
      .from("published_blog_posts")
      .select("*")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (!viewError && viewData && viewData.length > 0) {
      return {
        posts: viewData.map((row) => toBlogPost(row)),
        fromSupabase: true,
        source: "published_blog_posts view"
      };
    }

    // No published admin blogs yet → show helpful demo + guidance
    return {
      posts: STATIC_BLOG_POSTS,
      fromSupabase: false,
      source: "demo (no published admin blogs yet)"
    };
  } catch (e) {
    console.error("[/blog] Supabase load error:", e);
    return {
      posts: STATIC_BLOG_POSTS,
      fromSupabase: false,
      source: "demo (connection issue)"
    };
  }
}

function colorForIndex(index: number): "brand" | "success" | "warning" | "purple" {
  return (["brand", "success", "warning", "purple"] as const)[index % 4];
}

export default async function BlogPage() {
  const { posts, fromSupabase, source } = await getPublishedBlogPosts();

  return (
    <div className="relative py-16 sm:py-20 lg:py-24">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-full -translate-x-1/2 max-w-7xl overflow-hidden opacity-30 dark:opacity-20">
        <div className="absolute left-1/4 h-[300px] w-[300px] rounded-full bg-gradient-to-tr from-brand-500/20 via-indigo-500/10 to-purple-500/20 blur-[100px] animate-float-slow" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up" className="mb-12 text-center">
          <p className="font-semibold text-brand-600 dark:text-brand-400 animate-fade-in-up">Blog</p>
          <h1 className="mt-2 text-4xl font-black text-primary sm:text-5xl animate-fade-in-up delay-100">
            Team-authored AI education and hiring insights.
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-secondary animate-fade-in-up delay-200">
            <strong>Navbar "Blog" tab</strong> shows every blog you publish from the Admin CMS.
            {fromSupabase 
              ? ` ✅ Live from Admin CMS via Supabase (${source}).` 
              : " (Currently showing demo articles — publish one from /admin/blog to see it here)"}
          </p>
        </ScrollReveal>

        <StaggerReveal staggerDelay={150} direction="up" className="grid gap-6 md:grid-cols-2">
          {posts.map((article, index) => {
            const color = colorForIndex(index);
            const isLiveFromAdmin = fromSupabase; // true = loaded directly from Admin CMS (posts table)
            return (
              <ScrollReveal key={article.id} direction="up" className="group">
                <GlowOnHover color={color} intensity="subtle">
                  <article className="glass-panel h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group-hover:border-brand-500/50">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                        color === "brand" ? "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300" :
                        color === "success" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" :
                        color === "warning" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" :
                        "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
                      }`}>
                        {article.category}
                      </span>

                      {isLiveFromAdmin && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          LIVE FROM ADMIN
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs text-subtle">
                        <Clock className="h-3.5 w-3.5" /> {article.readTimeMinutes} min
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-subtle">
                        <Calendar className="h-3.5 w-3.5" /> {formatDate(article.publishedAt ?? article.createdAt)}
                      </span>
                    </div>

                    <h2 className="mt-3 line-clamp-2 text-xl font-bold text-primary transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">
                      {article.title}
                      {isLiveFromAdmin && <span className="ml-2 align-middle text-[10px] font-black text-emerald-600">• LIVE</span>}
                    </h2>

                    <p className="mt-2 line-clamp-3 text-sm text-secondary">{article.excerpt}</p>

                    {article.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {article.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <Link
                      href={`/blog/${article.slug}`}
                      className="group mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                    >
                      Read more
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </article>
                </GlowOnHover>
              </ScrollReveal>
            );
          })}
        </StaggerReveal>

        <ScrollReveal direction="up" delay={300} className="mt-12">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-brand-950 p-8 text-center text-white shadow-2xl glass-panel-strong sm:p-12">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

            <div className="relative">
              <Floating amplitude={8} duration={4000}>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/20 px-3 py-1 text-xs font-bold text-brand-300">
                  <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                  <span>Stay Updated</span>
                </div>
              </Floating>

              <h2 className="text-2xl font-black sm:text-3xl">Get the latest insights delivered to your inbox.</h2>
              <p className="mx-auto mt-2 max-w-lg text-slate-300">Join 5,000+ engineers receiving our weekly AI education and hiring newsletter.</p>

              <form className="mx-auto mt-6 flex max-w-md gap-3" action="/api/newsletter" method="POST">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  required
                  className="input flex-1 border-white/20 bg-white/10 text-white placeholder-slate-400 focus:border-brand-400 focus:ring-brand-400/20"
                />
                <button type="submit" className="btn-primary whitespace-nowrap bg-brand-500 hover:bg-brand-600">
                  Subscribe
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <p className="mt-4 text-xs text-slate-500">No spam. Unsubscribe anytime.</p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
  } catch {
    return value;
  }
}
