import type { Metadata } from "next";
import { CloudOff } from "lucide-react";

import { OfflineRetryButton } from "./retry-button";

export const metadata: Metadata = {
  title: "Offline — CalibiAI",
  description: "You are currently offline. Reconnect to continue learning.",
  // This shell is a fallback, never a real destination for crawlers.
  robots: { index: false, follow: false },
};

/**
 * The offline fallback served by the service worker for failed navigations.
 *
 * Fully static so it can be precached at install time and rendered with no
 * network, no Supabase session and no client data.
 */
export default function OfflinePage() {
  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <CloudOff className="h-8 w-8" aria-hidden="true" />
      </div>

      <h1 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">You&apos;re offline</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        CalibiAI can&apos;t reach the network right now. Pages you&apos;ve already visited stay available, and
        everything syncs the moment you reconnect.
      </p>

      <OfflineRetryButton />

      <p className="mt-8 text-xs text-slate-400 dark:text-slate-500">
        Tip: install CalibiAI to your home screen for faster, offline-ready access.
      </p>
    </section>
  );
}
