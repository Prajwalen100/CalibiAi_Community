import Link from "next/link";
import {
  Home, MessageSquare, Lightbulb, Rocket, Trophy, Calendar,
  Briefcase, Users, BookOpen, GraduationCap, Search, Bell,
  LayoutGrid, Star, Target, ChevronRight, Smile,
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { attachCommunityProfiles } from "@/lib/community/public-profiles";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import type { ReactNode } from "react";
import { ScrollReveal, StaggerReveal } from "@/components/scroll-reveal";

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
  { label: "Choose avatar", href: "/community/profile/avatar", icon: Smile },
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
  let currentProfile: { full_name: string | null; username: string | null; avatar_id: number | null } | null = null;

  if (user) {
    try {
      let profileResp = await supabase
        .from("profiles")
        .select("full_name, username, avatar_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profileResp.error && /avatar_id/.test(profileResp.error.message)) {
        profileResp = await supabase
          .from("profiles")
          .select("full_name, username")
          .eq("user_id", user.id)
          .maybeSingle() as unknown as typeof profileResp;
      }
      if (profileResp.data) {
        const raw = profileResp.data as Record<string, unknown>;
        currentProfile = {
          full_name: (raw.full_name as string | null) ?? null,
          username: (raw.username as string | null) ?? null,
          avatar_id: (raw.avatar_id as number | null) ?? null,
        };
      }
    } catch { /* avatar_id column might not exist yet */ }
  }

  try {
    const [lb, ev, jobs, ch, jc] = await Promise.all([
      supabase.from("comm_xp").select("user_id, xp, level").order("xp", { ascending: false }).limit(5),
      supabase.from("comm_events").select("id, title, event_date").gte("event_date", new Date().toISOString()).order("event_date").limit(3),
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

  return { leaderboard, upcomingEvents, latestJobs, activeChallenge, joinedCommunities, user, currentProfile };
}

function NavLink({ label, href, icon: Icon, isActive = false }: { 
  label: string; 
  href: string; 
  icon: React.ComponentType<{ className?: string }>; 
  isActive?: boolean; 
}) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        isActive 
          ? "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 shadow-sm" 
          : "text-secondary hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800/50 dark:hover:text-primary"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

export default async function CommunityLayout({ children }: { children: ReactNode }) {
  const { leaderboard, upcomingEvents, latestJobs, activeChallenge, joinedCommunities, user, currentProfile } = await getSidebarData();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <ScrollReveal direction="down" className="mb-4 flex items-center gap-2 text-sm text-subtle">
        <Link href="/" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-primary">Community</span>
      </ScrollReveal>

      <div className="flex gap-6 lg:flex-row">
        {/* Left Nav Sidebar */}
        <ScrollReveal direction="left" delay={100} className="hidden w-56 shrink-0 lg:block">
          <aside>
            <nav className="sticky top-24 space-y-1 glass-panel-subtle p-3 rounded-2xl">
              <StaggerReveal staggerDelay={50} direction="right" className="space-y-1">
                {communityNav.map(({ label, href, icon: Icon }) => (
                  <NavLink key={href} label={label} href={href} icon={Icon} />
                ))}
              </StaggerReveal>
              <div className="my-3 border-t border-slate-200/60 dark:border-slate-800/60" />
              <StaggerReveal staggerDelay={50} direction="right" className="space-y-1">
                <NavLink label="Search" href="/community/search" icon={Search} />
                {user && <NavLink label="Notifications" href="/community/notifications" icon={Bell} />}
              </StaggerReveal>
            </nav>

            {joinedCommunities.length > 0 && (
              <ScrollReveal direction="left" delay={300} className="mt-6 glass-panel-subtle p-3 rounded-2xl">
                <p className="px-3 text-xs font-bold uppercase tracking-wide text-subtle">Your Communities</p>
                <div className="mt-2 space-y-1">
                  {joinedCommunities.map((jc, i) => (
                    <Link 
                      key={i} 
                      href={`/community/community/${jc.comm_communities?.slug}`} 
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-secondary hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800/50 dark:hover:text-primary transition-all duration-200"
                    >
                      <span>{jc.comm_communities?.emoji}</span>
                      <span className="truncate">{jc.comm_communities?.name}</span>
                    </Link>
                  ))}
                </div>
              </ScrollReveal>
            )}
          </aside>
        </ScrollReveal>

        <main className="min-w-0 flex-1">
          <ScrollReveal direction="up" delay={200}>
            {children}
          </ScrollReveal>
        </main>

        {/* Right Sidebar */}
        <ScrollReveal direction="right" delay={150} className="hidden w-72 shrink-0 xl:block">
          <aside>
            <div className="sticky top-24 space-y-4">
              {/* You */}
              {user && (
                <ScrollReveal direction="right" className="card-interactive glass-panel p-4 transition-all duration-300 hover:border-brand-500/50 hover:shadow-xl">
                  <Link href="/community/profile/avatar" className="flex items-center gap-3 w-full">
                    <ProfileAvatar avatarId={currentProfile?.avatar_id ?? null} size={48} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-primary">{currentProfile?.full_name ?? "Your profile"}</p>
                      <p className="mt-0.5 truncate text-xs text-subtle">
                        {currentProfile?.avatar_id ? "Change your avatar" : "Choose your avatar →"}
                      </p>
                    </div>
                  </Link>
                </ScrollReveal>
              )}

              {/* Leaderboard */}
              <ScrollReveal direction="right" delay={100} className="glass-panel p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-primary">🏆 Leaderboard</p>
                  <Link href="/community/leaderboard" className="text-xs font-semibold text-brand-600 hover:text-brand-500 transition-colors">View all</Link>
                </div>
                <div className="mt-3 space-y-2">
                  {leaderboard.length ? leaderboard.map((entry, i) => (
                    <div key={entry.user_id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">{i + 1}</span>
                        <span className="font-medium truncate text-primary">{entry.profiles?.full_name ?? "User"}</span>
                      </div>
                      <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">{entry.xp} XP</span>
                    </div>
                  )) : (
                    <p className="text-xs text-subtle">No leaderboard data yet.</p>
                  )}
                </div>
              </ScrollReveal>

              {/* Upcoming Events */}
              <ScrollReveal direction="right" delay={200} className="glass-panel p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-primary">📅 Upcoming Events</p>
                  <Link href="/community/events" className="text-xs font-semibold text-brand-600 hover:text-brand-500 transition-colors">View all</Link>
                </div>
                <div className="mt-3 space-y-2">
                  {upcomingEvents.length ? upcomingEvents.map((ev) => (
                    <Link key={ev.id} href={`/community/events/${ev.id}`} className="block rounded-lg p-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                      <p className="font-medium truncate text-primary">{ev.title}</p>
                      <p className="text-xs text-subtle">{new Date(ev.event_date).toLocaleDateString()}</p>
                    </Link>
                  )) : (
                    <p className="text-xs text-subtle">No upcoming events.</p>
                  )}
                </div>
              </ScrollReveal>

              {/* Latest Jobs */}
              <ScrollReveal direction="right" delay={300} className="glass-panel p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-primary">💼 Jobs</p>
                  <Link href="/community/jobs" className="text-xs font-semibold text-brand-600 hover:text-brand-500 transition-colors">View all</Link>
                </div>
                <div className="mt-3 space-y-2">
                  {latestJobs.length ? latestJobs.map((j) => (
                    <Link key={j.id} href={`/community/jobs/${j.id}`} className="block rounded-lg p-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                      <p className="font-medium truncate text-primary">{j.title}</p>
                      <p className="text-xs text-subtle">{j.company_name}</p>
                    </Link>
                  )) : (
                    <p className="text-xs text-subtle">No jobs posted yet.</p>
                  )}
                </div>
              </ScrollReveal>

              {/* Active Challenge */}
              {activeChallenge.length > 0 && (
                <ScrollReveal direction="right" delay={400} className="glass-panel p-4 border-brand-200/50 bg-brand-50/30 dark:border-brand-900/30 dark:bg-brand-950/30">
                  <p className="text-sm font-bold text-brand-700 dark:text-brand-300">🔥 Weekly Challenge</p>
                  {activeChallenge.map((ch) => (
                    <Link key={ch.id} href={`/community/post/${ch.id}`} className="mt-2 block">
                      <p className="font-semibold text-brand-700 dark:text-brand-300">{ch.title}</p>
                      <p className="text-xs text-brand-600 dark:text-brand-400">Ends {new Date(ch.challenge_deadline).toLocaleDateString()}</p>
                    </Link>
                  ))}
                </ScrollReveal>
              )}

              {/* Suggested Mentors */}
              <ScrollReveal direction="right" delay={500} className="glass-panel p-4">
                <p className="text-sm font-bold text-primary">⭐ Suggested Mentors</p>
                <p className="mt-2 text-xs text-subtle">Mentors will appear here once they join.</p>
                <Link href="/community/mentors" className="mt-2 block text-xs font-semibold text-brand-600 hover:text-brand-500 transition-colors">Browse mentors →</Link>
              </ScrollReveal>
            </div>
          </aside>
        </ScrollReveal>
      </div>
    </div>
  );
}
