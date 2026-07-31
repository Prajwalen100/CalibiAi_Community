import { Skeleton, SkeletonRow } from "@/components/responsive/skeleton";

/** Skeleton feed for the community while posts and sidebars load. */
export default function CommunityLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-6" aria-hidden="true">
      <div className="flex gap-4 lg:gap-6">
        {/* Mirrors the real left sidebar, which is lg-only. */}
        <div className="hidden w-56 shrink-0 space-y-2 lg:block">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full rounded-xl" />
          ))}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonRow key={index} />
          ))}
        </div>

        <div className="hidden w-72 shrink-0 space-y-4 xl:block">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
