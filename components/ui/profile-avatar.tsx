"use client";

import { cn } from "@/lib/utils";
import { getAvatarById } from "@/components/ui/avatar-picker";

interface ProfileAvatarProps {
  /** avatar_id stored on the profile (1–4). Falls back to Avatar 1. */
  avatarId?: number | null;
  /** AI-generated avatar URL (DiceBear etc.). Takes precedence over avatar_id. */
  avatarUrl?: string | null;
  /** Rendered size in Tailwind units (default 40 = h-10 w-10). */
  size?: number;
  className?: string;
}

/**
 * Renders the user's avatar. Prefers an AI-generated `avatarUrl` when present,
 * otherwise falls back to the preset SVG picker avatars. Use anywhere a user's
 * picture would appear (sidebar, rosters, profile pages, post cards, etc.).
 */
export function ProfileAvatar({ avatarId, avatarUrl, size = 40, className }: ProfileAvatarProps) {
  const avatar = getAvatarById(avatarId ?? undefined);
  const style = { width: size, height: size };
  return (
    <span
      style={style}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white",
        className,
      )}
      aria-label={avatar.alt}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={avatar.alt} className="h-full w-full object-cover" />
      ) : (
        <span className="pointer-events-none flex h-full w-full items-center justify-center [&>svg]:h-full [&>svg]:w-full">
          {avatar.svg}
        </span>
      )}
    </span>
  );
}
