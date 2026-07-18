import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInButton } from "@/components/sign-in-button";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const links = [
  ["Programs", "/programs"],
  ["Placements", "/success-stories"],
  ["Blog", "/blog"]
];

export async function SiteHeader() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let user = null;

  if (url && key) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data } = await supabase.auth.getUser();
      user = data?.user ?? null;
    } catch {
      // Ignore during build or offline
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-black tracking-tight text-ink">CalibiAI</Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
          {links.map(([label, href]) => <Link key={href} href={href} className="hover:text-ink">{label}</Link>)}
        </nav>
        <div className="flex items-center gap-4">
          {user ? (
            <>
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
