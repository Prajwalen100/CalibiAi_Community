"use client";

import dynamic from "next/dynamic";

/**
 * Client-only boundary for Mermaid lesson diagrams.
 *
 * `ssr: false` must live in a Client Component in Next.js 16. Keeping this
 * boundary ensures Mermaid (which accesses browser APIs) is never evaluated
 * during SSR, while retaining a dedicated production client chunk.
 */
const LessonDiagrams = dynamic(
  () => import("./lesson-diagrams").then((mod) => mod.LessonDiagrams),
  { ssr: false },
);

export function LessonDiagramsLoader({ containerId }: { containerId: string }) {
  return <LessonDiagrams containerId={containerId} />;
}
