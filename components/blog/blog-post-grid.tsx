"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, ChevronDown, Clock, User } from "lucide-react";
import { SafeBlogImage } from "@/components/blog/safe-blog-image";
import { ScrollReveal, StaggerReveal, GlowOnHover } from "@/components/scroll-reveal";
import type { BlogPost } from "@/lib/blog/posts";

/** Cards shown before the reader has to click "Show more". Keeps the first
 * viewport tidy — two clean rows of the 2-column grid. */
const INITIAL_VISIBLE_COUNT = 6;
/** Cards revealed per "Show more" click thereafter. */
const LOAD_MORE_COUNT = 10;

function colorForIndex(index: number): "brand" | "success" | "warning" | "purple" {
  return (["brand", "success", "warning", "purple"] as const)[index % 4];
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
  } catch {
    return value;
  }
}

/**
 * Renders the blog index grid with progressive disclosure: only the first
 * `INITIAL_VISIBLE_COUNT` posts render up front so the page stays compact,
 * and each "Show more" click reveals another `LOAD_MORE_COUNT` posts without
 * a full page reload.
 */
export function BlogPostGrid({ posts }: { posts: BlogPost[] }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const visiblePosts = useMemo(() => posts.slice(0, visibleCount), [posts, visibleCount]);
  const remaining = posts.length - visiblePosts.length;

  return (
    <>
      <StaggerReveal staggerDelay={150} direction="up" className="grid gap-6 md:grid-cols-2">
        {visiblePosts.map((article, index) => {
          const color = colorForIndex(index);
          return (
            <ScrollReveal key={article.id} direction="up" className="group">
              <GlowOnHover color={color} intensity="subtle">
                <article className="glass-panel flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group-hover:border-brand-500/50">
                  <SafeBlogImage src={article.coverImageUrl} alt={article.title} className="h-44 w-full object-cover" />

                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                          color === "brand"
                            ? "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
                            : color === "success"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                              : color === "warning"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                                : "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
                        }`}
                      >
                        {article.category}
                      </span>
                      {article.featured ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          FEATURED
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1 text-xs text-subtle">
                        <Clock className="h-3.5 w-3.5" /> {article.readTimeMinutes} min
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-subtle">
                        <Calendar className="h-3.5 w-3.5" /> {formatDate(article.publishedAt ?? article.createdAt)}
                      </span>
                    </div>

                    <h2 className="mt-3 line-clamp-2 text-xl font-bold text-primary transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">
                      {article.title}
                    </h2>

                    {article.authorName ? (
                      <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-subtle">
                        <User className="h-3.5 w-3.5" /> {article.authorName}
                      </p>
                    ) : null}

                    <p className="mt-2 line-clamp-3 text-sm text-secondary">{article.excerpt}</p>

                    {article.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {article.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <Link
                      href={`/blog/${article.slug}`}
                      className="group mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                    >
                      Read more
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </article>
              </GlowOnHover>
            </ScrollReveal>
          );
        })}
      </StaggerReveal>

      {remaining > 0 && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + LOAD_MORE_COUNT)}
            className="btn-secondary inline-flex items-center gap-2"
          >
            Show more
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
              +{Math.min(remaining, LOAD_MORE_COUNT)}
            </span>
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
