import { z } from "zod";

export const RoadmapModuleSchema = z.object({
  id: z.string().min(2),
  title: z.string().min(3),
  outcome: z.string().min(10),
  build_task: z.string().min(10),
  verification_artifact: z.enum(["github_repo", "live_url", "hands_on_assessment", "leaderboard_rank"]),
  estimated_hours: z.number().int().min(1).max(80)
});

export const RoadmapSchema = z.object({
  role: z.string().min(3),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  modules: z.array(RoadmapModuleSchema).min(3).max(8),
  next_action: z.string().min(10)
});

export type GeneratedRoadmap = z.infer<typeof RoadmapSchema>;
