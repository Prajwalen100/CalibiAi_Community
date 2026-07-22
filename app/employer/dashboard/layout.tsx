import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Inbox,
  Bell,
  Building2,
  Plus,
  LogOut,
  Users,
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CompactBrandLogo } from "@/components/brand-logo";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/employer/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/employer/dashboard/jobs", label: "My jobs", icon: Briefcase },
  { href: "/employer/dashboard/applications", label: "Applications inbox", icon: Inbox },
  { href: "/employer/dashboard/candidates", label: "Candidates", icon: Users },
  { href: "/employer/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/employer/dashboard/company", label: "Company profile", icon: Building2 },
  { href: "/employer/dashboard/post", label: "Post a job", icon: Plus },
] as const;

export default async function EmployerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/employer/signin?mode=sign-in");

  const [{ data: profile }, { data: employer }] = await Promise.all([
    supabase.from("profiles").select("role, full_name").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("employer_profiles")
      .select("company_name, company_logo_url, onboarding_complete")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  // If they're a student who wandered here, bounce to student dashboard
  if (profile?.role && profile.role !== "employer" && profile.role !== "admin") {
    redirect("/dashboard");
  }

  if (!employer?.onboarding_complete) {
    redirect("/employer/onboarding");
  }

  let unread = 0;
  try {
    const { count } = await supabase
      .from("comm_notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    unread = count ?? 0;
  } catch {
    /* optional */
  }

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/employer/dashboard">
              <CompactBrandLogo />
            </Link>
            <span className="hidden rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 sm:inline dark:bg-indigo-950/50 dark:text-indigo-300">
              Employer
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-primary">{employer.company_name}</p>
              <p className="text-xs text-subtle">{profile?.full_name || user.email}</p>
            </div>
            {employer.company_logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={employer.company_logo_url}
                alt=""
                className="h-9 w-9 rounded-full border border-slate-200 object-cover dark:border-slate-700"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {employer.company_name?.charAt(0)?.toUpperCase() ?? "E"}
              </div>
            )}
            <form
              action={async () => {
                "use server";
                const sb = await createServerSupabaseClient();
                await sb.auth.signOut();
                redirect("/");
              }}
            >
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-secondary hover:border-rose-300 hover:text-rose-600 dark:border-slate-700"
              >
                <LogOut className="h-3.5 w-3.5" /> Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:px-8 lg:py-8">
        <aside className="h-fit lg:sticky lg:top-20">
          <nav className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-transparent px-3 py-2.5 text-sm font-semibold text-secondary transition hover:border-slate-200 hover:bg-white hover:text-primary dark:hover:border-slate-800 dark:hover:bg-slate-900"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.href.includes("notifications") && unread > 0 && (
                    <span className="ml-auto rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 hidden rounded-2xl border border-brand-100 bg-brand-50 p-4 text-xs text-brand-900 dark:border-brand-900/40 dark:bg-brand-950/30 dark:text-brand-200 lg:block">
            <p className="font-bold">Jobs go live for students</p>
            <p className="mt-1">
              Every posting appears under Community → Jobs and Opportunity for students to apply.
            </p>
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
