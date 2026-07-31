"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { RefreshCw } from "lucide-react";

/** Distance the user must drag before a refresh fires. */
const THRESHOLD = 72;
/** Hard cap on the indicator travel, for the rubber-band feel. */
const MAX_PULL = 110;
/** Below this width the gesture is active; above it we do nothing. */
const MOBILE_MAX_WIDTH = 1023.98;

/**
 * Native-style pull-to-refresh for mobile.
 *
 * Only arms when the scroll container is already at the very top, so it never
 * hijacks a normal upward scroll. Refresh is delegated to `router.refresh()`,
 * which re-runs the server components in place — no full page reload, so
 * scroll position and client state survive.
 *
 * Disabled entirely at `lg` and above, and when the user prefers reduced motion.
 */
export function PullToRefresh({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const startY = useRef(0);
  const tracking = useRef(false);
  const pullRef = useRef(0);

  const reset = useCallback(() => {
    tracking.current = false;
    pullRef.current = 0;
    setPull(0);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia(`(min-width: ${MOBILE_MAX_WIDTH + 0.02}px)`).matches) return;
    if (reduceMotion) return;

    const onTouchStart = (event: TouchEvent) => {
      if (refreshing) return;
      // Arm only from a genuine top-of-page position.
      if (window.scrollY > 0) return;
      if (event.touches.length !== 1) return;
      startY.current = event.touches[0].clientY;
      tracking.current = true;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!tracking.current || refreshing) return;

      const delta = event.touches[0].clientY - startY.current;

      // Upward drag or a scroll that left the top: hand control back to the browser.
      if (delta <= 0 || window.scrollY > 0) {
        reset();
        return;
      }

      // Resistance curve so the pull feels weighted, like iOS.
      const distance = Math.min(MAX_PULL, delta * 0.5);
      pullRef.current = distance;
      setPull(distance);

      // Suppress the browser's own overscroll once we've taken over.
      if (event.cancelable && distance > 4) event.preventDefault();
    };

    const onTouchEnd = () => {
      if (!tracking.current) return;
      const distance = pullRef.current;
      tracking.current = false;

      if (distance >= THRESHOLD) {
        setRefreshing(true);
        setPull(THRESHOLD);
        router.refresh();
        // The server round-trip has no completion event we can await, so
        // release the indicator after a short, predictable window.
        window.setTimeout(() => {
          setRefreshing(false);
          reset();
        }, 900);
      } else {
        reset();
      }
    };

    // `passive: false` is required for preventDefault() on touchmove.
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [reduceMotion, refreshing, reset, router]);

  const active = pull > 0 || refreshing;
  const progress = Math.min(1, pull / THRESHOLD);

  return (
    <>
      {/* Indicator is fixed and pointer-events-none, so it can never intercept
          a tap or shift the page layout. */}
      <div
        aria-hidden={!active}
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center lg:hidden"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.5rem)" }}
      >
        <motion.div
          initial={false}
          animate={{
            y: active ? Math.max(8, pull * 0.6) : -48,
            opacity: active ? 1 : 0,
            scale: active ? 0.85 + progress * 0.15 : 0.8,
          }}
          transition={{ duration: refreshing ? 0.2 : 0, ease: "easeOut" }}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <RefreshCw
            className={`h-5 w-5 text-brand-600 dark:text-brand-400 ${refreshing ? "ptr-spinner" : ""}`}
            style={refreshing ? undefined : { transform: `rotate(${progress * 270}deg)` }}
          />
        </motion.div>
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {refreshing ? "Refreshing content" : ""}
      </span>

      {children}
    </>
  );
}
