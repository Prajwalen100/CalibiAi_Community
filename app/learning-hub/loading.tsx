import { Skeleton } from "@/components/responsive/skeleton";

/** Skeleton shell for the Learning Hub while the catalog and progress load. */
export default function LearningHubLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8" aria-hidden="true">
      <Skeleton className="h-44 w-full rounded-2xl sm:h-48 lg:rounded-3xl" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-52 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
