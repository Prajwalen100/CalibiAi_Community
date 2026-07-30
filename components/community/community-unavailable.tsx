import Link from "next/link";
import { DatabaseZap } from "lucide-react";

/** Shown instead of a server error while the community data service is unavailable. */
export function CommunityUnavailable() {
  return (
    <section
      role="status"
      className="glass-panel mx-auto max-w-2xl p-7 text-center sm:p-10"
    >
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
        <DatabaseZap className="h-7 w-7" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-black text-primary">Community is being set up</h1>
      <p className="mx-auto mt-3 max-w-lg leading-7 text-secondary">
        The community service is not connected yet, so posts and member activity cannot be loaded right now.
        Please try again shortly.
      </p>
      <Link href="/" className="btn-secondary mt-7 inline-flex">
        Return home
      </Link>
    </section>
  );
}
