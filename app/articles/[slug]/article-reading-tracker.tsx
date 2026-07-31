"use client";

import { useEffect, useRef } from "react";

interface ArticleReadingTrackerProps {
  /** Article ID reported to `/api/reading/track`. */
  articleId: string;
}

/**
 * Reports how long a reader spent on an article to `/api/reading/track`.
 *
 * This replaces the old inline `<script dangerouslySetInnerHTML>` that lived
 * inside the article page. React never executes raw `<script>` tags that are
 * rendered inside a component, so that tracker was dead code — and it logged
 * React's "Encountered a script tag while rendering React component" console
 * error on every visit. The same work done in a `"use client"` component with
 * `useEffect` actually runs, and gets three flush points the inline script
 * couldn't provide:
 *
 *   1. a 15s timeout, so short visits still count;
 *   2. a `beforeunload` flush with the exact elapsed time;
 *   3. a flush on unmount — client-side navigation away from the article
 *      (e.g. clicking "Back to Day N") never fires `beforeunload`, so the
 *      time spent is still recorded when the tree unmounts.
 *
 * The component renders nothing.
 */
export function ArticleReadingTracker({ articleId }: ArticleReadingTrackerProps) {
  const trackedRef = useRef(false);

  useEffect(() => {
    const start = Date.now();

    const sendTrack = () => {
      if (trackedRef.current) return;
      trackedRef.current = true;
      const payload = JSON.stringify({
        articleId,
        timeSpentSeconds: Math.round((Date.now() - start) / 1000),
      });
      try {
        // sendBeacon survives page unload; fall back to a keepalive fetch
        // when it's unavailable or queues nothing.
        const beacon = new Blob([payload], { type: "application/json" });
        const queued = navigator.sendBeacon?.("/api/reading/track", beacon);
        if (!queued) {
          void fetch("/api/reading/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          }).catch(() => undefined);
        }
      } catch {
        // Tracking failures should never break the reading experience.
      }
    };

    const flushOnUnload = () => sendTrack();
    window.addEventListener("beforeunload", flushOnUnload);

    const timeout = window.setTimeout(sendTrack, 15000);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("beforeunload", flushOnUnload);
      // Only flush sub-15s reads on the way out. The 2s floor skips
      // near-instant navigations (and React StrictMode's simulated remount),
      // which would otherwise spam the log with 0-second reads.
      if (Date.now() - start >= 2000) sendTrack();
    };
  }, [articleId]);

  return null;
}
