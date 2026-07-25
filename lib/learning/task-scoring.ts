export const TASK_PASS_SCORE = 60;

/** A passed lab can add 1–5 points. Failed attempts never remove prior points. */
export function pointsForTaskScore(score: number): number {
  const normalized = Math.max(0, Math.min(100, Math.round(score)));
  if (normalized < TASK_PASS_SCORE) return 0;
  return Math.min(5, Math.max(1, Math.ceil((normalized - 50) / 10)));
}

export function motivationForTaskScore(score: number): string {
  if (score >= 90) return "Outstanding work — this is portfolio-quality progress. Keep building!";
  if (score >= 75) return "Excellent progress! Your solution shows strong understanding and practical skill.";
  if (score >= TASK_PASS_SCORE) return "Great job — you passed! Apply the feedback and your next solution will be even stronger.";
  if (score >= 40) return "Good attempt. Mistakes are part of becoming an engineer — fix the highlighted gaps and resubmit.";
  return "You have taken the important first step. Review the guidance, improve one issue at a time, and try again.";
}
