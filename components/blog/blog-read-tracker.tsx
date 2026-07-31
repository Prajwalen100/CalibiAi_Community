"use client";

import { useEffect, useRef } from "react";

/**
 * Client-only companion mounted on `/blog/[slug]`. Once the reader scrolls
 * to the bottom of the post, records the read via `/api/blog/read` — the
 * same "scroll to the end" signal already used for roadmap articles
 * (`ArticleCompletionBanner`) and Learning Hub modules (`ModuleScrollProgress`).
 * This is what lets a blog post actually move the Reading Engagement stat
 * on the dashboard instead of doing nothing.
 */
export function BlogReadTracker({ slug }: { slug: string }) {
  const trackedRef = useRef(false);

  useEffect(() => {
    trackedRef.current = false;

    const markRead = () => {
      if (trackedRef.current) return;
      trackedRef.current = true;
      const payload = JSON.stringify({ slug });
      try {
        const beacon = new Blob([payload], { type: "application/json" });
        const queued = navigator.sendBeacon?.("/api/blog/read", beacon);
        if (!queued) {
          void fetch("/api/blog/read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          }).catch(() => undefined);
        }
      } catch {
        // Never let a tracking failure affect reading the post.
      }
    };

    const handleScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - window.innerHeight;
      const atBottom = max <= 0 || window.scrollY >= max - 40;
      if (atBottom) markRead();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Short posts that never need scrolling still count as read.
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [slug]);

  return null;
}
