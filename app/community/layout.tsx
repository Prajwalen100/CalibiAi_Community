import Link from "next/link";
import {
  Home, MessageSquare, Lightbulb, Rocket, Trophy, Calendar,
  Briefcase, Users, BookOpen, GraduationCap, Search, Bell,
  LayoutGrid, Star, Target, ChevronRight,
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { attachCommunityProfiles } from "@/lib/community/public-profiles";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

const communityNav = [
  { label: "Home", href: "/community", icon: Home },
  { label: "Ask AI", href: "/community/ask", icon: Lightbulb },
  { label: "Showcase", href: "/community/showcase", icon: Rocket },
  { label: "Discussions", href: "/community?tab=discussion", icon: MessageSquare },
  { label: "Communities", href: "/community/communities", icon: LayoutGrid },
  { label: "Challenges", href: "/community/challenges", icon: Target },
  { label: "Leaderboard", href: "/community/leaderboard", icon: Trophy },
  { label: "Events", href: "/community/events", icon: Calendar },
  { label: "Jobs", href: "/community/jobs", icon: Briefcase },
  { label: "Team Finder", href: "/community/team-finder", icon: Users },
  { label: "Resources", href: "/community/resources", icon: BookOpen },
  { label: "Mentors", href: "/community/mentors", icon: GraduationCap },
];

type LeaderboardEntry = { user_id: string; xp: number; level: number; profiles: { full_name: string; username: string } | null };
type EventEntry = { id: string; title: string; event_date: string };
type JobEntry = { id: string; title: string; company_name: string };
type ChallengeEntry = { id: string; title: string; challenge_deadline: string };
type JoinedCommunity = { comm_communities: { id: string; slug: string; name: string; emoji: string } | null };

async function getSidebarData() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let leaderboard: LeaderboardEntry[] = [];
  let upcomingEvents: EventEntry[] = [];
  let latestJobs: JobEntry[] = [];
  let activeChallenge: ChallengeEntry[] = [];
  let joinedCommunities: JoinedCommunity[] = [];

  try {
    const [lb, ev, jobs, ch, jc] = await Promise.all([
      supabase.from("comm_xp").select("user_id, xp, level").order("xp", { ascending: false }).limit(5),
      supabase.from("comm_posts").select("id, title, event_date").eq("post_type", "event").gte("event_date", new Date().toISOString()).order("event_date").limit(3),
      supabase.from("comm_jobs").select("id, title, company_name").eq("status", "open").order("created_at", { ascending: false }).limit(3),
      supabase.from("comm_posts").select("id, title, challenge_deadline").eq("post_type", "challenge").gte("challenge_deadline", new Date().toISOString()).order("challenge_deadline").limit(1),
      user ? supabase.from("comm_members").select("comm_communities(id, slug, name, emoji)").eq("user_id", user.id) : { data: [] as JoinedCommunity[] | null },
    ]);

    leaderboard = await attachCommunityProfiles(supabase, (lb.data ?? []) as Array<Record<string, unknown>>) as LeaderboardEntry[];
    upcomingEvents = (ev.data ?? []) as unknown as EventEntry[];
    latestJobs = (jobs.data ?? []) as unknown as JobEntry[];
    activeChallenge = (ch.data ?? []) as unknown as ChallengeEntry[];
    joinedCommunities = ((jc.data ?? []) as unknown as JoinedCommunity[]);
  } catch {
    // Tables might not exist yet
  }

  return { leaderboard, upcomingEvents, latestJobs, activeChallenge, joinedCommunities, user };
}

export default async function CommunityLayout({ children }: { children: ReactNode }) {
  const { leaderboard, upcomingEvents, latestJobs, activeChallenge, joinedCommunities, user } = await getSidebarData();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-ink">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-ink">Community</span>
      </div>

      <div className="flex gap-6 lg:flex-row">
        {/* Left Nav Sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-24 space-y-1">
            {communityNav.map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-ink">
                <Icon className="h-4 w-4" />{label}
              </Link>
            ))}
            <div className="my-3 border-t border-slate-100" />
            <Link href="/community/search" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-ink">
              <Search className="h-4 w-4" />Search
            </Link>
            {user && (
              <Link href="/community/notifications" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-ink">
                <Bell className="h-4 w-4" />Notifications
              </Link>
            )}
          </nav>

          {joinedCommunities.length > 0 && (
            <div className="mt-6">
              <p className="px-3 text-xs font-bold uppercase tracking-wide text-slate-400">Your Communities</p>
              <div className="mt-2 space-y-1">
                {joinedCommunities.map((jc, i) => (
                  <Link key={i} href={`/community/community/${jc.comm_communities?.slug}`} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                    <span>{jc.comm_communities?.emoji}</span>
                    <span className="truncate">{jc.comm_communities?.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>

        <main className="min-w-0 flex-1">{children}</main>

        {/* Right Sidebar */}
        <aside className="hidden w-72 shrink-0 xl:block">
          <div className="sticky top-24 space-y-4">
            {/* Leaderboard */}
            <div className="card">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">🏆 Leaderboard</p>
                <Link href="/community/leaderboard" className="text-xs font-semibold text-brand-700">View all</Link>
              </div>
              <div className="mt-3 space-y-2">
                {leaderboard.length ? leaderboard.map((entry, i) => (
                  <div key={entry.user_id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">{i + 1}</span>
                      <span className="font-medium truncate">{entry.profiles?.full_name ?? "User"}</span>
                    </div>
                    <span className="text-xs font-semibold text-brand-600">{entry.xp} XP</span>
                  </div>
                )) : (
                  <p className="text-xs text-slate-400">No leaderboard data yet.</p>
                )}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="card">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">📅 Upcoming Events</p>
                <Link href="/community/events" className="text-xs font-semibold text-brand-700">View all</Link>
              </div>
              <div className="mt-3 space-y-2">
                {upcomingEvents.length ? upcomingEvents.map((ev) => (
                  <Link key={ev.id} href={`/community/post/${ev.id}`} className="block rounded-lg p-2 text-sm hover:bg-slate-50">
                    <p className="font-medium truncate">{ev.title}</p>
                    <p className="text-xs text-slate-500">{new Date(ev.event_date).toLocaleDateString()}</p>
                  </Link>
                )) : (
                  <p className="text-xs text-slate-400">No upcoming events.</p>
                )}
              </div>
            </div>

            {/* Latest Jobs */}
            <div className="card">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">💼 Jobs</p>
                <Link href="/community/jobs" className="text-xs font-semibold text-brand-700">View all</Link>
              </div>
              <div className="mt-3 space-y-2">
                {latestJobs.length ? latestJobs.map((j) => (
                  <Link key={j.id} href={`/community/jobs/${j.id}`} className="block rounded-lg p-2 text-sm hover:bg-slate-50">
                    <p className="font-medium truncate">{j.title}</p>
                    <p className="text-xs text-slate-500">{j.company_name}</p>
                  </Link>
                )) : (
                  <p className="text-xs text-slate-400">No jobs posted yet.</p>
                )}
              </div>
            </div>

            {/* Active Challenge */}
            {activeChallenge.length > 0 && (
              <div className="card border-brand-200 bg-brand-50/50">
                <p className="text-sm font-bold">🔥 Weekly Challenge</p>
                {activeChallenge.map((ch) => (
                  <Link key={ch.id} href={`/community/post/${ch.id}`} className="mt-2 block">
                    <p className="font-semibold text-brand-700">{ch.title}</p>
                    <p className="text-xs text-brand-600">Ends {new Date(ch.challenge_deadline).toLocaleDateString()}</p>
                  </Link>
                ))}
              </div>
            )}

            {/* Suggested Mentors */}
            <div className="card">
              <p className="text-sm font-bold">⭐ Suggested Mentors</p>
              <p className="mt-2 text-xs text-slate-400">Mentors will appear here once they join.</p>
              <Link href="/community/mentors" className="mt-2 block text-xs font-semibold text-brand-700">Browse mentors →</Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
