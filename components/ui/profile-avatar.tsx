import { cn } from "@/lib/utils";
import { getAvatarById } from "@/components/ui/avatar-picker";

interface ProfileAvatarProps {
  /** avatar_id stored on the profile (1–4). Falls back to Avatar 1. */
  avatarId?: number | null;
  /** Rendered size in Tailwind units (default 40 = h-10 w-10). */
  size?: number;
  className?: string;
}

/**
 * Renders the chosen avatar SVG from the avatar picker inside a circular
 * frame. Use anywhere a user's picture would appear (sidebar, rosters,
 * profile pages, post cards, etc.).
 */
export function ProfileAvatar({ avatarId, size = 40, className }: ProfileAvatarProps) {
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
      <span className="pointer-events-none flex h-full w-full items-center justify-center [&>svg]:h-full [&>svg]:w-full">
        {avatar.svg}
      </span>
    </span>
  );
}
