import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/community/post-card";
import { mapPostToCardData } from "@/lib/community/mappers";
import { attachCommunityProfiles } from "@/lib/community/public-profiles";

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
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">🚀 Project Showcase</h1>
          <p className="mt-2 text-slate-600">Show off your AI projects. Get feedback, upvotes, and recognition.</p>
        </div>
        {user && <Link href="/community/create?type=showcase" className="btn-primary">Showcase Your Project</Link>}
      </div>

      <div className="mt-6 space-y-4">
        {projects.length > 0 ? projects.map((p) => (
          <PostCard key={String(p.id)} {...mapPostToCardData(p, { currentUserId: user?.id })} />
        )) : (
          <div className="card text-center">
            <p className="text-4xl">🚀</p>
            <h3 className="mt-4 font-bold">No projects showcased yet</h3>
            <p className="mt-2 text-sm text-slate-600">Be the first to share your AI project with the community!</p>
            {user && <Link href="/community/create?type=showcase" className="btn-primary mt-4 inline-block">Showcase a Project</Link>}
          </div>
        )}
      </div>
    </div>
  );
}
