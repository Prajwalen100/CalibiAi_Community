import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { ROLE_DETAILS, type LearningRole } from "@/lib/learning/content";
import type {
  LabLanguage,
  RoadmapLevel,
  RoadmapTask,
  RoadmapTaskType,
} from "@/lib/learning/task-types";

export type {
  LabLanguage,
  RoadmapLevel,
  RoadmapTask,
  RoadmapTaskType,
} from "@/lib/learning/task-types";

const RoadmapTaskDaySchema = z.object({
  day: z.number().int().positive(),
  title: z.string().trim().min(1),
  objectives: z.array(z.string().trim().min(1)).default([]),
  topics: z.array(z.string().trim().min(1)).default([]),
  difficulty: z.string().trim().min(1).optional(),
  expected_outcome: z.string().trim().min(1).optional(),
  practical_task: z.string().trim().min(1),
  mini_project: z.string().trim().min(1),
  assignment: z.string().trim().min(1),
  // Optional: the canonical skills the student gains by completing this day.
  // Used to drive the public profile's "Verified skills" radar when a
  // mini-project is passed.
  skills_gained: z.array(z.string().trim().min(1)).default([]),
});

const RoadmapTaskContentSchema = z.object({
  roadmap: z.object({
    title: z.string().trim().min(1),
    total_days: z.number().int().positive(),
  }),
  days: z.array(RoadmapTaskDaySchema).min(1),
});

type RoadmapTaskContent = z.infer<typeof RoadmapTaskContentSchema>;
const contentCache = new Map<string, RoadmapTaskContent>();

export function parseRoadmapTaskContent(source: unknown): RoadmapTaskContent {
  const content = RoadmapTaskContentSchema.parse(source);
  if (content.days.length !== content.roadmap.total_days) {
    throw new Error(
      `Roadmap declares ${content.roadmap.total_days} days but contains ${content.days.length}.`
    );
  }
  content.days.forEach((day, index) => {
    if (day.day !== index + 1) {
      throw new Error(`Roadmap day ${index + 1} is missing or out of order.`);
    }
  });
  return content;
}

function loadTaskContent(role: LearningRole, level: RoadmapLevel): RoadmapTaskContent {
  const fileName = ROLE_DETAILS[role].roadmap[level];
  const cached = contentCache.get(fileName);
  if (cached) return cached;

  const source = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "content", "roadmap", fileName), "utf8")
  ) as unknown;
  const content = parseRoadmapTaskContent(source);
  contentCache.set(fileName, content);
  return content;
}

function inferLanguage(task: string, topics: string[], taskType: RoadmapTaskType): LabLanguage {
  const context = `${task} ${topics.join(" ")}`.toLowerCase();
  // Explicit tooling in the task itself wins over broad day topics (for
  // example, a Jupyter/Pandas assignment on a day that also discusses JSON).
  if (/\b(python|jupyter|pandas|numpy|scikit-learn|sklearn|matplotlib|seaborn)\b/i.test(task)) return "python";
  if (/\b(sql|postgres|database query|bigquery)\b/.test(context)) return "sql";
  if (/\b(typescript|next\.js|node\.js|nodejs)\b/.test(context)) return "typescript";
  if (/\b(javascript|react|browser|express)\b/.test(context)) return "javascript";
  if (/\b(yaml|kubernetes|github actions|docker compose)\b/.test(context)) return "yaml";
  if (/\b(json|api payload|schema)\b/.test(context)) return "json";
  if (/\b(bash|shell|linux command|dockerfile)\b/.test(context)) return "bash";
  if (/\b(python|jupyter|pandas|numpy|scikit-learn|sklearn|matplotlib|seaborn)\b/.test(context)) return "python";
  // Conceptual assignments get a structured written-response workspace. Tasks
  // that explicitly name a technical language/tool are mapped above first.
  if (taskType === "assignment") return "markdown";
  return "python";
}

function starterFor(language: LabLanguage, task: string): string {
  const conciseTask = task.length > 180 ? `${task.slice(0, 177)}...` : task;
  switch (language) {
    case "python":
      if (/\b(jupyter|pandas|dataframe|dataset|groupby)\b/i.test(task)) {
        return `# Task: ${conciseTask}\n# Jupyter-style Python workspace\n\nimport pandas as pd\n\n# 1. Load your public dataset\n# df = pd.read_csv("dataset.csv")\n\n# 2. Clean and inspect the data\n# Write your solution here\n\n# 3. Produce and label the required insights\n# Include assertions, sample output, or validation evidence\n`;
      }
      return `# Task: ${conciseTask}\n\ndef solve():\n    # Write your solution here\n    pass\n\n\nif __name__ == "__main__":\n    solve()\n`;
    case "javascript":
    case "typescript":
      return `// Task: ${conciseTask}\n\nfunction solve() {\n  // Write your solution here\n}\n\nsolve();\n`;
    case "sql":
      return `-- Task: ${conciseTask}\n-- Write your schema or query below\n\nSELECT 1;\n`;
    case "json":
      return `{\n  "task": ${JSON.stringify(conciseTask)},\n  "solution": {}\n}\n`;
    case "yaml":
      return `# Task: ${conciseTask}\nname: solution\nsteps:\n  # Add your configuration here\n`;
    case "bash":
      return `#!/usr/bin/env bash\nset -euo pipefail\n\n# Task: ${conciseTask}\n# Add your commands here\n`;
    case "markdown":
      return `# Solution\n\n## Approach\nExplain how you would solve the task.\n\n## Implementation\nProvide concrete steps, examples, commands, or code where relevant.\n\n## Validation\nExplain how you would verify the result.\n`;
  }
}

export function getRoadmapTask(
  role: LearningRole,
  level: RoadmapLevel,
  dayNumber: number,
  taskType: RoadmapTaskType
): RoadmapTask | null {
  if (!Number.isInteger(dayNumber) || dayNumber < 1) return null;
  const content = loadTaskContent(role, level);
  const day = content.days.find((candidate) => candidate.day === dayNumber);
  if (!day) return null;

  const taskDescription = day[taskType];
  const suggestedLanguage = inferLanguage(taskDescription, day.topics, taskType);
  return {
    role,
    level,
    dayNumber: day.day,
    dayTitle: day.title,
    roadmapTitle: content.roadmap.title,
    taskType,
    taskDescription,
    objectives: day.objectives,
    topics: day.topics,
    expectedOutcome: day.expected_outcome,
    difficulty: day.difficulty ?? level,
    suggestedLanguage,
    starterCode: starterFor(suggestedLanguage, taskDescription),
    skillsGained: day.skills_gained ?? [],
  };
}
