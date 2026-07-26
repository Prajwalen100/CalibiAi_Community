"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseCountUpOptions {
  end: number;
  start?: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  startOnView?: boolean;
}

export function useCountUp({
  end,
  start = 0,
  duration = 2000,
  suffix = "",
  prefix = "",
  startOnView = true,
}: UseCountUpOptions) {
  const [count, setCount] = useState(start);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  const animateCount = useCallback(() => {
    const startTime = performance.now();
    const range = end - start;

    function step(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + range * eased);

      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }, [duration, end, start]);

  useEffect(() => {
    if (!startOnView) {
      animateCount();
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            animateCount();
            observer.unobserve(element);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [animateCount, startOnView]);

  const display = `${prefix}${count}${suffix}`;

  return { count, display, ref };
}
