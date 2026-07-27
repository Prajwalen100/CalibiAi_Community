import { JobDetailPage } from "@/app/community/jobs/[id]/page";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

/** A distraction-free job-description view for candidates. */
export default async function StandaloneJobDetailPage({ params }: { params: Params }) {
  return (
    <main className="mx-auto min-h-[calc(100vh-9rem)] max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <JobDetailPage params={params} />
    </main>
  );
}
