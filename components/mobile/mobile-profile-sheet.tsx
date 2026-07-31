"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, Moon, Settings, Sun, UserRound } from "lucide-react";

import { Sheet, SheetClose, SheetContent, SheetDescription, SheetGrabber, SheetTitle } from "@/components/ui/sheet";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { useTheme } from "@/components/theme-provider";

type MobileProfileSheetProps = {
  fullName?: string | null;
  username?: string | null;
  avatarId?: number | null;
  avatarUrl?: string | null;
  profileHref: string;
  signOut: () => Promise<void>;
};

/**
 * The mobile counterpart to the desktop `ProfileMenu` dropdown.
 *
 * Same actions, presented as a bottom sheet — the native pattern on both iOS
 * and Android, and far easier to reach one-handed than a top-anchored popover.
 */
export function MobileProfileSheet({
  fullName,
  username,
  avatarId,
  avatarUrl,
  profileHref,
  signOut,
}: MobileProfileSheetProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "";
  const { toggleTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const name = fullName || username || "Your profile";

  // Dismiss the sheet when the route changes (see MobileNavSheet for rationale).
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (open) setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open profile menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="tap-highlight-none rounded-full transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
      >
        <ProfileAvatar avatarId={avatarId} avatarUrl={avatarUrl} size={36} className="shadow-sm" />
      </button>

      <SheetContent side="bottom" className="p-0" showCloseButton={false}>
        <SheetGrabber />
        <SheetTitle className="sr-only">Profile menu</SheetTitle>
        <SheetDescription className="sr-only">Account shortcuts and sign out.</SheetDescription>

        <div className="flex items-center gap-3 px-4 pb-3 pt-2">
          <ProfileAvatar avatarId={avatarId} avatarUrl={avatarUrl} size={48} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-slate-900 dark:text-white">{name}</p>
            {username && <p className="truncate text-sm text-slate-500 dark:text-slate-400">@{username}</p>}
          </div>
        </div>

        <div className="border-t border-slate-200 p-2 dark:border-slate-800">
          <SheetClose asChild>
            <Link
              href={profileHref}
              className="flex min-h-[52px] items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <UserRound className="h-5 w-5 shrink-0" />
              View profile
            </Link>
          </SheetClose>

          <SheetClose asChild>
            <Link
              href="/community/profile/avatar"
              className="flex min-h-[52px] items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <Settings className="h-5 w-5 shrink-0" />
              Settings
            </Link>
          </SheetClose>

          <button
            type="button"
            onClick={toggleTheme}
            className="flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
          >
            {isDark ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
            {isDark ? "Light mode" : "Dark mode"}
          </button>

          <form action={signOut}>
            <button
              type="submit"
              className="flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              Logout
            </button>
          </form>
        </div>

        <div className="h-2" />
      </SheetContent>
    </Sheet>
  );
}
