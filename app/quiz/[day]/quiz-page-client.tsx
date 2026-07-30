"use client";

import { useRouter } from "next/navigation";
import { QuizPopup } from "@/components/quiz-popup";
import type { QuizQuestion } from "@/lib/learning/quiz-shuffle";

export function QuizPageClient({
  dayNumber,
  dayTitle,
  questions,
  attemptSeed,
}: {
  dayNumber: number;
  dayTitle: string;
  questions: QuizQuestion[];
  attemptSeed: string;
}) {
  const router = useRouter();
  const dayPath = `/roadmap/day/${dayNumber}`;

  function closeQuiz() {
    router.replace(dayPath);
  }

  function saveScore(score: number) {
    // Idempotent quiz-submit. The endpoint returns 409 if this quiz was
    // already submitted for this roadmap day — that's expected on
    // subsequent visits, so we swallow the error silently.
    void fetch("/api/roadmap/quiz-submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day: dayNumber, score }),
      keepalive: true,
    }).catch(() => undefined);
  }

  return (
    <QuizPopup
      isOpen
      onClose={closeQuiz}
      dayTitle={dayTitle}
      dayNumber={dayNumber}
      questions={questions}
      attemptSeed={attemptSeed}
      onScoreCalculated={saveScore}
    />
  );
}
