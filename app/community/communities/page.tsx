import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

  const categories = [
    { label: "AI & ML", slugs: ["general-ai", "prompt-engineering", "llms", "rag", "ai-agents", "mcp"] },
    { label: "Frameworks & Tools", slugs: ["langchain", "n8n", "python", "java-spring"] },
    { label: "Career & Growth", slugs: ["career-placements", "startups", "hackathons", "college"] },
    { label: "Research", slugs: ["research-papers"] },
  ];

  return (
    <div>
      <h1 className="text-2xl font-black">AI Communities</h1>
      <p className="mt-2 text-slate-600">Join communities that match your interests. Post, learn, and grow together.</p>

      {categories.map((cat) => {
        const catCommunities = communities.filter((c) => cat.slugs.includes(c.slug as string));
        if (catCommunities.length === 0) return null;
        return (
          <div key={cat.label} className="mt-8">
            <h2 className="text-lg font-bold">{cat.label}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CommunityCard({ id, slug, name, emoji, description, memberCount, postCount, isJoined, userId }: {
  id: string; slug: string; name: string; emoji: string; description: string;
  memberCount: number; postCount: number; isJoined: boolean; userId?: string;
}) {
  return (
    <div className="card group">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-3xl">{emoji}</span>
          <h3 className="mt-2 font-bold group-hover:text-brand-700">{name}</h3>
        </div>
        {userId && (
          <form action={async () => {
            "use server";
            const { joinCommunity } = await import("@/app/community/actions");
            await joinCommunity(id);
          }}>
            <button type="submit" className={`rounded-full px-3 py-1 text-xs font-semibold transition ${isJoined ? "bg-slate-100 text-slate-600" : "bg-brand-500 text-white hover:bg-brand-600"}`}>
              {isJoined ? "Joined" : "Join"}
            </button>
          </form>
        )}
      </div>
      <p className="mt-2 text-sm text-slate-600 line-clamp-2">{description}</p>
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <span>👥 {memberCount} members</span>
        <span>📝 {postCount} posts</span>
      </div>
      <Link href={`/community/community/${slug}`} className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:text-brand-600">
        View community →
      </Link>
    </div>
  );
}
