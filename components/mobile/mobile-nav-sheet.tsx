"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu } from "lucide-react";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { CompactBrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { isNavItemActive, type MobileNavItem } from "@/lib/navigation/mobile-nav";
import { MOBILE_NAV_ICONS } from "@/components/mobile/nav-icons";
import { cn } from "@/lib/utils";

type MobileNavSheetProps = {
  /** Primary destinations, mirrored from the bottom tab bar. */
  primaryItems: MobileNavItem[];
  /** Secondary destinations (Settings, Blog, Support, …). */
  secondaryItems: MobileNavItem[];
  fullName?: string | null;
  username?: string | null;
  avatarId?: number | null;
  avatarUrl?: string | null;
  profileHref?: string | null;
  isAuthenticated: boolean;
  signOut?: () => Promise<void>;
};

/**
 * The hamburger slide-over for mobile.
 *
 * Radix handles focus trapping, scroll lock and `Escape`; we add route-change
 * auto-close so tapping a link never leaves the drawer hanging open.
 */
export function MobileNavSheet({
  primaryItems,
  secondaryItems,
  fullName,
  username,
  avatarId,
  avatarUrl,
  profileHref,
  isAuthenticated,
  signOut,
}: MobileNavSheetProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "";

  // Close on navigation. Radix keeps the sheet mounted across route changes,
  // so the drawer would otherwise stay open after tapping a link. Deriving
  // this during render (rather than in an effect) avoids a wasted commit and
  // the cascading-render lint rule.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (open) setOpen(false);
  }

  const displayName = fullName || username || "Your account";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="tap-highlight-none inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-slate-200 dark:hover:bg-white/10"
      >
        <Menu className="h-6 w-6" />
      </button>

      <SheetContent side="left" className="w-[86vw] max-w-[340px] p-0" showCloseButton={false}>
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        <SheetDescription className="sr-only">
          Primary and secondary navigation for CalibiAI.
        </SheetDescription>

        {/* Header: brand + theme toggle */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] dark:border-slate-800">
          <SheetClose asChild>
            <Link href="/" className="flex items-center gap-2" aria-label="CalibiAI home">
              <CompactBrandLogo />
            </Link>
          </SheetClose>
          <ThemeToggle />
        </div>

        {/* Signed-in identity block */}
        {isAuthenticated && (
          <SheetClose asChild>
            <Link
              href={profileHref || "/dashboard"}
              className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-white/5"
            >
              <ProfileAvatar avatarId={avatarId} avatarUrl={avatarUrl} size={44} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-slate-900 dark:text-white">
                  {displayName}
                </span>
                {username && (
                  <span className="block truncate text-xs text-slate-500 dark:text-slate-400">@{username}</span>
                )}
              </span>
            </Link>
          </SheetClose>
        )}

        {/* Scrollable link list */}
        <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto overscroll-none-touch px-3 py-4">
          {primaryItems.length > 0 && (
            <ul className="grid gap-1">
              {primaryItems.map((item) => (
                <MenuLink key={item.href} item={item} pathname={pathname} />
              ))}
            </ul>
          )}

          {secondaryItems.length > 0 && (
            <>
              {primaryItems.length > 0 && (
                <div className="my-3 border-t border-slate-200 dark:border-slate-800" role="separator" />
              )}
              <ul className="grid gap-1">
                {secondaryItems.map((item) => (
                  <MenuLink key={item.href} item={item} pathname={pathname} />
                ))}
              </ul>
            </>
          )}
        </nav>

        {/* Footer: sign out */}
        {isAuthenticated && signOut && (
          <div className="border-t border-slate-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-slate-800">
            <form action={signOut}>
              <button
                type="submit"
                className="flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-rose-400 dark:hover:bg-rose-500/10"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                Logout
              </button>
            </form>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function MenuLink({ item, pathname }: { item: MobileNavItem; pathname: string }) {
  const Icon = MOBILE_NAV_ICONS[item.icon];
  const active = isNavItemActive(item, pathname);
  const isExternal = item.href.startsWith("mailto:") || item.href.startsWith("http");

  const className = cn(
    "flex min-h-[48px] items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors tap-highlight-none",
    active
      ? "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10",
  );

  const content = (
    <>
      <Icon className="h-5 w-5 shrink-0" />
      <span className="truncate">{item.label}</span>
    </>
  );

  return (
    <li>
      <SheetClose asChild>
        {isExternal ? (
          <a href={item.href} className={className}>
            {content}
          </a>
        ) : (
          <Link href={item.href} className={className} aria-current={active ? "page" : undefined}>
            {content}
          </Link>
        )}
      </SheetClose>
    </li>
  );
}
