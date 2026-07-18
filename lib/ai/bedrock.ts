import { RoadmapSchema, type GeneratedRoadmap } from "@/lib/ai/schemas";

type RoadmapInput = { role: string; level: "beginner" | "intermediate" | "advanced"; tasks: string[] };

function fallbackRoadmap(input: RoadmapInput): GeneratedRoadmap {
  return {
    role: input.role,
    level: input.level,
    modules: [
      { id: "foundation-git-api", title: "Ship a small API-backed AI utility", outcome: "Use Git, TypeScript and an API route to deploy a working tool.", build_task: "Build and deploy a simple AI prompt helper with a README and demo link.", verification_artifact: "github_repo", estimated_hours: 10 },
      { id: "prompt-evaluation", title: "Prompting and evaluation", outcome: "Create prompts with measurable outputs and basic regression checks.", build_task: "Submit a prompt playground runbook with examples, failures and fixes.", verification_artifact: "hands_on_assessment", estimated_hours: 8 },
      { id: "rag-project", title: "RAG flagship project", outcome: "Build a PDF chat app with citations and retrieval quality notes.", build_task: "Deploy a RAG app, link the live URL and GitHub repo, and document source citations.", verification_artifact: "live_url", estimated_hours: 24 },
      { id: "capstone-review", title: "Verified capstone review", outcome: "Pass originality and skill review for a startup-readable profile.", build_task: "Submit the capstone for integrity review and improve it from reviewer feedback.", verification_artifact: "hands_on_assessment", estimated_hours: 16 }
    ],
    next_action: "Complete onboarding details and start the first API-backed AI utility task."
  };
}

async function invokeClaude(prompt: string): Promise<string | null> {
  if (!process.env.AWS_REGION || !process.env.BEDROCK_CLAUDE_MODEL_ID) return null;
  const { BedrockRuntimeClient, InvokeModelCommand } = await import("@aws-sdk/client-bedrock-runtime");
  const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
  const body = JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 1400,
    temperature: 0.2,
    messages: [{ role: "user", content: [{ type: "text", text: prompt }] }]
  });
  const response = await client.send(new InvokeModelCommand({ modelId: process.env.BEDROCK_CLAUDE_MODEL_ID, contentType: "application/json", accept: "application/json", body }));
  const decoded = new TextDecoder().decode(response.body);
  const parsed = JSON.parse(decoded) as { content?: Array<{ text?: string }> };
  return parsed.content?.map((part) => part.text ?? "").join("\n") ?? null;
}

export async function generatePersonalizedRoadmap(input: RoadmapInput): Promise<GeneratedRoadmap> {
  const prompt = `Return only strict JSON for a CalibiAI personalized roadmap. It must strengthen verified talent signal, not course consumption. Role: ${input.role}. Level: ${input.level}. Quick tasks/self assessment: ${input.tasks.join(", ")}. Schema keys: role, level, modules[] with id,title,outcome,build_task,verification_artifact(github_repo|live_url|hands_on_assessment|leaderboard_rank),estimated_hours, and next_action.`;
  try {
    const raw = await invokeClaude(prompt);
    if (!raw) return fallbackRoadmap(input);
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const candidate = jsonStart >= 0 && jsonEnd >= 0 ? raw.slice(jsonStart, jsonEnd + 1) : raw;
    return RoadmapSchema.parse(JSON.parse(candidate));
  } catch {
    return fallbackRoadmap(input);
  }
}

export async function runPromptPlayground(prompt: string): Promise<string> {
  const response = await invokeClaude(`CalibiAI Prompt Playground. Respond helpfully and concisely. Student prompt:\n${prompt}`);
  return response ?? "Bedrock is not configured yet. Add AWS_REGION and BEDROCK_CLAUDE_MODEL_ID on Vercel to enable this server-side lab.";
}

export type ProjectReviewResult = {
  score: number;          // 0–100
  complexity_tier: "beginner" | "intermediate" | "advanced";
  originality_status: "passed" | "flagged" | "pending";
  feedback: string;
  strengths: string[];
  improvements: string[];
};

function fallbackReview(input: { title: string; description: string; howItWorks: string; repoUrl?: string; liveUrl?: string }): ProjectReviewResult {
  const hasLinks = !!(input.repoUrl || input.liveUrl);
  const hasDesc = input.description.length > 50;
  const hasHow = input.howItWorks.length > 50;
  let score = 20;
  if (hasLinks) score += 20;
  if (hasDesc) score += 15;
  if (hasHow) score += 15;
  if (input.repoUrl && input.liveUrl) score += 10;
  return {
    score: Math.min(score, 80),
    complexity_tier: score >= 60 ? "intermediate" : "beginner",
    originality_status: "pending",
    feedback: "Automated review (Bedrock offline). Full AI review will run once Bedrock is configured.",
    strengths: [hasLinks ? "Project includes verifiable links." : "Consider adding a live URL or GitHub repo.", hasDesc ? "Good project description provided." : "Add more detail to your description."],
    improvements: ["Submit again after Bedrock is configured for a detailed review.", hasHow ? "" : "Explain how the project works in more detail."].filter(Boolean),
  };
}

export async function reviewProject(input: { title: string; description: string; howItWorks: string; repoUrl?: string; liveUrl?: string }): Promise<ProjectReviewResult> {
  const prompt = `You are CalibiAI's project reviewer. Evaluate this student project submission and return ONLY strict JSON.

Project details:
- Title: ${input.title}
- Description: ${input.description}
- How it works: ${input.howItWorks}
- GitHub repo: ${input.repoUrl || "Not provided"}
- Live URL: ${input.liveUrl || "Not provided"}

Return JSON with these exact keys:
{
  "score": <number 0-100, based on completeness, technical depth, originality, and verifiability>,
  "complexity_tier": <"beginner" | "intermediate" | "advanced">,
  "originality_status": <"passed" | "flagged" | "pending">,
  "feedback": <string, 2-3 sentence overall assessment>,
  "strengths": <string array, 2-4 specific strengths>,
  "improvements": <string array, 2-4 specific actionable improvements>
}

Scoring guide:
- 0-30: Incomplete or placeholder submission
- 31-50: Basic project, missing links or shallow description
- 51-70: Solid project with working links and decent description
- 71-85: Strong project with clear explanation and live demo
- 86-100: Exceptional project with originality, depth, and full verification

Mark originality as "flagged" only if the description appears copied or AI-generated without personal input. Use "pending" if there's not enough evidence. Use "passed" if it looks genuine.`;

  try {
    const raw = await invokeClaude(prompt);
    if (!raw) return fallbackReview(input);
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const candidate = jsonStart >= 0 && jsonEnd >= 0 ? raw.slice(jsonStart, jsonEnd + 1) : raw;
    const parsed = JSON.parse(candidate) as ProjectReviewResult;
    // Validate critical fields
    if (typeof parsed.score !== "number" || parsed.score < 0 || parsed.score > 100) throw new Error("Invalid score");
    if (!["beginner", "intermediate", "advanced"].includes(parsed.complexity_tier)) parsed.complexity_tier = "beginner";
    if (!["passed", "flagged", "pending"].includes(parsed.originality_status)) parsed.originality_status = "pending";
    if (!Array.isArray(parsed.strengths)) parsed.strengths = [String(parsed.strengths)];
    if (!Array.isArray(parsed.improvements)) parsed.improvements = [String(parsed.improvements)];
    return parsed;
  } catch {
    return fallbackReview(input);
  }
}
