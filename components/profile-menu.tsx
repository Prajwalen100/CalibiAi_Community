"use client";

import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ProfileAvatar } from "@/components/ui/profile-avatar";

type ProfileMenuProps = {
  fullName?: string | null;
  username?: string | null;
  avatarId?: number | null;
  avatarUrl?: string | null;
  profileHref: string;
  signOut: () => Promise<void>;
};

/** A compact account menu for the right side of the main navigation. */
export function ProfileMenu({
  fullName,
  username,
  avatarId,
  avatarUrl,
  profileHref,
  signOut,
}: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const name = fullName || username || "Your profile";

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open profile menu"
        className="rounded-full transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
      >
        <ProfileAvatar avatarId={avatarId} avatarUrl={avatarUrl} size={38} className="shadow-sm" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Profile options"
          className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl dark:border-white/10 dark:bg-slate-900"
        >
          <p className="truncate px-3 py-2 text-xs font-semibold text-slate-500 dark:text-white/50">{name}</p>
          <div className="mx-2 border-t border-slate-100 dark:border-white/10" />
          <Link
            href={profileHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-white/80 dark:hover:bg-white/10"
          >
            <UserRound className="h-4 w-4" />
            View profile
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
