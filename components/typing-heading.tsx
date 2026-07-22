"use client";

import { useEffect, useState } from "react";

export function TypingHeading({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let i = 0;
    let restart: ReturnType<typeof setTimeout> | undefined;
    const speed = 75;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.substring(0, i + 1));
        i++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
        // Replay the headline every 10 seconds so the hero stays alive.
        restart = setTimeout(() => {
          setDisplayedText("");
          setIsComplete(false);
        }, 10000);
      }
    }, speed);

    return () => { clearInterval(timer); if (restart) clearTimeout(restart); };
  }, [text]);

  return (
    <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-ink sm:text-6xl min-h-[2.5em] sm:min-h-[2em]">
      {displayedText}
      {!isComplete && <span className="inline-block w-2.5 h-9 sm:h-12 ml-1 bg-brand-600 animate-pulse align-middle" />}
    </h1>
  );
}
