import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, ArrowRight } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { markEmployerNotificationsRead } from "@/app/employer/actions";

export const dynamic = "force-dynamic";

function labelFor(type: string) {
  const map: Record<string, string> = {
    job_application: "New application received",
    job_offer: "Offer activity",
    application_submitted: "Application submitted",
    application_shortlisted: "Candidate shortlisted update",
    application_interviewed: "Interview stage update",
    application_accepted: "Application accepted update",
    application_rejected: "Application rejected update",
  };
  return map[type] ?? type.replace(/_/g, " ");
}

type NotificationRow = {
  id: string;
  type: string;
  is_read: boolean;
  created_at: string;
  actor_id: string | null;
  application_id: string | null;
};

export default async function EmployerNotificationsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/employer/signin?mode=sign-in");

  let notifications: NotificationRow[] = [];

  try {
    const { data } = await supabase
      .from("comm_notifications")
      .select("id, type, is_read, created_at, actor_id, application_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    notifications = (data ?? []) as NotificationRow[];
  } catch {
    /* table optional */
  }

  // Mark read on view
  try {
    await markEmployerNotificationsRead();
  } catch {
    /* ignore */
  }

  const actorIds = [
    ...new Set(notifications.map((n) => n.actor_id).filter(Boolean)),
  ] as string[];
  const actorMap = new Map<
    string,
    { full_name: string | null; username: string | null }
  >();
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

  function detailHref(n: NotificationRow): string | null {
    if (n.application_id) return `/employer/dashboard/applications/${n.application_id}`;
    const actor = n.actor_id ? actorMap.get(n.actor_id) : null;
    if (actor?.username) return `/community/members/${actor.username}`;
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-primary">Notifications</h1>
          <p className="text-secondary">
            Stay on top of new applications, offers, messages and interview activity.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {notifications.length === 0 && (
          <div className="card text-center">
            <p className="text-sm text-secondary">
              No notifications yet. New applications will show up here.
            </p>
            <Link href="/employer/dashboard/applications" className="btn-secondary mt-4 inline-flex">
              Open applications inbox
            </Link>
          </div>
        )}
        {notifications.map((n) => {
          const actor = n.actor_id ? actorMap.get(n.actor_id) : null;
          const actorName = actor?.full_name || actor?.username || "Someone";
          const href = detailHref(n);

          const isApplication = n.type === "job_application";
          const message = isApplication
            ? `${actorName} applied to your job posting`
            : actor
              ? `${actorName} ${labelFor(n.type).toLowerCase()}`
              : "Activity on your employer account";

          const inner = (
            <div
              className={`flex items-start justify-between gap-3 rounded-2xl border p-4 transition ${
                n.is_read
                  ? "border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900"
                  : "border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20"
              }`}
            >
              <div className="min-w-0">
                <p className="font-bold text-primary">{labelFor(n.type)}</p>
                <p className="mt-1 text-sm text-secondary">{message}</p>
                <p className="mt-2 text-xs text-subtle">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
              {href && (
                <span className="mt-1 inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-300">
                  {isApplication ? "View candidate" : "View"} <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          );

          return href ? (
            <Link key={n.id} href={href} className="block">
              {inner}
            </Link>
          ) : (
            <div key={n.id}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
