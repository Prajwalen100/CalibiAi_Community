import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/community/post-card";
import { mapPostToCardData } from "@/lib/community/mappers";

export const dynamic = "force-dynamic";

export default async function AskPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let questions: Array<Record<string, unknown>> = [];
  try {
    const { data } = await supabase
      .from("comm_posts")
      .select(`id, title, content, post_type, upvotes, downvotes, comment_count, save_count,
        is_solved, is_featured, is_pinned, created_at, user_id,
        comm_communities(slug, name, emoji), profiles(full_name, username)`)
      .eq("post_type", "question")
      .order("is_solved", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(30);
    questions = (data ?? []) as Array<Record<string, unknown>>;
  } catch { /* table might not exist */ }

  const unanswered = questions.filter((q) => !q.is_solved);
  const solved = questions.filter((q) => q.is_solved);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">❓ Ask AI Community</h1>
          <p className="mt-2 text-slate-600">Get answers from peers and AI. Technical questions, career advice, anything AI-related.</p>
        </div>
        {user && <Link href="/community/create?type=question" className="btn-primary">Ask a Question</Link>}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-center">
          <p className="text-2xl font-black text-amber-700">{unanswered.length}</p>
          <p className="text-sm text-amber-600">Unanswered</p>
        </div>
        <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-center">
          <p className="text-2xl font-black text-green-700">{solved.length}</p>
          <p className="text-sm text-green-600">Solved</p>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4 text-center">
          <p className="text-2xl font-black text-brand-700">{questions.length}</p>
          <p className="text-sm text-brand-600">Total Questions</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-bold">Unanswered Questions</h2>
        <div className="mt-4 space-y-4">
          {unanswered.length > 0 ? unanswered.map((q) => (
            <PostCard key={String(q.id)} {...mapPostToCardData(q, { currentUserId: user?.id })} />
          )) : (
            <p className="text-sm text-slate-500">No unanswered questions. Great job, community! 🎉</p>
          )}
        </div>
      </div>

      {solved.length > 0 && (
        <div className="mt-8">
          <h2 className="font-bold">✅ Solved Questions</h2>
          <div className="mt-4 space-y-4">
            {solved.map((q) => (
              <PostCard key={String(q.id)} {...mapPostToCardData(q, { currentUserId: user?.id })} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
