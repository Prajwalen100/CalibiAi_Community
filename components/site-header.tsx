import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInButton } from "@/components/sign-in-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Bell } from "lucide-react";
import { ScrollReveal } from "@/components/scroll-reveal";
import { CompactBrandLogo } from "@/components/brand-logo";

const publicLinks = [
  ["Story", "/#story"],
  ["Testimonials", "/#testimonials"],
  ["Get Started", "/#motto"],
] as const;

const studentLinks = [
  ["Academy", "/academy"],
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

  if (url && key) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data } = await withTimeout(supabase.auth.getUser(), 2000);
      user = data?.user ?? null;
      if (user) {
        const { data: profile } = await withTimeout(
          supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle(),
          2000
        );
        isEmployer = profile?.role === "employer";
      }
    } catch {
      // Ignore during build or timeout
    }
  }

  let unreadCount = 0;
  if (user && url && key) {
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
      // Ignore missing notifications table or timeout
    }
  }

  const navLinks = !user
    ? publicLinks
    : isEmployer
      ? employerLinks
      : studentLinks;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/70 backdrop-blur-2xl transition-all duration-300 dark:border-slate-800/80 dark:bg-slate-950/80 glass-panel-subtle">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2">
          <CompactBrandLogo />
        </Link>

        <ScrollReveal direction="down" delay={100} className="hidden lg:flex">
          <nav className="flex items-center gap-6 text-sm font-semibold text-secondary">
            {navLinks.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="relative transition-colors duration-200 hover:text-brand-600 dark:hover:text-brand-400 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-brand-500 after:transition-all after:duration-300 hover:after:w-full dark:after:bg-brand-400"
              >
                {label}
              </Link>
            ))}
          </nav>
        </ScrollReveal>

        <ScrollReveal direction="down" delay={200} className="flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <>
              <Link
                href={isEmployer ? "/employer/dashboard/notifications" : "/community/notifications"}
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 backdrop-blur-md text-secondary shadow-sm transition-all duration-200 hover:border-brand-500 hover:text-brand-600 hover:bg-white/90 dark:border-slate-800/80 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-brand-400 dark:hover:text-brand-400"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-pulse-soft">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              <Link
                href={isEmployer ? "/employer/dashboard" : "/dashboard"}
                className="rounded-full border border-slate-200/80 bg-white/80 backdrop-blur-md px-4 py-2 text-xs font-bold text-secondary shadow-sm transition-all duration-200 hover:border-brand-500 hover:text-brand-600 hover:bg-white/90 dark:border-slate-800/80 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-brand-400"
              >
                {isEmployer ? "Employer hub" : "Student hub"}
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
                  className="px-3 py-2 text-xs font-bold text-danger transition-colors duration-200 hover:text-rose-700 dark:hover:text-rose-300"
                >
                  Logout
                </button>
              </form>
            </>
          ) : (
            <SignInButton />
          )}
        </ScrollReveal>
      </div>
    </header>
  );
}
