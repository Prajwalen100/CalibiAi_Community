import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Shared responsive building blocks.
 *
 * These exist so pages stop hand-rolling breakpoint strings. Every primitive
 * keeps its `lg:` values identical to what the desktop already rendered, and
 * only adds mobile/tablet behaviour below that breakpoint.
 */

type DivProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * The standard page container.
 *
 * Desktop is unchanged: `max-w-7xl` + `lg:px-8`. Below `lg` we drop to a 16px
 * gutter on phones and 24px on tablets, which matches the spacing spec.
 */
export const PageContainer = React.forwardRef<
  HTMLDivElement,
  DivProps & { as?: "div" | "section" | "main" }
>(({ className, as: Tag = "div", ...props }, ref) => (
  <Tag ref={ref as never} className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...props} />
));
PageContainer.displayName = "PageContainer";

/**
 * Vertical rhythm wrapper: tighter on phones, unchanged from `lg` upward.
 */
export const PageSection = React.forwardRef<HTMLDivElement, DivProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("py-6 sm:py-7 lg:py-8", className)} {...props} />
));
PageSection.displayName = "PageSection";

/**
 * Stat/metric grid: 1 column on phones, 2 on tablets, and whatever the desktop
 * already used from `lg` up (defaults to 4).
 */
export const ResponsiveGrid = React.forwardRef<
  HTMLDivElement,
  DivProps & { desktopColumns?: 2 | 3 | 4 }
>(({ className, desktopColumns = 4, ...props }, ref) => {
  const lg = { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" }[desktopColumns];
  return <div ref={ref} className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", lg, className)} {...props} />;
});
ResponsiveGrid.displayName = "ResponsiveGrid";

/**
 * Action row. Buttons go full-width and stack on phones (the spec's "buttons
 * become full width"), then return to an inline row from `sm` upward.
 */
export const ActionRow = React.forwardRef<HTMLDivElement, DivProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center [&>*]:w-full sm:[&>*]:w-auto", className)}
    {...props}
  />
));
ActionRow.displayName = "ActionRow";

/**
 * Hides content below `lg` — use to swap a desktop-only widget for a mobile one.
 * Rendered with CSS rather than JS so there is no hydration mismatch or CLS.
 */
export function DesktopOnly({ className, ...props }: DivProps) {
  return <div className={cn("hidden lg:contents", className)} {...props} />;
}

/** Shows content only below `lg`. The desktop tree renders nothing. */
export function MobileOnly({ className, ...props }: DivProps) {
  return <div className={cn("contents lg:hidden", className)} {...props} />;
}

/**
 * Table wrapper that keeps the desktop `<table>` exactly as-is and renders a
 * card list on mobile instead.
 *
 * Both trees are server-rendered and toggled with CSS, so there is no layout
 * shift and no duplicated data fetching.
 */
export function ResponsiveTable({
  table,
  cards,
  className,
}: {
  /** The existing desktop table. Untouched at `lg` and above. */
  table: React.ReactNode;
  /** Mobile card representation of the same rows. */
  cards: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="hidden lg:block">{table}</div>
      <div className="grid gap-3 lg:hidden">{cards}</div>
    </div>
  );
}
