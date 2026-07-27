import Link from "next/link";
import { SignInButton } from "@/components/sign-in-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Bell, Search } from "lucide-react";
import { CompactBrandLogo } from "@/components/brand-logo";
import { getStudentAccess } from "@/lib/auth/student-access";
import { ProfileMenu } from "@/components/profile-menu";
import { signOut } from "@/app/auth-actions";

const publicLinks = [
  ["How It Works", "/#how-it-works"],
  ["Testimonials", "/#testimonials"],
] as const;

const studentLinks = [
  ["Learning Hub", "/learning-hub"],
  ["Community", "/community"],
  ["Opportunity", "/placements"],
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

  let unreadCount = 0;
  if (user && (isEmployer || canAccessStudentArea) && url && key) {
    try {
      const supabase = await createServerSupabaseClient();
      const result = await withTimeout(
        supabase
          .from("comm_notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false)
          .then((data) => data),
        2000
      );
      unreadCount = (result as { count?: number | null }).count ?? 0;
    } catch {
      // Ignore
    }
  }

  const navLinks = !user
    ? publicLinks
    : isEmployer
      ? employerLinks
      : canAccessStudentArea
        ? studentLinks
        : [];

  return (
    <header className="sticky top-0 z-50 glass-panel-subtle transition-all duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
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
          {user && !isEmployer && canAccessStudentArea && (
            <Link
              href="/community/search"
              aria-label="Search community"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-600 shadow-sm transition-all duration-200 hover:bg-white hover:text-brand-600 dark:border-white/10 dark:bg-white/8 dark:text-white/70 dark:hover:bg-white/12 dark:hover:text-white"
              style={{
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
            >
              <Search className="h-4 w-4" />
            </Link>
          )}
          <ThemeToggle />

          {user ? (
            <>
              {(isEmployer || canAccessStudentArea) && (
                <Link
                  href={isEmployer ? "/employer/dashboard/notifications" : "/community/notifications"}
                  aria-label="Notifications"
                  className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-600 shadow-sm transition-all duration-200 hover:bg-white hover:text-slate-950 dark:border-white/10 dark:bg-white/8 dark:text-white/70 dark:hover:bg-white/12 dark:hover:text-white"
                  style={{
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
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
                profileHref={profile?.username ? `/p/${profile.username}` : (isEmployer ? "/employer/dashboard" : studentDestination)}
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
