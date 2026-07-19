"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Video, MapPin } from "lucide-react";
import { createEvent } from "@/app/community/actions";

export function EventForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"offline" | "virtual" | "hybrid">("offline");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("mode", mode);
    const result = await createEvent(formData);
    if ("error" in result) {
      setError(result.error ?? "Unable to publish this event. Please try again.");
      setLoading(false);
      return;
    }
    router.replace(`/community/events/${result.id}`);
    router.refresh();
  }

  return (
    <div className="mt-6">
      <Link href="/community/events" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to Events
      </Link>

      <form action={handleSubmit} className="mt-6 grid gap-6 rounded-3xl border border-slate-200 p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="title">Event title *</label>
            <input id="title" className="input mt-1" name="title" required minLength={3} placeholder="e.g. RAG Fundamentals Workshop" />
          </div>

          <div>
            <label className="label" htmlFor="event_type">Event type *</label>
            <select id="event_type" className="input mt-1" name="event_type" defaultValue="meetup">
              <option value="workshop">Workshop</option>
              <option value="webinar">Webinar</option>
              <option value="meetup">Meetup</option>
              <option value="hackathon">Hackathon</option>
              <option value="ama">AMA</option>
              <option value="conference">Conference</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="max_attendees">Capacity (optional)</label>
            <input id="max_attendees" className="input mt-1" name="max_attendees" type="number" min={1} max={10000} placeholder="e.g. 50" />
            <p className="mt-1 text-xs text-slate-500">Leave empty for unlimited attendees.</p>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="description">Description *</label>
          <textarea id="description" className="input mt-1" name="description" required minLength={10} rows={5}
            placeholder="What is this event about? Who is it for? What will attendees learn or do?" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="event_date">Start date &amp; time *</label>
            <input id="event_date" className="input mt-1" name="event_date" type="datetime-local" required />
          </div>
          <div>
            <label className="label" htmlFor="end_date">End date &amp; time (optional)</label>
            <input id="end_date" className="input mt-1" name="end_date" type="datetime-local" />
          </div>
        </div>

        <div>
          <label className="label">Event mode *</label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["offline", "virtual", "hybrid"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-2xl border p-4 text-left transition ${mode === m ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300"}`}
              >
                <p className="text-sm font-bold capitalize">
                  {m === "offline" ? <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> Offline</span>
                    : m === "virtual" ? <span className="inline-flex items-center gap-1"><Video className="h-4 w-4" /> Virtual</span>
                    : "Hybrid"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {m === "offline" && "In-person venue"}
                  {m === "virtual" && "Google Meet / Zoom link"}
                  {m === "hybrid" && "Both in-person and online"}
                </p>
              </button>
            ))}
          </div>
        </div>

        {(mode === "offline" || mode === "hybrid") && (
          <div className="grid gap-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">In-person details</p>
            </div>
            <div>
              <label className="label" htmlFor="location">Location / address *</label>
              <input id="location" className="input mt-1" name="location" required placeholder="Venue, street, city" />
            </div>
            <div>
              <label className="label" htmlFor="room">Room / hall (optional)</label>
              <input id="room" className="input mt-1" name="room" placeholder="e.g. Lab 3.02 / Main auditorium" />
            </div>
          </div>
        )}

        {(mode === "virtual" || mode === "hybrid") && (
          <div className="grid gap-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-indigo-800">Virtual details</p>
            <div>
              <label className="label" htmlFor="virtual_link">Google Meet / Zoom / Teams link *</label>
              <input id="virtual_link" className="input mt-1" name="virtual_link" type="url" required placeholder="https://meet.google.com/xxx-xxxx-xxx" />
              <p className="mt-1 text-xs text-slate-600">Paste the meeting URL — attendees will see it once they register.</p>
            </div>
          </div>
        )}

        <div>
          <label className="label" htmlFor="cover_image_url">Cover image URL (optional)</label>
          <input id="cover_image_url" className="input mt-1" name="cover_image_url" type="url" placeholder="https://…" />
        </div>

        {error && <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

        <button className="btn-primary w-full sm:w-auto" type="submit" disabled={loading}>
          {loading ? (
            <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Publishing event…</span>
          ) : "Publish event"}
        </button>
      </form>
    </div>
  );
}
