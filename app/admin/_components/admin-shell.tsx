import Link from "next/link";
import {
  Download,
  FileText,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AdminSignOutButton } from "./sign-out-button";

export type AdminNavKey = "overview" | "blog" | "students" | "content" | "system";

type NavItem = {
  key: AdminNavKey;
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

export const ADMIN_NAV: NavItem[] = [
  {
    key: "blog",
    label: "Blog CMS",
    href: "/admin/blog",
    description: "Write and publish to the Blog tab",
    icon: FileText,
  },
  {
    key: "students",
    label: "Student Data",
    href: "/admin/students",
    description: "Filter learners and download CSV",
    icon: Users,
  },
];

export function AdminShell({
  active,
  eyebrow,
  title,
  description,
  actions,
  adminEmail,
  children,
}: {
  active: AdminNavKey;
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  adminEmail: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:sticky lg:top-0 lg:h-screen lg:w-[272px] lg:shrink-0 lg:py-5 lg:pl-5">
        <div className="admin-glass flex h-full flex-col gap-4 p-4 max-lg:rounded-none max-lg:border-x-0 max-lg:border-t-0">
          <Link href="/admin/blog" className="flex items-center gap-3 rounded-2xl p-1.5 transition hover:bg-white/60">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-indigo-500 to-violet-500 text-white shadow-lg">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black admin-title">CalibiAI Admin</p>
              <p className="truncate text-[11px] font-semibold admin-faint">Control room</p>
            </div>
          </Link>

          <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0 admin-scroll">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  data-active={item.key === active}
                  className="admin-nav-link min-w-[190px] lg:min-w-0"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      item.key === active
                        ? "bg-gradient-to-br from-sky-500 to-violet-500 text-white shadow"
                        : "bg-white/75 text-slate-500"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{item.label}</span>
                    <span className="hidden truncate text-[11px] leading-4 admin-faint lg:block">
                      {item.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto hidden lg:block">
            <Link
              href="/admin/students"
              className="admin-glass-soft flex items-center gap-3 p-3 transition hover:-translate-y-0.5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Download className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-xs font-black admin-title">Export students</span>
                <span className="block text-[11px] admin-faint">Filtered CSV download</span>
              </span>
            </Link>

            <div className="admin-glass-soft mt-3 p-3">
              <p className="admin-eyebrow">Signed in</p>
              <p className="mt-1 truncate text-xs font-bold admin-muted">{adminEmail}</p>
              <div className="mt-2.5">
                <AdminSignOutButton />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:py-5 lg:pr-5">
        <header className="admin-glass mb-5 flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="admin-eyebrow">{eyebrow}</p>
            <h1 className="mt-1 text-2xl font-black admin-title sm:text-3xl">{title}</h1>
            <p className="mt-1.5 max-w-3xl text-sm leading-6 admin-muted">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            <div className="lg:hidden">
              <AdminSignOutButton />
            </div>
          </div>
        </header>

        <div className="space-y-5 pb-10">{children}</div>
      </main>
    </div>
  );
}
