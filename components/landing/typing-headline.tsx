"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type Props = {
  /** Plain text typed first, e.g. "The trusted ecosystem for " */
  prefix: string;
  /** Text typed after the prefix and rendered with the brand gradient. */
  highlight: string;
  /** Milliseconds between characters. */
  speed?: number;
  /** Pause (ms) once the full headline is typed, before it replays. */
  holdMs?: number;
  className?: string;
};

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false // Server render: assume motion is fine, the effect corrects it.
  );
}

/**
 * Types the hero headline character-by-character, then keeps a blinking caret.
 * The animation replays on a loop so the hero always feels alive, and it is
 * skipped entirely for visitors who prefer reduced motion (they get the full
 * headline immediately).
 */
export function TypingHeadline({
  prefix,
  highlight,
  speed = 55,
  holdMs = 4500,
  className = "",
}: Props) {
  const full = prefix + highlight;
  const reducedMotion = usePrefersReducedMotion();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    if (reducedMotion) {
      timer = setTimeout(() => setCount(full.length), 0);
      return () => clearTimeout(timer);
    }

    const step = (i: number) => {
      if (cancelled) return;
      if (i <= full.length) {
        setCount(i);
        timer = setTimeout(() => step(i + 1), speed);
      } else {
        // Hold the finished headline on screen, then retype from the start.
        timer = setTimeout(() => step(0), holdMs);
      }
    };

    timer = setTimeout(() => step(0), 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [full, speed, holdMs, reducedMotion]);

  const typedPrefix = full.slice(0, Math.min(count, prefix.length));
  const typedHighlight = count > prefix.length ? full.slice(prefix.length, count) : "";
  const done = count >= full.length;

  return (
    <h1 className={className}>
      {/* Screen readers and crawlers always get the complete headline. */}
      <span className="sr-only">{full}</span>
      <span aria-hidden="true">
        {typedPrefix}
        <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
          {typedHighlight}
        </span>
        <span
          className={`ml-1 inline-block h-[0.85em] w-[3px] translate-y-[0.08em] rounded-full bg-indigo-500 align-middle dark:bg-indigo-400 ${
            done ? "animate-caret-blink" : "opacity-100"
          }`}
        />
      </span>
    </h1>
  );
}
