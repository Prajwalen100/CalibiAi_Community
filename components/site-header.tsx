import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInButton } from "@/components/sign-in-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ShieldCheck, Bell } from "lucide-react";

const links = [
  ["Academy", "/academy"],
  ["Community", "/community"],
  ["Placements", "/placements"],
  ["Blog", "/blog"],
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

  if (url && key) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data } = await withTimeout(supabase.auth.getUser(), 2000);
      user = data?.user ?? null;
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

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl transition-all dark:border-slate-800/80 dark:bg-slate-950/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-2 text-lg font-black tracking-tight text-slate-900 dark:text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 via-indigo-600 to-purple-600 text-white shadow-md transition-transform duration-300 group-hover:scale-105">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="bg-gradient-to-r from-slate-900 via-brand-600 to-indigo-600 bg-clip-text text-transparent dark:from-white dark:via-brand-300 dark:to-indigo-300">
            CalibiAI
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 lg:flex dark:text-slate-300">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="relative transition-colors hover:text-brand-600 dark:hover:text-brand-400"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Actions & Controls */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <>
              <Link
                href="/community/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-brand-500 hover:text-brand-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              <Link
                href="/dashboard"
                className="rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-xs font-bold text-slate-800 shadow-sm transition hover:border-brand-500 hover:text-brand-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-brand-400"
              >
                Dashboard
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
                  className="px-3 py-2 text-xs font-bold text-rose-600 transition hover:text-rose-700 dark:text-rose-400"
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
