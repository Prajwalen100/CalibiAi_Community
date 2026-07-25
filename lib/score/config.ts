export const SCORE_WEIGHTS = {
  projects: 350,
  skills: 200,
  community: 100,
  completion: 100,
  recognition: 50,
  reading: 100,
  quizzes: 100
} as const;

export const TIERS = [
  { tier: "bronze", min: 0, max: 300 },
  { tier: "silver", min: 301, max: 550 },
  { tier: "gold", min: 551, max: 800 },
  { tier: "platinum", min: 801, max: 1000 }
] as const;

export type ScoreTier = (typeof TIERS)[number]["tier"];
