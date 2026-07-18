import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/community/post-card";

export const dynamic = "force-dynamic";

export default async function TeamFinderPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let posts: Array<Record<string, unknown>> = [];
  try {
    const { data } = await supabase
      .from("comm_posts")
      .select(`*, comm_communities(slug, name, emoji), profiles(full_name, username)`)
      .eq("post_type", "team_finder")
      .order("created_at", { ascending: false })
      .limit(30);
    posts = (data ?? []) as Array<Record<string, unknown>>;
  } catch { /* table might not exist */ }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">🔍 Team Finder</h1>
          <p className="mt-2 text-slate-600">Find teammates for hackathons, projects, and startups. Post what you need or who you&apos;re looking for.</p>
        </div>
        {user && <Link href="/community/create?type=team_finder" className="btn-primary">Find Teammates</Link>}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4 text-center">
          <p className="text-2xl">🤝</p>
          <p className="mt-2 font-bold text-sm">Looking for Teammates</p>
        </div>
        <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4 text-center">
          <p className="text-2xl">🚀</p>
          <p className="mt-2 font-bold text-sm">Hackathon Teams</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-center">
          <p className="text-2xl">💡</p>
          <p className="mt-2 font-bold text-sm">Startup Co-founders</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {posts.length > 0 ? posts.map((p) => (
          <PostCard
            key={p.id as string}
            id={p.id as string}
            title={p.title as string}
            content={p.content as string}
            postType={p.post_type as string}
            authorName={(p.profiles as Record<string, string>)?.full_name ?? "Anonymous"}
            authorUsername={(p.profiles as Record<string, string>)?.username ?? undefined}
            authorId={p.user_id as string}
            upvotes={p.upvotes as number}
            downvotes={p.downvotes as number}
            commentCount={p.comment_count as number}
            saveCount={p.save_count as number}
            createdAt={p.created_at as string}
            currentUserId={user?.id}
          />
        )) : (
          <div className="card text-center">
            <p className="text-4xl">🔍</p>
            <h3 className="mt-4 font-bold">No team finder posts yet</h3>
            <p className="mt-2 text-sm text-slate-600">Looking for teammates? Post what you need here!</p>
          </div>
        )}
      </div>
    </div>
  );
}
