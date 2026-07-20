import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/community/post-card";
import { mapPostToCardData } from "@/lib/community/mappers";
import { attachCommunityProfiles } from "@/lib/community/public-profiles";
import { ScrollReveal, StaggerReveal, Floating, GlowOnHover } from "@/components/scroll-reveal";
import { Rocket, Star, Github, Globe } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ShowcasePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let projects: Array<Record<string, unknown>> = [];
  const { data, error } = await supabase
    .from("comm_posts")
    .select(`id, title, content, post_type, upvotes, downvotes, comment_count, save_count,
      is_featured, is_pinned, is_solved, repo_url, live_url, tech_stack, created_at, user_id,
      comm_communities(slug, name, emoji)`)
    .eq("post_type", "showcase")
    .order("is_featured", { ascending: false })
    .order("upvotes", { ascending: false })
    .limit(30);
  if (!error) {
    projects = await attachCommunityProfiles(supabase, (data ?? []) as Array<Record<string, unknown>>);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <ScrollReveal direction="up" className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 mb-3">
            <Rocket className="h-3.5 w-3.5" />
            <span>Project Showcase</span>
          </div>
          <h1 className="text-2xl font-black text-primary">🚀 Project Showcase</h1>
          <p className="mt-2 text-secondary">Show off your AI projects. Get feedback, upvotes, and recognition.</p>
        </div>
        {user && (
          <Link href="/community/create?type=showcase" className="btn-primary inline-flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            Showcase Your Project
          </Link>
        )}
      </ScrollReveal>

      {/* Stats Bar */}
      <ScrollReveal direction="up" delay={100} className="grid gap-4 sm:grid-cols-3">
        <div className="glass-panel p-4 text-center">
          <p className="text-2xl font-black text-primary">{projects.filter(p => (p as Record<string, unknown>).is_featured).length}</p>
          <p className="text-xs text-subtle">Featured Projects</p>
        </div>
        <div className="glass-panel p-4 text-center">
          <p className="text-2xl font-black text-primary">{projects.length}</p>
          <p className="text-xs text-subtle">Total Showcases</p>
        </div>
        <div className="glass-panel p-4 text-center">
          <p className="text-2xl font-black text-primary">
            {projects.reduce((acc, p) => acc + ((p as Record<string, unknown>).upvotes as number || 0), 0)}
          </p>
          <p className="text-xs text-subtle">Total Upvotes</p>
        </div>
      </ScrollReveal>

      {/* Projects Feed */}
      <ScrollReveal direction="up" delay={200}>
        <div className="space-y-4">
          {projects.length > 0 ? (
            <StaggerReveal staggerDelay={100} direction="up" className="space-y-4">
              {projects.map((p) => (
                <PostCard key={String(p.id)} {...mapPostToCardData(p, { currentUserId: user?.id })} />
              ))}
            </StaggerReveal>
          ) : (
            <div className="glass-panel text-center py-12">
              <Floating amplitude={10} duration={3000}>
                <p className="text-4xl">🚀</p>
              </Floating>
              <h3 className="mt-4 font-bold text-primary">No projects showcased yet</h3>
              <p className="mt-2 text-sm text-secondary">Be the first to share your AI project with the community!</p>
              {user && (
                <Link href="/community/create?type=showcase" className="btn-primary mt-4 inline-block">
                  Showcase a Project
                </Link>
              )}
            </div>
          )}
        </div>
      </ScrollReveal>
    </div>
  );
}