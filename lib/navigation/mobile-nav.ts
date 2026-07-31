/**
 * Single source of truth for the mobile navigation.
 *
 * The bottom tab bar and the hamburger sheet both read from here so the two
 * can never drift apart, and so a link only ever needs adding in one place.
 *
 * IMPORTANT: items carry an icon *name*, never an icon component. This module
 * is imported by the server-rendered `SiteHeader`, and React cannot serialize
 * a component across the server/client boundary. The client components resolve
 * the name to a Lucide icon via `MOBILE_NAV_ICONS`.
 */
export type MobileNavIconName =
  | "home"
  | "book"
  | "users"
  | "globe"
  | "user"
  | "dashboard"
  | "news"
  | "briefcase"
  | "settings"
  | "support";

export type MobileNavItem = {
  label: string;
  href: string;
  icon: MobileNavIconName;
  /** Marks the tab active for any nested route under this prefix. */
  matchPrefix?: string;
  /** Exact-match only. Needed for `/` and other routes that prefix many others. */
  exact?: boolean;
};

/** The 5 primary student destinations, shown in the bottom tab bar. */
export const STUDENT_TAB_ITEMS: MobileNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "home", matchPrefix: "/dashboard" },
  { label: "Learning", href: "/learning-hub", icon: "book", matchPrefix: "/learning-hub" },
  { label: "Community", href: "/community", icon: "users", matchPrefix: "/community" },
  { label: "Network", href: "/network", icon: "globe", matchPrefix: "/network" },
  { label: "Profile", href: "/profile", icon: "user", matchPrefix: "/p/" },
];

/**
 * Secondary destinations, reachable only from the hamburger sheet.
 * Primary items are intentionally excluded — the tab bar already covers them.
 */
export const STUDENT_MENU_ITEMS: MobileNavItem[] = [
  { label: "Roadmap", href: "/roadmap", icon: "dashboard", matchPrefix: "/roadmap" },
  { label: "Blog", href: "/blog", icon: "news", matchPrefix: "/blog" },
  { label: "Jobs", href: "/community/jobs", icon: "briefcase", matchPrefix: "/community/jobs" },
  { label: "Settings", href: "/community/profile/avatar", icon: "settings" },
  { label: "Support", href: "mailto:help@calibiai.com", icon: "support" },
];

/** Employer bottom-tab destinations. */
export const EMPLOYER_TAB_ITEMS: MobileNavItem[] = [
  { label: "Dashboard", href: "/employer/dashboard", icon: "home", exact: true },
  { label: "Jobs", href: "/employer/dashboard/jobs", icon: "briefcase", matchPrefix: "/employer/dashboard/jobs" },
  { label: "Post", href: "/employer/dashboard/post", icon: "dashboard", matchPrefix: "/employer/dashboard/post" },
  {
    label: "Applicants",
    href: "/employer/dashboard/applications",
    icon: "users",
    matchPrefix: "/employer/dashboard/applications",
  },
  { label: "Company", href: "/employer/dashboard/company", icon: "user", matchPrefix: "/employer/dashboard/company" },
];

/** Public (signed-out) menu items. */
export const PUBLIC_MENU_ITEMS: MobileNavItem[] = [
  { label: "Home", href: "/", icon: "home", exact: true },
  { label: "How It Works", href: "/#how-it-works", icon: "dashboard" },
  { label: "Testimonials", href: "/#testimonials", icon: "users" },
  { label: "Blog", href: "/blog", icon: "news", matchPrefix: "/blog" },
];

/** Resolves whether a nav item should render in its active state. */
export function isNavItemActive(item: MobileNavItem, pathname: string): boolean {
  if (item.href.startsWith("mailto:")) return false;
  const target = item.href.split("?")[0].split("#")[0];
  if (item.exact) return pathname === target;
  if (item.matchPrefix) {
    return pathname === item.matchPrefix || pathname.startsWith(`${item.matchPrefix}/`);
  }
  return pathname === target;
}
