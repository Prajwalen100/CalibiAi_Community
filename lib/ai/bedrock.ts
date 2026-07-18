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
