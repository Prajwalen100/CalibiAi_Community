"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  Bell, BriefcaseBusiness, CheckCheck, ChevronRight, Heart,
  MessageCircle, Sparkles, UserPlus, X,
} from "lucide-react";
import { markNotificationsRead } from "@/app/community/actions";

type Notification = {
  id: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  actorName: string;
  href: string | null;
};

const contentFor = (type: string, actor: string) => {
  const copy: Record<string, { title: string; detail: string; icon: "like" | "comment" | "job" | "offer" | "person" | "default" }> = {
    upvote: { title: `${actor} upvoted your post`, detail: "Your contribution is gaining momentum.", icon: "like" },
    reply: { title: `${actor} commented on your post`, detail: "Join the conversation.", icon: "comment" },
    follow: { title: `${actor} started following you`, detail: "Your community is growing.", icon: "person" },
    answer_accepted: { title: `${actor} accepted your answer`, detail: "Great work helping the community!", icon: "like" },
    job_application: { title: `${actor} applied for your job`, detail: "A new candidate is ready for review.", icon: "job" },
    application_submitted: { title: "Your application was submitted", detail: "We'll keep you posted on the next steps.", icon: "job" },
    application_shortlisted: { title: "You have been shortlisted", detail: "Your application caught their attention.", icon: "offer" },
    application_interviewed: { title: "Your application moved to interview", detail: "Get ready to make a great impression.", icon: "offer" },
    application_accepted: { title: "Your application was accepted", detail: "Congratulations on the great news!", icon: "offer" },
    application_rejected: { title: "Application update", detail: "The employer has shared an outcome.", icon: "job" },
    job_offer: { title: "You received a job offer", detail: "A new opportunity is waiting for you.", icon: "offer" },
    offer_accepted: { title: `${actor} accepted your offer`, detail: "Your candidate has accepted the offer.", icon: "offer" },
    offer_declined: { title: `${actor} declined your offer`, detail: "Review your hiring pipeline for details.", icon: "job" },
    squad_added: { title: `${actor} added you to a squad`, detail: "Your new team is ready to collaborate.", icon: "person" },
    event_registration: { title: `${actor} registered for your event`, detail: "A new attendee has joined.", icon: "default" },
    new_job: { title: `${actor} posted a job for you`, detail: "This role matches your skills.", icon: "job" },
  };
  return copy[type] ?? { title: `${actor} sent you an update`, detail: "There is something new waiting for you.", icon: "default" as const };
};

function Icon({ kind }: { kind: ReturnType<typeof contentFor>["icon"] }) {
  const common = "h-4 w-4";
  if (kind === "like") return <Heart className={`${common} fill-current`} />;
  if (kind === "comment") return <MessageCircle className={common} />;
  if (kind === "job") return <BriefcaseBusiness className={common} />;
  if (kind === "offer") return <Sparkles className={common} />;
  if (kind === "person") return <UserPlus className={common} />;
  return <Bell className={common} />;
}

function timeAgo(date: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

export function NotificationPopover({ notifications: initial, historyHref = "/community/notifications" }: { notifications: Notification[]; historyHref?: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initial);
  const [pending, startTransition] = useTransition();
  const root = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, []);

  const markAllRead = () => startTransition(async () => {
    await markNotificationsRead();
    setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
  });

  return <div ref={root} className="relative">
    <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="dialog" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-600 shadow-sm transition-all duration-200 hover:bg-white hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-400/50 dark:border-white/10 dark:bg-white/8 dark:text-white/70 dark:hover:bg-white/12 dark:hover:text-white">
      <Bell className="h-4 w-4" />
      {unread > 0 && <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500 shadow-sm dark:border-slate-950"><span className="absolute inset-0 rounded-full bg-rose-400 animate-ping" /></span>}
    </button>

    {open && <section role="dialog" aria-label="Notifications" className="absolute right-0 top-[calc(100%+0.8rem)] z-[70] w-[min(25rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-slate-950">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/10">
        <div><h2 className="text-base font-extrabold tracking-tight text-slate-950 dark:text-white">Notifications</h2><p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{unread ? `${unread} new update${unread === 1 ? "" : "s"}` : "You're all caught up"}</p></div>
        <div className="flex items-center gap-1">
          {unread > 0 && <button type="button" disabled={pending} onClick={markAllRead} className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-50 disabled:opacity-60 dark:text-blue-300 dark:hover:bg-blue-500/10"><CheckCheck className="h-3.5 w-3.5" />{pending ? "Updating…" : "Mark all read"}</button>}
          <button type="button" onClick={() => setOpen(false)} aria-label="Close notifications" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"><X className="h-4 w-4" /></button>
        </div>
      </header>
      <div className="max-h-[min(31rem,calc(100vh-9rem))] overflow-y-auto p-2">
        {notifications.length ? notifications.map((notification) => {
          const item = contentFor(notification.type, notification.actorName);
          const body = <><span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${item.icon === "like" ? "bg-rose-50 text-rose-500 dark:bg-rose-500/15" : item.icon === "job" ? "bg-amber-50 text-amber-600 dark:bg-amber-500/15" : "bg-blue-50 text-blue-600 dark:bg-blue-500/15"}`}><Icon kind={item.icon} /></span><span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-2"><span className="text-sm font-bold leading-5 text-slate-800 dark:text-slate-100">{item.title}</span>{!notification.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}</span><span className="mt-0.5 block text-xs leading-5 text-slate-500 dark:text-slate-400">{item.detail}</span><span className="mt-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">{timeAgo(notification.createdAt)}</span></span></>;
          const classes = `group flex gap-3 rounded-2xl p-3 transition ${notification.isRead ? "hover:bg-slate-50 dark:hover:bg-white/5" : "bg-blue-50/70 hover:bg-blue-50 dark:bg-blue-500/10 dark:hover:bg-blue-500/15"}`;
          return notification.href ? <Link onClick={() => setOpen(false)} href={notification.href} className={classes} key={notification.id}>{body}</Link> : <div className={classes} key={notification.id}>{body}</div>;
        }) : <div className="px-5 py-12 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/15"><Bell className="h-5 w-5" /></span><p className="mt-4 text-sm font-bold text-slate-800 dark:text-white">No notifications yet</p><p className="mt-1 text-xs leading-5 text-slate-500">Likes, comments, job activity, and offers will appear here.</p></div>}
      </div>
      <Link onClick={() => setOpen(false)} href={historyHref} className="flex items-center justify-center gap-1 border-t border-slate-100 py-3 text-xs font-extrabold text-blue-700 transition hover:bg-blue-50 dark:border-white/10 dark:text-blue-300 dark:hover:bg-blue-500/10">View notification history <ChevronRight className="h-3.5 w-3.5" /></Link>
    </section>}
  </div>;
}
