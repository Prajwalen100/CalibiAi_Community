import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EventForm } from "./event-form";

export const dynamic = "force-dynamic";

export default async function CreateEventPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return (
    <div>
      <h1 className="text-2xl font-black">📅 Create an event</h1>
      <p className="mt-2 text-slate-600">Add every detail attendees need: date &amp; time, room / location, virtual meeting link, capacity, and description.</p>
      <EventForm />
    </div>
  );
}
