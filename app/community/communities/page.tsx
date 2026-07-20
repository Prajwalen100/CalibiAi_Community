import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ScrollReveal, StaggerReveal, GlowOnHover, Floating } from "@/components/scroll-reveal";
import { Users, Hash, BookOpen, Briefcase, Search, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CommunitiesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let communities: Array<Record<string, unknown>> = [];
  let joinedIds: Set<string> = new Set();

  try {
    const [commResult, memberResult] = await Promise.all([
      supabase.from("comm_communities").select("*").order("sort_order"),
      user ? supabase.from("comm_members").select("community_id").eq("user_id", user.id) : { data: [] as Array<Record<string, string>> | null },
    ]);
    communities = commResult.data ?? [];
    if (memberResult.data) {
      joinedIds = new Set((memberResult.data as Array<Record<string, string>>).map((m) => m.community_id));
    }
  } catch { /* table might not exist */ }

  const categories: Array<{ label: string; icon: string; slugs: string[]; color: string }> = [
    { label: "AI & ML", icon: "🧠", slugs: ["general-ai", "prompt-engineering", "llms", "rag", "ai-agents", "mcp"], color: "brand" },
    { label: "Frameworks & Tools", icon: "⚙️", slugs: ["langchain", "n8n", "python", "java-spring"], color: "success" },
    { label: "Career & Growth", icon: "📈", slugs: ["career-placements", "startups", "hackathons", "college"], color: "warning" },
    { label: "Research", icon: "🔬", slugs: ["research-papers"], color: "purple" },
  ];

  function CommunityCard({ 
    id, slug, name, emoji, description, memberCount, postCount, isJoined, userId 
  }: {
    id: string; slug: string; name: string; emoji: string; description: string;
    memberCount: number; postCount: number; isJoined: boolean; userId?: string;
  }) {
    return (
      <GlowOnHover color="brand" intensity="subtle" className="group">
        <Link href={`/community/community/${slug}`} className="glass-panel block transition-all duration-300 hover:border-brand-500/50 hover:shadow-xl hover:-translate-y-1 h-full">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-3xl animate-float-slow">{emoji}</span>
              <h3 className="mt-2 font-bold text-primary group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{name}</h3>
            </div>
            {userId && (
              <form action={async () => {
                "use server";
                const { joinCommunity } = await import("@/app/community/actions");
                await joinCommunity(id);
              }}>
                <button type="submit" className={`rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 ${
                  isJoined 
                    ? "bg-slate-100 text-secondary hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-700/50" 
                    : "bg-brand-500 text-white hover:bg-brand-600 hover:shadow-brand-500/30"
                }`}>
                  {isJoined ? "Joined" : "Join"}
                </button>
              </form>
            )}
          </div>
          <p className="mt-2 text-sm text-secondary line-clamp-2">{description}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-subtle">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {memberCount} members
            </span>
            <span className="inline-flex items-center gap-1">
              <Hash className="h-3 w-3" />
              {postCount} posts
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors group">
              View community
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      </GlowOnHover>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <ScrollReveal direction="up" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 mb-3">
            <Users className="h-3.5 w-3.5" />
            <span>Communities</span>
          </div>
          <h1 className="text-2xl font-black text-primary">AI Communities</h1>
          <p className="mt-2 text-secondary">Join communities that match your interests. Post, learn, and grow together.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary">
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>
      </ScrollReveal>

      {/* Stats */}
      <ScrollReveal direction="up" delay={100} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-panel p-4 text-center">
          <p className="text-2xl font-black text-primary">{communities.length}</p>
          <p className="text-xs text-subtle">Total Communities</p>
        </div>
        <div className="glass-panel p-4 text-center">
          <p className="text-2xl font-black text-primary">
            {communities.reduce((acc, c) => acc + ((c.member_count as number) || 0), 0)}
          </p>
          <p className="text-xs text-subtle">Total Members</p>
        </div>
        <div className="glass-panel p-4 text-center">
          <p className="text-2xl font-black text-primary">
            {communities.reduce((acc, c) => acc + ((c.post_count as number) || 0), 0)}
          </p>
          <p className="text-xs text-subtle">Total Posts</p>
        </div>
        <div className="glass-panel p-4 text-center">
          <p className="text-2xl font-black text-primary">{joinedIds.size}</p>
          <p className="text-xs text-subtle">Your Communities</p>
        </div>
      </ScrollReveal>

      {/* Categories */}
      <div className="space-y-8">
        {categories.map((cat, catIndex) => {
          const catCommunities = communities.filter((c) => cat.slugs.includes(String(c.slug)));
          if (catCommunities.length === 0) return null;

          return (
            <ScrollReveal key={cat.label} direction="up" delay={200 + catIndex * 100} className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{cat.icon}</span>
                <h2 className="text-lg font-bold text-primary">{cat.label}</h2>
              </div>
              <StaggerReveal staggerDelay={80} direction="up" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {catCommunities.map((c) => (
                  <CommunityCard
                    key={c.id as string}
                    id={c.id as string}
                    slug={c.slug as string}
                    name={c.name as string}
                    emoji={c.emoji as string}
                    description={c.description as string}
                    memberCount={c.member_count as number}
                    postCount={c.post_count as number}
                    isJoined={joinedIds.has(c.id as string)}
                    userId={user?.id}
                  />
                ))}
              </StaggerReveal>
            </ScrollReveal>
          );
        })}

        {communities.length === 0 && (
          <ScrollReveal direction="up" delay={200} className="mt-8">
            <div className="glass-panel text-center py-12">
              <Floating amplitude={10} duration={3000}>
                <p className="text-4xl">👥</p>
              </Floating>
              <h3 className="mt-4 font-bold text-primary">No communities yet</h3>
              <p className="mt-2 text-sm text-secondary">Communities will appear here once they&apos;re created.</p>
            </div>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}