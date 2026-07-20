import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInButton } from "@/components/sign-in-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
      // If the thenable does not support finally, still clear timeout on resolution
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
      // Ignore during build, offline, or timeout
    }
  }

  // Get unread notification count for logged-in users
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
      // Table might not exist yet or request timed out
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-black tracking-tight text-ink">CalibiAI</Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-ink">{label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <>
              <Link href="/community/notifications" className="relative text-sm font-semibold text-slate-700 hover:text-ink">
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link href="/dashboard" className="text-sm font-semibold text-slate-700 hover:text-ink">Dashboard</Link>
              <form action={async () => {
                "use server";
                const supabase = await createServerSupabaseClient();
                await supabase.auth.signOut();
                redirect("/");
              }}>
                <button type="submit" className="text-sm font-semibold text-rose-600 hover:text-rose-700">Logout</button>
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
