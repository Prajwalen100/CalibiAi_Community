import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
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

export default async function EmployerNotificationsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/employer/signin?mode=sign-in");

  let notifications: Array<{
    id: string;
    type: string;
    is_read: boolean;
    created_at: string;
    actor_id: string | null;
  }> = [];

  try {
    const { data } = await supabase
      .from("comm_notifications")
      .select("id, type, is_read, created_at, actor_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    notifications = (data ?? []) as typeof notifications;
  } catch {
    /* table optional */
  }

  // Mark read on view
  await markEmployerNotificationsRead();

  const actorIds = [...new Set(notifications.map((n) => n.actor_id).filter(Boolean))] as string[];
  let actorMap = new Map<string, { full_name: string | null; username: string | null }>();
  if (actorIds.length > 0) {
    const { data: actors } = await supabase
      .from("comm_public_profiles")
      .select("user_id, full_name, username")
      .in("user_id", actorIds);
    actorMap = new Map((actors ?? []).map((a) => [a.user_id, a]));
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
            <p className="text-sm text-secondary">No notifications yet. New applications will show up here.</p>
            <Link href="/employer/dashboard/applications" className="btn-secondary mt-4 inline-flex">
              Open applications inbox
            </Link>
          </div>
        )}
        {notifications.map((n) => {
          const actor = n.actor_id ? actorMap.get(n.actor_id) : null;
          return (
            <div
              key={n.id}
              className={`rounded-2xl border p-4 ${
                n.is_read
                  ? "border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900"
                  : "border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20"
              }`}
            >
              <p className="font-bold text-primary">{labelFor(n.type)}</p>
              <p className="mt-1 text-sm text-secondary">
                {actor
                  ? `${actor.full_name || actor.username || "Someone"} triggered this`
                  : "Activity on your employer account"}
              </p>
              <p className="mt-2 text-xs text-subtle">{new Date(n.created_at).toLocaleString()}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
