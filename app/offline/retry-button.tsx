"use client";

import { useCallback, useSyncExternalStore } from "react";
import { RefreshCw, Wifi } from "lucide-react";

/**
 * Retry control for the offline shell.
 *
 * Watches `navigator.onLine` so the button can tell the user the connection is
 * back before they tap, instead of them guessing.
 */
export function OfflineRetryButton() {
  // `useSyncExternalStore` is the correct primitive for reading a live browser
  // API: it subscribes without an effect and returns a stable `true` during SSR.
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener("online", onChange);
    window.addEventListener("offline", onChange);
    return () => {
      window.removeEventListener("online", onChange);
      window.removeEventListener("offline", onChange);
    };
  }, []);

  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );

  return (
    <div className="mt-6 w-full">
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-bold text-white transition-colors hover:bg-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-brand-500 dark:hover:bg-brand-400"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Try again
      </button>

      <p
        className="mt-3 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400"
        role="status"
        aria-live="polite"
      >
        <Wifi className={`h-3.5 w-3.5 ${online ? "text-emerald-500" : "text-slate-400"}`} aria-hidden="true" />
        {online ? "Connection restored — tap to reload" : "Waiting for a connection…"}
      </p>
    </div>
  );
}
