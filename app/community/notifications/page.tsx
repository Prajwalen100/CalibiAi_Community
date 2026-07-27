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
  job_offer: "💌",
};

const APPLICATION_TYPES = new Set([
  "job_application",
  "application_submitted",
  "application_shortlisted",
  "application_interviewed",
  "application_accepted",
  "application_rejected",
  "job_offer",
]);

type NotificationRow = {
  id: string;
  type: string;
  post_id: string | null;
  actor_id: string | null;
  is_read: boolean;
  created_at: string;
};

function sentenceFor(type: string, actorName: string): string {
  switch (type) {
    case "reply":
      return `${actorName} replied to your post`;
    case "follow":
      return `${actorName} started following you`;
    case "upvote":
      return `${actorName} upvoted your post`;
    case "answer_accepted":
      return `${actorName} accepted your answer`;
    case "challenge_launched":
      return `${actorName} launched a new challenge`;
    case "event_reminder":
      return `${actorName} reminded you about an event`;
    case "new_job":
      return `${actorName} posted a job matching your skills`;
    case "squad_added":
      return `${actorName} added you to a squad`;
    case "event_registration":
      return `${actorName} registered for your event`;
    case "job_application":
      return `${actorName} applied to your job posting`;
    case "application_submitted":
      return `Your application was submitted`;
    case "application_shortlisted":
      return `Your application was shortlisted`;
    case "application_interviewed":
      return `Your application moved to interview`;
    case "application_accepted":
      return `Your application was accepted 🎉`;
    case "application_rejected":
      return `Your application was closed`;
    case "job_offer":
      return `${actorName} sent you a job offer`;
    default:
      return "New activity";
  }
}

export default async function NotificationsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  let notifications: NotificationRow[] = [];

  try {
    const { data } = await supabase
      .from("comm_notifications")
      .select("id, type, post_id, actor_id, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    notifications = (data ?? []) as NotificationRow[];
  } catch {
    /* table might not exist */
  }

  // Resolve actor profiles separately (actor_id references auth.users, not profiles)
  const actorIds = [
    ...new Set(notifications.map((n) => n.actor_id).filter(Boolean)),
  ] as string[];
  const actorMap = new Map<string, { full_name: string | null; username: string | null }>();
  if (actorIds.length > 0) {
    try {
      const { data: actors } = await supabase
        .from("comm_public_profiles")
        .select("user_id, full_name, username")
        .in("user_id", actorIds);
      for (const a of actors ?? []) actorMap.set(a.user_id, a);
    } catch {
      /* profiles optional */
    }
  }

  const unread = notifications.filter((n) => !n.is_read);

  function hrefFor(n: NotificationRow): string | null {
    if (n.post_id) return `/community/post/${n.post_id}`;
    if (APPLICATION_TYPES.has(n.type)) return "/community/jobs/applications";
    if (n.type === "follow") {
      const actor = n.actor_id ? actorMap.get(n.actor_id) : null;
      // Followers should open their public portfolio, not a non-existent
      // community-member route.
      if (actor?.username) return `/p/${actor.username}`;
    }
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">🔔 Notifications</h1>
          <p className="mt-2 text-slate-600">
            {unread.length} unread notification{unread.length !== 1 ? "s" : ""}
          </p>
        </div>
        {unread.length > 0 && <MarkAllReadButton />}
      </div>

      <div className="mt-6 space-y-3">
        {notifications.length > 0 ? (
          notifications.map((n) => {
            const actor = n.actor_id ? actorMap.get(n.actor_id) : null;
            const actorName = actor?.full_name || actor?.username || "Someone";
            const icon = notificationIcons[n.type] ?? "🔔";
            const isRead = n.is_read;
            const href = hrefFor(n);

            const body = (
              <div className={`group flex items-center gap-4 rounded-2xl border p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:hover:border-brand-700 ${
                isRead
                  ? "border-slate-200/80 bg-white/70 dark:border-slate-800 dark:bg-slate-900/50"
                  : "border-brand-200 bg-brand-50/60 dark:border-brand-900/70 dark:bg-brand-950/25"
              }`}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700">
                  {icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-primary">
                    {sentenceFor(n.type, actorName)}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="text-xs text-subtle">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                    {href && (
                      <span className="text-xs font-bold text-brand-700 transition-colors group-hover:text-brand-600 dark:text-brand-300">
                        {n.type === "follow" ? "View profile" : "View activity"} →
                      </span>
                    )}
                  </div>
                </div>
                {!isRead && <span aria-label="Unread" className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500 shadow-[0_0_0_4px_rgba(59,130,246,0.12)]" />}
              </div>
            );

            return href ? (
              <Link key={n.id} href={href} className="block">
                {body}
              </Link>
            ) : (
              <div key={n.id}>{body}</div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <p className="text-4xl">🔔</p>
            <p className="mt-4 font-bold">No notifications yet</p>
            <p className="mt-2 text-sm text-slate-600">
              Start interacting with the community to receive notifications.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
