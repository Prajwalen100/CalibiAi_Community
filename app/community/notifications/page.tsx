import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MarkAllReadButton } from "./mark-read-button";

export const dynamic = "force-dynamic";

const notificationIcons: Record<string, string> = {
  reply: "💬",
  follow: "👤",
  upvote: "👍",
  answer_accepted: "✅",
  challenge_launched: "🏆",
  event_reminder: "📅",
  new_job: "💼",
  squad_added: "🤝",
  event_registration: "📅",
  job_application: "📨",
  application_submitted: "📨",
  application_shortlisted: "⭐",
  application_interviewed: "🎯",
  application_accepted: "🎉",
  application_rejected: "🚫",
};

export default async function NotificationsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  let notifications: Array<Record<string, unknown>> = [];

  try {
    const { data } = await supabase
      .from("comm_notifications")
      .select("*, actor:profiles!comm_notifications_actor_id_fkey(full_name, username)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    notifications = (data ?? []) as Array<Record<string, unknown>>;
  } catch { /* table might not exist */ }

  const unread = notifications.filter((n) => !n.is_read);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">🔔 Notifications</h1>
          <p className="mt-2 text-slate-600">{unread.length} unread notification{unread.length !== 1 ? "s" : ""}</p>
        </div>
        {unread.length > 0 && <MarkAllReadButton />}
      </div>

      <div className="mt-6 space-y-2">
        {notifications.length > 0 ? notifications.map((n) => {
          const actor = n.actor as Record<string, string> | null;
          const icon = notificationIcons[(n.type as string) ?? ""] ?? "🔔";
          const isRead = n.is_read as boolean;
          const postLink = n.post_id ? `/community/post/${n.post_id as string}` : null;

          return (
            <div key={n.id as string} className={`flex items-start gap-3 rounded-xl border p-4 transition ${isRead ? "border-slate-100 bg-white" : "border-brand-100 bg-brand-50"}`}>
              <span className="text-xl">{icon}</span>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-semibold">{actor?.full_name ?? "Someone"}</span>{" "}
                  {n.type === "reply" && "replied to your post"}
                  {n.type === "follow" && "started following you"}
                  {n.type === "upvote" && "upvoted your post"}
                  {n.type === "answer_accepted" && "accepted your answer"}
                  {n.type === "challenge_launched" && "launched a new challenge"}
                  {n.type === "event_reminder" && "reminded you about an event"}
                  {n.type === "new_job" && "posted a job matching your skills"}
                  {n.type === "squad_added" && "added you to a squad"}
                  {n.type === "event_registration" && "registered for your event"}
                  {n.type === "job_application" && "applied to your job posting"}
                  {n.type === "application_submitted" && "received your application"}
                  {n.type === "application_shortlisted" && "shortlisted your application"}
                  {n.type === "application_interviewed" && "moved your application to interview"}
                  {n.type === "application_accepted" && "accepted your application 🎉"}
                  {n.type === "application_rejected" && "closed your application"}
                </p>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-xs text-slate-400">{new Date(n.created_at as string).toLocaleString()}</span>
                  {postLink && <Link href={postLink} className="text-xs font-semibold text-brand-700 hover:underline">View →</Link>}
                </div>
              </div>
              {!isRead && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-500" />}
            </div>
          );
        }) : (
          <div className="text-center py-12">
            <p className="text-4xl">🔔</p>
            <p className="mt-4 font-bold">No notifications yet</p>
            <p className="mt-2 text-sm text-slate-600">Start interacting with the community to receive notifications.</p>
          </div>
        )}
      </div>
    </div>
  );
}
