import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, MapPin, Users, Video, DoorOpen } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { RegisterButton } from "./register-button";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function EventDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("comm_events")
    .select("id, title, description, event_type, event_date, end_date, mode, location, room, virtual_link, cover_image_url, max_attendees, status, user_id, created_at")
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  const { count: registeredCount } = await supabase
    .from("comm_event_registrations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id)
    .neq("status", "cancelled");

  let isRegistered = false;
  if (user) {
    const { data: reg } = await supabase
      .from("comm_event_registrations")
      .select("id")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    isRegistered = !!reg;
  }

  const showLink = isRegistered || (!!user && user.id === data.user_id);
  const capacityReached = !!data.max_attendees && (registeredCount ?? 0) >= data.max_attendees;

  return (
    <div>
      <Link href="/community/events" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to Events
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <article className="overflow-hidden rounded-3xl border border-slate-200">
          {data.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.cover_image_url} alt="" className="h-56 w-full object-cover" />
          )}
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold capitalize text-rose-700">{data.event_type.replace(/_/g, " ")}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${data.mode === "virtual" ? "bg-indigo-50 text-indigo-700" : data.mode === "hybrid" ? "bg-purple-50 text-purple-700" : "bg-emerald-50 text-emerald-700"}`}>
                {data.mode}
              </span>
              {data.status !== "scheduled" && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold capitalize text-slate-700">{data.status}</span>
              )}
            </div>
            <h1 className="mt-4 text-3xl font-black">{data.title}</h1>

            <section className="mt-6">
              <h2 className="text-lg font-bold">About this event</h2>
              <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">{data.description}</p>
            </section>

            <section className="mt-8 grid gap-4 rounded-2xl bg-slate-50 p-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Starts</p>
                <p className="mt-1 flex items-center gap-2 font-semibold text-slate-800">
                  <CalendarDays className="h-4 w-4 text-brand-700" />
                  {new Date(data.event_date).toLocaleString()}
                </p>
              </div>
              {data.end_date && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Ends</p>
                  <p className="mt-1 flex items-center gap-2 font-semibold text-slate-800">
                    <Clock className="h-4 w-4 text-brand-700" />
                    {new Date(data.end_date).toLocaleString()}
                  </p>
                </div>
              )}
              {(data.mode === "offline" || data.mode === "hybrid") && (
                <>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Location</p>
                    <p className="mt-1 flex items-center gap-2 font-semibold text-slate-800">
                      <MapPin className="h-4 w-4 text-brand-700" />
                      {data.location || "Location TBD"}
                    </p>
                  </div>
                  {data.room && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Room / hall</p>
                      <p className="mt-1 flex items-center gap-2 font-semibold text-slate-800">
                        <DoorOpen className="h-4 w-4 text-brand-700" />
                        {data.room}
                      </p>
                    </div>
                  )}
                </>
              )}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Enrolled</p>
                <p className="mt-1 flex items-center gap-2 font-semibold text-slate-800">
                  <Users className="h-4 w-4 text-brand-700" />
                  {registeredCount ?? 0}{data.max_attendees ? ` / ${data.max_attendees}` : ""}
                </p>
              </div>
            </section>

            {(data.mode === "virtual" || data.mode === "hybrid") && (
              <section className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-indigo-700" />
                  <h3 className="font-bold text-indigo-950">Virtual meeting link</h3>
                </div>
                {showLink && data.virtual_link ? (
                  <a href={data.virtual_link} target="_blank" rel="noopener noreferrer"
                    className="mt-3 inline-flex break-all rounded-xl bg-white px-3 py-2 text-sm font-semibold text-indigo-800 hover:underline">
                    {data.virtual_link}
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-indigo-900">Register for this event to reveal the meeting link.</p>
                )}
              </section>
            )}
          </div>
        </article>

        <aside className="h-fit rounded-3xl border border-brand-100 bg-brand-50 p-6">
          <h2 className="text-lg font-bold text-brand-950">Register</h2>
          <p className="mt-2 text-sm text-brand-900">
            {isRegistered ? "You're going! We'll keep you posted." : "Reserve your spot with one click. You can cancel anytime."}
          </p>
          {user ? (
            <div className="mt-4">
              <RegisterButton eventId={data.id} isRegistered={isRegistered} disabled={!isRegistered && capacityReached} />
              {capacityReached && !isRegistered && (
                <p className="mt-2 text-xs font-semibold text-rose-700">This event is full.</p>
              )}
            </div>
          ) : (
            <Link href="/" className="btn-primary mt-4 inline-flex">Sign in to register</Link>
          )}
          <p className="mt-4 text-xs text-brand-800">Hosted by the community · Posted {new Date(data.created_at).toLocaleDateString()}</p>
        </aside>
      </div>
    </div>
  );
}
