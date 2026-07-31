"use client";

import { useEffect, useState } from "react";

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  if (hour < 20) return "Good evening";
  return "Good night";
}

/** Renders in the learner's browser so the greeting follows their local time zone. */
export function DashboardGreeting({ name }: { name: string }) {
  // Use a stable initial value for server rendering, then use the learner's local clock.
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    const updateGreeting = () => setGreeting(greetingForHour(new Date().getHours()));
    updateGreeting();
    const interval = window.setInterval(updateGreeting, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  // Greeting stays prominent on phones (xl) and keeps its desktop size at lg+.
  return (
    <h2 className="text-2xl font-black max-sm:text-xl max-sm:leading-tight">
      {greeting}, {name}
    </h2>
  );
}
