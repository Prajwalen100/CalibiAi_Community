"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import { CompactBrandLogo } from "@/components/brand-logo";
import { MobileNavSheet } from "@/components/mobile/mobile-nav-sheet";
import { MobileProfileSheet } from "@/components/mobile/mobile-profile-sheet";
import { SignInButton } from "@/components/sign-in-button";
import { ThemeToggle } from "@/components/theme-toggle";
import type { MobileNavItem } from "@/lib/navigation/mobile-nav";

export type MobileTopBarProps = {
  homeHref: string;
  primaryItems: MobileNavItem[];
  secondaryItems: MobileNavItem[];
  isAuthenticated: boolean;
  showNotifications: boolean;
  unreadCount: number;
  notificationsHref: string;
  fullName?: string | null;
  username?: string | null;
  avatarId?: number | null;
  avatarUrl?: string | null;
  profileHref?: string | null;
  signOut?: () => Promise<void>;
};

/**
 * The mobile header: logo, notifications, avatar, hamburger.
 *
 * Rendered only below `lg` — the desktop `<SiteHeader>` nav is untouched and
 * simply hidden at this width, so nothing about the desktop markup changed.
 * Sticky with a top safe-area inset so it clears the notch / Dynamic Island
 * when running standalone.
 */
export function MobileTopBar({
  homeHref,
  primaryItems,
  secondaryItems,
  isAuthenticated,
  showNotifications,
  unreadCount,
  notificationsHref,
  fullName,
  username,
  avatarId,
  avatarUrl,
  profileHref,
  signOut,
}: MobileTopBarProps) {
  return (
    <div className="flex items-center justify-between gap-2 pt-[env(safe-area-inset-top)] lg:hidden">
      <Link href={homeHref} className="flex min-w-0 items-center gap-2" aria-label="CalibiAI home">
        <CompactBrandLogo />
      </Link>

      <div className="flex shrink-0 items-center gap-0.5">
        {showNotifications && (
          <Link
            href={notificationsHref}
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
            className="tap-highlight-none relative inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-slate-200 dark:hover:bg-white/10"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-[18px] text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        )}

        {isAuthenticated && signOut ? (
          <MobileProfileSheet
            fullName={fullName}
            username={username}
            avatarId={avatarId}
            avatarUrl={avatarUrl}
            profileHref={profileHref || homeHref}
            signOut={signOut}
          />
        ) : (
          <>
            <ThemeToggle />
            <div className="ml-1">
              <SignInButton />
            </div>
          </>
        )}

        <MobileNavSheet
          primaryItems={primaryItems}
          secondaryItems={secondaryItems}
          fullName={fullName}
          username={username}
          avatarId={avatarId}
          avatarUrl={avatarUrl}
          profileHref={profileHref}
          isAuthenticated={isAuthenticated}
          signOut={signOut}
        />
      </div>
    </div>
  );
}
