import fs from "fs";
import path from "path";

export const LEARNING_ROLES = ["genai_engineer", "ai_engineer", "ai_automation_engineer", "data_science_engineer"] as const;
export type LearningRole = (typeof LEARNING_ROLES)[number];

export const ROLE_DETAILS: Record<LearningRole, { title: string; description: string; icon: string; assessmentFile: string; roadmap: Record<"beginner" | "intermediate", string> }> = {
  genai_engineer: { title: "GenAI Engineer", description: "Build production-ready LLM and RAG applications.", icon: "✨", assessmentFile: "genai_engineer_beginner_assessment.json", roadmap: { beginner: "roadmap_genai_beginner.json", intermediate: "roadmap_genai_intermediate.json" } },
  ai_engineer: { title: "AI Engineer", description: "Engineer reliable machine learning systems.", icon: "🧠", assessmentFile: "ai_engineer_beginner_assessment.json", roadmap: { beginner: "roadmap_ai_engineer_beginner.json", intermediate: "roadmap_ai_engineer_intermediate.json" } },
  ai_automation_engineer: { title: "AI Automation Engineer", description: "Automate workflows with AI agents and integrations.", icon: "⚡", assessmentFile: "ai_automation_engineer_beginner_assessment.json", roadmap: { beginner: "roadmap_automation_beginner.json", intermediate: "roadmap_automation_intermediate.json" } },
  data_science_engineer: { title: "Data Science Engineer", description: "Turn data into models, insight, and measurable value.", icon: "📊", assessmentFile: "data_science_engineer_beginner_assessment.json", roadmap: { beginner: "roadmap_ds_beginner.json", intermediate: "roadmap_ds_intermidiate.json" } },
};

export function isLearningRole(value: unknown): value is LearningRole {
  return typeof value === "string" && LEARNING_ROLES.includes(value as LearningRole);
}

export function getRoleSkills(role: LearningRole): string[] {
  const file = path.join(process.cwd(), "content", "assessment", ROLE_DETAILS[role].assessmentFile);
  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as { assessment?: { skills_assessed?: string[] } };
  return parsed.assessment?.skills_assessed ?? [];
}
