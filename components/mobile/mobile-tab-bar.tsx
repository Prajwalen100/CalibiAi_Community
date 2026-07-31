"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { isNavItemActive, type MobileNavItem } from "@/lib/navigation/mobile-nav";
import { MOBILE_NAV_ICONS } from "@/components/mobile/nav-icons";
import { cn } from "@/lib/utils";

/**
 * Native-style bottom tab bar, mobile only (`lg:hidden`).
 *
 * Sits above the home indicator via `env(safe-area-inset-bottom)` and adds a
 * matching bottom padding to <body> so page content is never occluded.
 */
export function MobileTabBar({ items }: { items: MobileNavItem[] }) {
  const pathname = usePathname() ?? "";

  // Reserve space for the fixed bar. The class is scoped to below-lg in CSS,
  // so desktop layout is unaffected even while the class is present.
  useEffect(() => {
    document.body.classList.add("has-mobile-tabbar");
    return () => document.body.classList.remove("has-mobile-tabbar");
  }, []);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden dark:border-slate-800/80 dark:bg-slate-950/90"
    >
      <ul className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-1">
        {items.map((item) => {
          const Icon = MOBILE_NAV_ICONS[item.icon];
          const active = isNavItemActive(item, pathname);
          return (
            <li key={item.href} className="flex min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                className={cn(
                  "tap-highlight-none flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                  active ? "text-brand-600 dark:text-brand-400" : "text-slate-500 dark:text-slate-400",
                )}
              >
                <span className="relative flex h-7 w-12 items-center justify-center">
                  {/* Active pill sits behind the glyph — subtle, no layout shift. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-0 rounded-full transition-opacity duration-200",
                      active ? "bg-brand-50 opacity-100 dark:bg-brand-950/60" : "opacity-0",
                    )}
                  />
                  <Icon className={cn("relative h-[22px] w-[22px]", active && "stroke-[2.5]")} />
                </span>
                <span className="max-w-full truncate text-[11px] font-semibold leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
