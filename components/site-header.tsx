import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInButton } from "@/components/sign-in-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Bell } from "lucide-react";
import { CompactBrandLogo } from "@/components/brand-logo";
import { getStudentAccess } from "@/lib/auth/student-access";

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

        <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-white/60">
          {navLinks.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="relative transition-colors duration-200 hover:text-white after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-blue-400 after:transition-all after:duration-300 hover:after:w-full"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <>
              {(isEmployer || canAccessStudentArea) && (
                <Link
                  href={isEmployer ? "/employer/dashboard/notifications" : "/community/notifications"}
                  aria-label="Notifications"
                  className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white/70 border border-white/10 transition-all duration-200 hover:bg-white/12 hover:text-white"
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

              <Link
                href={isEmployer ? "/employer/dashboard" : studentDestination}
                className="rounded-full bg-white/8 border border-white/10 px-4 py-2 text-xs font-bold text-white/70 transition-all duration-200 hover:bg-white/12 hover:text-white"
                style={{
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }}
              >
                {isEmployer ? "Employer hub" : canAccessStudentArea ? "Student hub" : "Continue setup"}
              </Link>

              <form
                action={async () => {
                  "use server";
                  const supabase = await createServerSupabaseClient();
                  await supabase.auth.signOut();
                  redirect("/");
                }}
              >
                <button
                  type="submit"
                  className="px-3 py-2 text-xs font-bold text-white/40 transition-colors duration-200 hover:text-rose-400"
                >
                  Logout
                </button>
              </form>
            </>
          ) : (
            <SignInButton />
          )}
        </div>
      </div>
    </header>
  );
}
