import Link from "next/link";
import { CalendarDays, MapPin, Users, Video, Plus, Calendar, Clock, MapPin as MapPinIcon } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ScrollReveal, StaggerReveal, GlowOnHover, Floating } from "@/components/scroll-reveal";

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

const eventTypeColors: Record<string, { light: string; dark: string }> = {
  workshop: { light: "bg-orange-50 text-orange-700", dark: "bg-orange-950/50 text-orange-300" },
  webinar: { light: "bg-blue-50 text-blue-700", dark: "bg-blue-950/50 text-blue-300" },
  meetup: { light: "bg-emerald-50 text-emerald-700", dark: "bg-emerald-950/50 text-emerald-300" },
  hackathon: { light: "bg-amber-50 text-amber-700", dark: "bg-amber-950/50 text-amber-300" },
  ama: { light: "bg-purple-50 text-purple-700", dark: "bg-purple-950/50 text-purple-300" },
  conference: { light: "bg-rose-50 text-rose-700", dark: "bg-rose-950/50 text-rose-300" },
};

const modeColors: Record<string, { light: string; dark: string }> = {
  virtual: { light: "bg-indigo-50 text-indigo-700", dark: "bg-indigo-950/50 text-indigo-300" },
  hybrid: { light: "bg-purple-50 text-purple-700", dark: "bg-purple-950/50 text-purple-300" },
  offline: { light: "bg-emerald-50 text-emerald-700", dark: "bg-emerald-950/50 text-emerald-300" },
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
    <div className="space-y-8">
      {/* Header */}
      <ScrollReveal direction="up" className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 mb-3">
            <Calendar className="h-3.5 w-3.5" />
            <span>Events Calendar</span>
          </div>
          <h1 className="text-2xl font-black text-primary">📅 Events</h1>
          <p className="mt-2 text-secondary">Workshops, webinars, hackathons, and meetups — with dates, locations, meeting links, and enrolment tracking.</p>
        </div>
        {user && (
          <Link href="/community/events/create" className="btn-primary inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create event
          </Link>
        )}
      </ScrollReveal>

      {/* Stats */}
      <ScrollReveal direction="up" delay={100} className="grid gap-4 sm:grid-cols-3">
        <div className="glass-panel p-4 text-center">
          <p className="text-2xl font-black text-primary">{upcoming.length}</p>
          <p className="text-xs text-subtle">Upcoming Events</p>
        </div>
        <div className="glass-panel p-4 text-center">
          <p className="text-2xl font-black text-primary">{past.length}</p>
          <p className="text-xs text-subtle">Past Events</p>
        </div>
        <div className="glass-panel p-4 text-center">
          <p className="text-2xl font-black text-primary">
            {upcoming.reduce((acc, e) => acc + e.registered_count, 0)}
          </p>
          <p className="text-xs text-subtle">Total Registrations</p>
        </div>
      </ScrollReveal>

      {setupNeeded && (
        <ScrollReveal direction="up" delay={150} className="mt-6">
          <div role="alert" className="rounded-2xl border border-amber-200/50 bg-amber-50/50 p-4 text-sm text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-300">
            <p className="font-bold">Setup needed</p>
            <p className="mt-1">{setupNeeded}</p>
          </div>
        </ScrollReveal>
      )}

      {/* Upcoming Events */}
      {upcoming.length > 0 && (
        <ScrollReveal direction="up" delay={200} className="mt-8">
          <h2 className="font-bold text-lg text-primary flex items-center gap-2">
            <span className="animate-pulse">🔔</span> Upcoming events
          </h2>
          <StaggerReveal staggerDelay={100} direction="up" className="mt-4 grid gap-4 sm:grid-cols-2">
            {upcoming.map((e) => (
              <GlowOnHover key={e.id} color="brand" intensity="subtle" className="group">
                <Link href={`/community/events/${e.id}`} className="glass-panel block transition-all duration-300 hover:border-brand-500/50 hover:shadow-xl hover:-translate-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-2xl">{eventTypeEmoji[e.event_type] ?? "📅"}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${eventTypeColors[e.event_type]?.light} dark:${eventTypeColors[e.event_type]?.dark}`}>
                      {humanize(e.event_type)}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${modeColors[e.mode]?.light} dark:${modeColors[e.mode]?.dark}`}>
                      {e.mode}
                    </span>
                  </div>
                  <h3 className="mt-3 font-bold text-lg text-primary">{e.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-secondary">{e.description}</p>
                  <div className="mt-4 grid gap-2 text-xs text-secondary sm:grid-cols-2">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(e.event_date).toLocaleString()}
                    </span>
                    {(e.mode === "offline" || e.mode === "hybrid") && e.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPinIcon className="h-3.5 w-3.5" />
                        {e.location}{e.room ? ` · ${e.room}` : ""}
                      </span>
                    )}
                    {(e.mode === "virtual" || e.mode === "hybrid") && (
                      <span className="inline-flex items-center gap-1.5">
                        <Video className="h-3.5 w-3.5" /> Meeting link included
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {e.registered_count} enrolled{e.max_attendees ? ` / ${e.max_attendees}` : ""}
                    </span>
                  </div>
                  {e.is_registered && (
                      <span className="mt-3 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                      You&apos;re registered
                    </span>
                  )}
                </Link>
              </GlowOnHover>
            ))}
          </StaggerReveal>
        </ScrollReveal>
      )}

      {/* Past Events */}
      {past.length > 0 && (
        <ScrollReveal direction="up" delay={300} className="mt-10">
          <h2 className="font-bold text-lg text-primary flex items-center gap-2">
            <Clock className="h-4 w-4" /> Past events
          </h2>
          <StaggerReveal staggerDelay={80} direction="up" className="mt-4 grid gap-3 sm:grid-cols-2">
            {past.map((e) => (
              <GlowOnHover key={e.id} color="brand" intensity="subtle" className="group">
                <Link href={`/community/events/${e.id}`} className="glass-panel block opacity-80 transition-all duration-300 hover:opacity-100 hover:border-brand-500/50 hover:shadow-lg hover:-translate-y-0.5">
                  <p className="text-2xl">{eventTypeEmoji[e.event_type] ?? "📅"}</p>
                  <h3 className="mt-2 font-bold text-primary">{e.title}</h3>
                  <p className="mt-1 text-xs text-subtle">{new Date(e.event_date).toLocaleDateString()} · {e.registered_count} attended</p>
                </Link>
              </GlowOnHover>
            ))}
          </StaggerReveal>
        </ScrollReveal>
      )}

      {!setupNeeded && upcoming.length === 0 && past.length === 0 && (
        <ScrollReveal direction="up" delay={100} className="mt-8">
          <div className="glass-panel text-center py-12">
            <Floating amplitude={10} duration={3000}>
              <p className="text-4xl">📅</p>
            </Floating>
            <h3 className="mt-4 font-bold text-primary">No events scheduled yet</h3>
            <p className="mt-2 text-sm text-secondary">Create the first community event with all the details attendees need.</p>
            {user && (
              <Link href="/community/events/create" className="btn-primary mt-4 inline-flex items-center gap-2">
                <Plus className="h-4 w-4" /> Create event
              </Link>
            )}
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}