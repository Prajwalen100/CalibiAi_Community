import Link from "next/link";
import { SignInButton } from "@/components/sign-in-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NotificationPopover } from "@/components/notification-popover";
import { CompactBrandLogo } from "@/components/brand-logo";
import { getStudentAccess } from "@/lib/auth/student-access";
import { ProfileMenu } from "@/components/profile-menu";
import { NavSearch } from "@/components/nav-search";
import { signOut } from "@/app/auth-actions";
import { MobileTopBar } from "@/components/mobile/mobile-top-bar";
import { MobileTabBar } from "@/components/mobile/mobile-tab-bar";
import {
  EMPLOYER_TAB_ITEMS,
  PUBLIC_MENU_ITEMS,
  STUDENT_MENU_ITEMS,
  STUDENT_TAB_ITEMS,
  type MobileNavItem,
} from "@/lib/navigation/mobile-nav";

const publicLinks = [
  ["How It Works", "/#how-it-works"],
  ["Testimonials", "/#testimonials"],
] as const;

const studentLinks = [
  ["Learning Hub", "/learning-hub"],
  ["Community", "/community"],
  ["Network", "/network"],
  ["Blog", "/blog"],
] as const;

const employerLinks = [
  ["Dashboard", "/employer/dashboard"],
  ["Post a job", "/employer/dashboard/post"],
  ["Applications", "/employer/dashboard/applications"],
  ["Candidates", "/employer/dashboard/candidates"],
] as const;

async function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    const id = setTimeout(() => reject(new Error("Supabase request timed out")), ms);
    if (typeof (promise as Promise<T>).finally === "function") {
      void (promise as Promise<T>).finally(() => clearTimeout(id));
    } else {
      void Promise.resolve(promise).finally(() => clearTimeout(id));
    }
  });
  return await Promise.race([Promise.resolve(promise), timeout]);
}

export async function SiteHeader() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let user = null;
  let isEmployer = false;
  let canAccessStudentArea = false;
  let studentDestination: "/onboarding" | "/assessment" | "/roadmap/assign" | "/dashboard" = "/onboarding";
  let profile: { full_name: string | null; username: string | null; avatar_id: number | null; avatar_url: string | null } | null = null;

  if (url && key) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data } = await withTimeout(supabase.auth.getUser(), 2000);
      user = data?.user ?? null;
      if (user) {
        const access = await withTimeout(getStudentAccess(supabase, user.id), 2500);
        isEmployer = access.isEmployer;
        canAccessStudentArea = access.canAccessStudentArea;
        studentDestination = access.nextPath;

        // This query is deliberately optional so a missing avatar migration never
        // prevents the navigation from rendering.
        const profileResult = await supabase
          .from("profiles")
          .select("full_name, username, avatar_id, avatar_url")
          .eq("user_id", user.id)
          .maybeSingle();
        if (profileResult.data) {
          profile = profileResult.data;
        } else if (profileResult.error && /avatar_(id|url)/.test(profileResult.error.message)) {
          const fallback = await supabase
            .from("profiles")
            .select("full_name, username")
            .eq("user_id", user.id)
            .maybeSingle();
          if (fallback.data) {
            profile = { ...fallback.data, avatar_id: null, avatar_url: null };
          }
        }
      }
    } catch {
      // Fail closed
    }
  }

  type HeaderNotification = { id: string; type: string; post_id: string | null; actor_id: string | null; is_read: boolean; created_at: string };
  let headerNotifications: HeaderNotification[] = [];
  const actorNames = new Map<string, string>();
  if (user && (isEmployer || canAccessStudentArea) && url && key) {
    try {
      const supabase = await createServerSupabaseClient();
      const result = await withTimeout(
        supabase
          .from("comm_notifications")
          .select("id, type, post_id, actor_id, is_read, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(12),
        2000
      );
      headerNotifications = ((result as { data?: HeaderNotification[] }).data ?? []);
      const actorIds = [...new Set(headerNotifications.map((item) => item.actor_id).filter(Boolean))] as string[];
      if (actorIds.length) {
        const actors = await withTimeout(supabase.from("profiles").select("user_id, full_name, username").in("user_id", actorIds), 1500);
        for (const actor of ((actors as { data?: { user_id: string; full_name: string | null; username: string | null }[] }).data ?? [])) {
          actorNames.set(actor.user_id, actor.full_name || actor.username || "Someone");
        }
      }
    } catch {
      // Notifications are optional; never let them block the header.
    }
  }

  const notificationHref = (notification: HeaderNotification) => {
    if (["job_application", "application_submitted", "application_shortlisted", "application_interviewed", "application_accepted", "application_rejected", "job_offer", "offer_accepted", "offer_declined"].includes(notification.type)) return isEmployer ? "/employer/dashboard/applications" : "/community/jobs";
    if (notification.post_id) return `/community/post/${notification.post_id}`;
    return null;
  };
  const popoverNotifications = headerNotifications.map((notification) => ({
    id: notification.id, type: notification.type, isRead: notification.is_read, createdAt: notification.created_at,
    actorName: notification.actor_id ? actorNames.get(notification.actor_id) || "Someone" : "CalibiAI",
    href: notificationHref(notification),
  }));

  const navLinks = !user
    ? publicLinks
    : isEmployer
      ? employerLinks
      : canAccessStudentArea
        ? studentLinks
        : [];

  // ── Mobile chrome inputs ────────────────────────────────────────────────
  // Derived from the same server-side data the desktop header already loaded,
  // so the mobile nav costs zero extra queries.
  const profileHref = profile?.username
    ? `/p/${profile.username}`
    : isEmployer
      ? "/employer/dashboard"
      : studentDestination;

  // The tab bar's "Profile" tab needs a real destination; swap the placeholder
  // href for the resolved profile route.
  const studentTabs: MobileNavItem[] = STUDENT_TAB_ITEMS.map((item) =>
    item.label === "Profile" ? { ...item, href: profileHref } : item,
  );

  const showMobileTabBar = Boolean(user) && (isEmployer || canAccessStudentArea);
  const mobileTabs = isEmployer ? EMPLOYER_TAB_ITEMS : studentTabs;
  const mobilePrimaryItems = showMobileTabBar ? mobileTabs : user ? [] : PUBLIC_MENU_ITEMS;
  const mobileSecondaryItems = !user ? [] : isEmployer ? [] : canAccessStudentArea ? STUDENT_MENU_ITEMS : [];
  const unreadCount = popoverNotifications.filter((notification) => !notification.isRead).length;

  return (
    <header className="sticky top-0 z-50 glass-panel-subtle transition-all duration-300">
      {/* Mobile chrome (below lg). The desktop row below is untouched. */}
      <div className="px-4 py-2 sm:px-6 lg:hidden">
        <MobileTopBar
          homeHref={!user ? "/" : isEmployer ? "/employer/dashboard" : studentDestination}
          primaryItems={mobilePrimaryItems}
          secondaryItems={mobileSecondaryItems}
          isAuthenticated={Boolean(user)}
          showNotifications={Boolean(user) && (isEmployer || canAccessStudentArea)}
          unreadCount={unreadCount}
          notificationsHref={isEmployer ? "/employer/dashboard/notifications" : "/community/notifications"}
          fullName={profile?.full_name}
          username={profile?.username}
          avatarId={profile?.avatar_id}
          avatarUrl={profile?.avatar_url}
          profileHref={profileHref}
          signOut={signOut}
        />
      </div>

      {showMobileTabBar && <MobileTabBar items={mobileTabs} />}

      <div className="mx-auto hidden max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:flex lg:px-8">
        <Link
          href={!user ? "/" : isEmployer ? "/employer/dashboard" : studentDestination}
          className="group flex items-center gap-2"
        >
          <CompactBrandLogo />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 dark:text-white/60 lg:flex">
          {navLinks.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="relative transition-colors duration-200 hover:text-slate-950 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-blue-500 after:transition-all after:duration-300 hover:after:w-full dark:hover:text-white dark:after:bg-blue-400"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user && !isEmployer && canAccessStudentArea && <NavSearch />}
          <ThemeToggle />

          {user ? (
            <>
              {(isEmployer || canAccessStudentArea) && (
                <NotificationPopover notifications={popoverNotifications} />
              )}

              {/* Student navigation already includes Learning Hub. Keep the
                  employer workspace shortcut exclusive to employer accounts. */}
              {isEmployer && (
                <Link
                  href="/employer/dashboard"
                  className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all duration-200 hover:bg-white hover:text-slate-950 dark:border-white/10 dark:bg-white/8 dark:text-white/70 dark:hover:bg-white/12 dark:hover:text-white"
                  style={{
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                >
                  Employer hub
                </Link>
              )}

              <ProfileMenu
                fullName={profile?.full_name}
                username={profile?.username}
                avatarId={profile?.avatar_id}
                avatarUrl={profile?.avatar_url}
                profileHref={profileHref}
                signOut={signOut}
              />
            </>
          ) : (
            <SignInButton />
          )}
        </div>
      </div>
    </header>
  );
}
