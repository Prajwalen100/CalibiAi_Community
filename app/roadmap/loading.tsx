import { Skeleton, SkeletonStatGrid } from "@/components/responsive/skeleton";

/** Skeleton shell for the roadmap while plan and progress data resolve. */
export default function RoadmapLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-3 w-56 max-w-full" />
      </div>
      <div className="mt-5 lg:mt-6">
        <SkeletonStatGrid count={4} />
      </div>
      <div className="mt-5 space-y-4 lg:mt-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-48 w-full rounded-2xl lg:rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
