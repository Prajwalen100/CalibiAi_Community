import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mapPostToCardData } from "@/lib/community/mappers";
import { PostCard } from "@/components/community/post-card";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let upcoming: Array<Record<string, unknown>> = [];
  let past: Array<Record<string, unknown>> = [];

  try {
    const { data } = await supabase
      .from("comm_posts")
      .select(`id, title, content, post_type, upvotes, downvotes, comment_count, save_count,
        is_pinned, is_featured, is_solved, created_at, user_id, event_date, event_type, event_location,
        comm_communities(slug, name, emoji), profiles(full_name, username)`)
      .eq("post_type", "event")
      .order("event_date", { ascending: true });
    const all = (data ?? []) as Array<Record<string, unknown>>;
    const now = new Date();
    upcoming = all.filter((e) => e.event_date && new Date(String(e.event_date)) >= now);
    past = all.filter((e) => e.event_date && new Date(String(e.event_date)) < now);
  } catch { /* table might not exist */ }

  const eventTypeEmoji: Record<string, string> = { workshop: "🛠️", webinar: "🎥", meetup: "🤝", hackathon: "🏆", ama: "🎙️" };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">📅 Events</h1>
          <p className="mt-2 text-slate-600">Workshops, webinars, hackathons, meetups, and live AMAs.</p>
        </div>
        {user && <Link href="/community/create?type=event" className="btn-primary">Create Event</Link>}
      </div>

      {upcoming.length > 0 && (
        <div className="mt-8">
          <h2 className="font-bold text-lg">🔔 Upcoming Events</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {upcoming.map((e) => (
              <Link key={String(e.id)} href={`/community/post/${String(e.id)}`} className="card hover:border-brand-500 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{eventTypeEmoji[String(e.event_type ?? "")] ?? "📅"}</span>
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold capitalize text-rose-700">{String(e.event_type ?? "event").replace("_", " ")}</span>
                </div>
                <h3 className="mt-2 font-bold">{String(e.title)}</h3>
                <p className="mt-1 text-sm text-slate-600 line-clamp-2">{String(e.content)}</p>
                <div className="mt-3 text-xs text-slate-500">
                  📅 {e.event_date ? new Date(String(e.event_date)).toLocaleString() : "TBD"}
                  {e.event_location ? ` · 📍 ${String(e.event_location)}` : ""}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div className="mt-8">
          <h2 className="font-bold text-lg">📜 Past Events</h2>
          <div className="mt-4 space-y-4">
            {past.map((e) => <PostCard key={String(e.id)} {...mapPostToCardData(e, { currentUserId: user?.id })} />)}
          </div>
        </div>
      )}

      {upcoming.length === 0 && past.length === 0 && (
        <div className="mt-8 card text-center">
          <p className="text-4xl">📅</p>
          <h3 className="mt-4 font-bold">No events yet</h3>
          <p className="mt-2 text-sm text-slate-600">Create the first community event!</p>
        </div>
      )}
    </div>
  );
}
