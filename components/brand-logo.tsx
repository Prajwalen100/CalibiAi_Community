import { cn } from "@/lib/utils";
import { CalibiAiMark } from "@/components/calibiai-mark";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "icon-only" | "text-only" | "gradient";
  showGlow?: boolean;
}

/**
 * Sizing is driven by the mark's height. The wordmark is optically matched to
 * it and the gap scales with the size so the lockup stays balanced.
 *
 * The mark is deep navy (#111C38) on light backgrounds. That colour is almost
 * invisible on the dark theme, so in dark mode it flips to near-white via
 * `dark:text-white` — the SVG uses `currentColor` throughout.
 */
const sizeClasses = {
  sm: { mark: "h-6", text: "text-base", gap: "gap-1.5" },
  md: { mark: "h-8", text: "text-lg", gap: "gap-2" },
  lg: { mark: "h-10", text: "text-xl", gap: "gap-2.5" },
  xl: { mark: "h-14", text: "text-3xl", gap: "gap-3" },
};

const MARK_COLOR = "text-[#111C38] dark:text-white";
const WORDMARK =
  "font-black tracking-tight leading-none text-[#111C38] dark:text-white";

export function BrandLogo({
  className,
  size = "md",
  variant = "default",
  showGlow = false,
}: BrandLogoProps) {
  const sizes = sizeClasses[size];

  if (variant === "icon-only") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center",
          sizes.mark,
          MARK_COLOR,
          showGlow && "animate-pulse-glow",
          className
        )}
      >
        <CalibiAiMark compact={size === "sm" || size === "md"} />
      </span>
    );
  }

  if (variant === "text-only") {
    return (
      <span className={cn(WORDMARK, sizes.text, className)}>CalibiAI</span>
    );
  }

  if (variant === "gradient") {
    return (
      <span className={cn("inline-flex items-center", sizes.gap, className)}>
        <span
          className={cn(
            "inline-flex items-center",
            sizes.mark,
            MARK_COLOR,
            showGlow && "animate-pulse-glow"
          )}
        >
          <CalibiAiMark compact={size === "sm" || size === "md"} />
        </span>
        <span
          className={cn(
            "bg-gradient-to-r from-slate-900 via-brand-700 to-indigo-700 bg-clip-text font-black leading-none tracking-tight text-transparent dark:from-white dark:via-brand-200 dark:to-indigo-200",
            sizes.text
          )}
        >
          CalibiAI
        </span>
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center", sizes.gap, className)}>
      <span
        className={cn(
          "inline-flex items-center transition-transform duration-300 hover:scale-105",
          sizes.mark,
          MARK_COLOR,
          showGlow && "animate-pulse-glow"
        )}
      >
        <CalibiAiMark compact={size === "sm" || size === "md"} />
      </span>
      <span className={cn(WORDMARK, sizes.text)}>CalibiAI</span>
    </span>
  );
}

/* Animated brand logo for hero / auth sections. */
export function AnimatedBrandLogo({
  className,
  size = "xl",
}: {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizes = sizeClasses[size];

  return (
    <span className={cn("relative inline-flex items-center", sizes.gap, className)}>
      <span className="relative inline-flex items-center">
        {/* Soft glow behind the mark */}
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-brand-500/25 via-indigo-500/20 to-purple-500/25 blur-2xl"
        />
        <span className={cn("inline-flex items-center", sizes.mark, MARK_COLOR)}>
          <CalibiAiMark className="animate-float-slow" compact={size === "sm" || size === "md"} />
        </span>
      </span>
      <span className={cn(WORDMARK, sizes.text)}>CalibiAI</span>
    </span>
  );
}

/* Compact logo for headers and footers. */
export function CompactBrandLogo({ className }: { className?: string } = {}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className={cn("inline-flex h-8 items-center", MARK_COLOR)}>
        <CalibiAiMark compact />
      </span>
      <span className={cn(WORDMARK, "text-lg")}>CalibiAI</span>
    </span>
  );
}
