"use client";

import { useEffect } from "react";

/**
 * Client-only companion to the "Read Detailed Article" link. When the
 * user clicks that link we fire a `navigator.sendBeacon` (falling back to
 * `fetch(..., { keepalive: true })`) to `/api/roadmap/article-read`.
 *
 * The endpoint is idempotent — subsequent clicks collapse into the same
 * row thanks to the (user_roadmap_id, day) unique index — so we do not
 * bother tracking a "sent" flag on the client.
 */
export function ArticleReadBeacon({ dayNumber }: { dayNumber: number }) {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const link = target.closest<HTMLAnchorElement>(
        `a[data-role="article-read-link"][data-day="${dayNumber}"]`
      );
      if (!link) return;
      const payload = JSON.stringify({ day: dayNumber });
      try {
        const beacon = new Blob([payload], { type: "application/json" });
        // `sendBeacon` returns false when the browser refuses to queue
        // the request — in that case we fall back to a keepalive fetch.
        const queued = navigator.sendBeacon?.("/api/roadmap/article-read", beacon);
        if (!queued) {
          void fetch("/api/roadmap/article-read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          }).catch(() => undefined);
        }
      } catch {
        // Beacon failures should never block the article navigation.
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [dayNumber]);

  return null;
}
