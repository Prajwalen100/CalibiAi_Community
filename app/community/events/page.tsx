import Link from "next/link";
import { CalendarDays, MapPin, Users, Video, Plus } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type EventRow = {
  id: string;
  title: string;
  description: string;
  event_type: string;
  event_date: string;
  end_date: string | null;
  mode: string;
  location: string | null;
  room: string | null;
  virtual_link: string | null;
  max_attendees: number | null;
  status: string;
  user_id: string;
};

const eventTypeEmoji: Record<string, string> = {
  workshop: "🛠️",
  webinar: "🎥",
  meetup: "🤝",
  hackathon: "🏆",
  ama: "🎙️",
  conference: "🎤",
};

function humanize(v: string) { return v.replace(/_/g, " "); }

export default async function EventsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const upcoming: Array<EventRow & { registered_count: number; is_registered: boolean }> = [];
  const past: Array<EventRow & { registered_count: number; is_registered: boolean }> = [];
  let setupNeeded: string | null = null;

  const { data, error } = await supabase
    .from("comm_events")
    .select("id, title, description, event_type, event_date, end_date, mode, location, room, virtual_link, max_attendees, status, user_id")
    .order("event_date", { ascending: true });

  if (error) {
    if (/comm_events|relation .* does not exist/i.test(error.message)) {
      setupNeeded = "Events database is not set up yet. Apply migration 004_squads_events_applications.sql to enable dedicated events.";
    }
  } else if (data && data.length > 0) {
    const ids = data.map((e) => e.id);
    const [{ data: countRows }, { data: myRegs }] = await Promise.all([
      supabase.from("comm_event_registrations").select("event_id, user_id").in("event_id", ids).neq("status", "cancelled"),
      user
        ? supabase.from("comm_event_registrations").select("event_id").eq("user_id", user.id).in("event_id", ids)
        : Promise.resolve({ data: [] as Array<{ event_id: string }> }),
    ]);
    const countByEvent = new Map<string, number>();
    (countRows ?? []).forEach((r) => countByEvent.set(r.event_id, (countByEvent.get(r.event_id) ?? 0) + 1));
    const myEventIds = new Set((myRegs ?? []).map((r) => r.event_id));

    const now = new Date();
    (data as EventRow[]).forEach((e) => {
      const enriched = {
        ...e,
        registered_count: countByEvent.get(e.id) ?? 0,
        is_registered: myEventIds.has(e.id),
      };
      const eventEnd = e.end_date ? new Date(e.end_date) : new Date(e.event_date);
      if (eventEnd >= now && e.status !== "cancelled") upcoming.push(enriched);
      else past.push(enriched);
    });
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-black">📅 Events</h1>
          <p className="mt-2 text-slate-600">Workshops, webinars, hackathons, and meetups — with dates, locations, meeting links, and enrolment tracking.</p>
        </div>
        {user && (
          <Link href="/community/events/create" className="btn-primary inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create event
          </Link>
        )}
      </div>

      {setupNeeded && (
        <div role="alert" className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-bold">Setup needed</p>
          <p className="mt-1">{setupNeeded}</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <section className="mt-8">
          <h2 className="font-bold text-lg">🔔 Upcoming events</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {upcoming.map((e) => (
              <Link key={e.id} href={`/community/events/${e.id}`} className="card block transition-colors hover:border-brand-500">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{eventTypeEmoji[e.event_type] ?? "📅"}</span>
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold capitalize text-rose-700">{humanize(e.event_type)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${e.mode === "virtual" ? "bg-indigo-50 text-indigo-700" : e.mode === "hybrid" ? "bg-purple-50 text-purple-700" : "bg-emerald-50 text-emerald-700"}`}>
                    {e.mode}
                  </span>
                </div>
                <h3 className="mt-3 font-bold text-lg">{e.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{e.description}</p>
                <div className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                  <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {new Date(e.event_date).toLocaleString()}</span>
                  {(e.mode === "offline" || e.mode === "hybrid") && e.location && (
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {e.location}{e.room ? ` · ${e.room}` : ""}</span>
                  )}
                  {(e.mode === "virtual" || e.mode === "hybrid") && (
                    <span className="inline-flex items-center gap-1.5"><Video className="h-3.5 w-3.5" /> Meeting link included</span>
                  )}
                  <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {e.registered_count} enrolled{e.max_attendees ? ` / ${e.max_attendees}` : ""}</span>
                </div>
                {e.is_registered && (
                  <span className="mt-3 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">You&apos;re registered</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="mt-10">
          <h2 className="font-bold text-lg">📜 Past events</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {past.map((e) => (
              <Link key={e.id} href={`/community/events/${e.id}`} className="card block opacity-80 transition-opacity hover:opacity-100">
                <p className="text-2xl">{eventTypeEmoji[e.event_type] ?? "📅"}</p>
                <h3 className="mt-2 font-bold">{e.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{new Date(e.event_date).toLocaleDateString()} · {e.registered_count} attended</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!setupNeeded && upcoming.length === 0 && past.length === 0 && (
        <div className="mt-8 card text-center">
          <p className="text-4xl">📅</p>
          <h3 className="mt-4 font-bold">No events scheduled yet</h3>
          <p className="mt-2 text-sm text-slate-600">Create the first community event with all the details attendees need.</p>
          {user && (
            <Link href="/community/events/create" className="btn-primary mt-4 inline-flex">Create event</Link>
          )}
        </div>
      )}
    </div>
  );
}
