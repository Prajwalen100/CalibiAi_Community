import Link from "next/link";
import { FileText, ArrowRight, Sparkles, Zap, Brain, Trophy, Calendar, Clock } from "lucide-react";
import { ScrollReveal, StaggerReveal, GlowOnHover, Floating } from "@/components/scroll-reveal";

const articles = [
  {
    title: "Building Verified AI Profiles: Why Certificates Aren't Enough",
    excerpt: "Exploring the gap between traditional credentials and what startups actually need to see when hiring AI engineers.",
    category: "Hiring Insights",
    readTime: "8 min",
    date: "2024-01-15",
    color: "brand",
  },
  {
    title: "The Anatomy of a Production-Ready RAG System",
    excerpt: "Deep dive into retrieval quality, evaluation frameworks, and the patterns that separate demos from deployed systems.",
    category: "Technical Deep Dive",
    readTime: "12 min",
    date: "2024-01-10",
    color: "success",
  },
  {
    title: "From Workshop to Placement: A Student's Journey",
    excerpt: "How one engineering student went from zero AI experience to a verified profile and a role at a Series A startup.",
    category: "Success Story",
    readTime: "6 min",
    date: "2024-01-05",
    color: "warning",
  },
  {
    title: "Prompt Evaluation: Moving Beyond Vibes",
    excerpt: "Introducing deterministic evaluation methodologies for prompt engineering that produce measurable, auditable results.",
    category: "Methodology",
    readTime: "10 min",
    date: "2023-12-28",
    color: "purple",
  },
] as const;

export default function BlogPage() {
  return (
    <div className="relative py-16 sm:py-20 lg:py-24">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-full -translate-x-1/2 max-w-7xl overflow-hidden opacity-30 dark:opacity-20">
        <div className="absolute left-1/4 h-[300px] w-[300px] rounded-full bg-gradient-to-tr from-brand-500/20 via-indigo-500/10 to-purple-500/20 blur-[100px] animate-float-slow" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up" className="text-center mb-12">
          <p className="font-semibold text-brand-600 dark:text-brand-400 animate-fade-in-up">Blog</p>
          <h1 className="mt-2 text-4xl font-black text-primary sm:text-5xl animate-fade-in-up delay-100">
            Team-authored AI education and hiring insights.
          </h1>
          <p className="mt-4 max-w-3xl mx-auto text-secondary animate-fade-in-up delay-200">
            Public articles are authored by CalibiAI educators and reviewed by admins before publishing. 
            The CMS schema and moderation workflow are included in Supabase migrations.
          </p>
        </ScrollReveal>

        <StaggerReveal staggerDelay={150} direction="up" className="grid gap-6 md:grid-cols-2">
          {articles.map((article, index) => (
            <ScrollReveal key={article.title} direction="up" className="group">
              <GlowOnHover color={article.color as "brand" | "success" | "warning" | "purple"} intensity="subtle">
                <article className="glass-panel p-6 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group-hover:border-brand-500/50">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                      article.color === "brand" ? "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300" :
                      article.color === "success" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" :
                      article.color === "warning" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" :
                      "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
                    }`}>
                      {article.category}
                    </span>
                    <span className="text-xs text-subtle">{article.readTime} · {new Date(article.date).toLocaleDateString()}</span>
                  </div>
                  
                  <h2 className="mt-3 text-xl font-bold text-primary group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2">
                    {article.title}
                  </h2>
                  
                  <p className="mt-2 text-sm text-secondary line-clamp-3">
                    {article.excerpt}
                  </p>
                  
                  <Link 
                    href={`/blog/${article.title.toLowerCase().replace(/\s+/g, '-')}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors group"
                  >
                    Read more
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </article>
              </GlowOnHover>
            </ScrollReveal>
          ))}
        </StaggerReveal>

        {/* CTA Section */}
        <ScrollReveal direction="up" delay={300} className="mt-12">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-brand-950 p-8 sm:p-12 text-white text-center shadow-2xl glass-panel-strong">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
            
            <div className="relative">
              <Floating amplitude={8} duration={4000}>
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/20 border border-brand-500/30 px-3 py-1 text-xs font-bold text-brand-300 mb-4">
                  <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                  <span>Stay Updated</span>
                </div>
              </Floating>
              
              <h2 className="text-2xl font-black sm:text-3xl">Get the latest insights delivered to your inbox.</h2>
              <p className="mt-2 text-slate-300 max-w-lg mx-auto">Join 5,000+ engineers receiving our weekly AI education and hiring newsletter.</p>
              
              <form className="mt-6 max-w-md mx-auto flex gap-3" action="/api/newsletter" method="POST">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  required
                  className="flex-1 input bg-white/10 border-white/20 text-white placeholder-slate-400 focus:border-brand-400 focus:ring-brand-400/20"
                />
                <button type="submit" className="btn-primary bg-brand-500 hover:bg-brand-600 whitespace-nowrap">
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