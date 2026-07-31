import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Skeleton loaders used by the route-level `loading.tsx` files.
 *
 * These replace spinners so the app shows page-shaped placeholders while data
 * streams in, which keeps perceived performance high and avoids the layout
 * shift a spinner-to-content swap causes.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton-block", className)} {...props} />;
}

/** A single line of placeholder text. */
export function SkeletonText({ className, lines = 1 }: { className?: string; lines?: number }) {
  return (
    <div className="grid gap-2">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn("h-3.5", index === lines - 1 && lines > 1 ? "w-2/3" : "w-full", className)}
        />
      ))}
    </div>
  );
}

/** Placeholder shaped like the app's `.card`. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("card", className)}>
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
    </div>
  );
}

/** Grid of stat-card placeholders matching the dashboard's metric grid. */
export function SkeletonStatGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

/** Placeholder for a list row (roadmap day, post, member, job). */
export function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
      <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

/** Full dashboard-shaped shell, reused by the offline fallback and loading UI. */
export function SkeletonDashboard() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-64 max-w-full" />
      </div>
      <Skeleton className="mt-6 h-40 w-full rounded-2xl sm:h-44 lg:rounded-3xl" />
      <div className="mt-6">
        <SkeletonStatGrid />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.5fr] lg:gap-6">
        <div className="space-y-4">
          <Skeleton className="h-56 w-full rounded-2xl lg:rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-2xl lg:rounded-3xl" />
        </div>
        <div className="card space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonRow key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
