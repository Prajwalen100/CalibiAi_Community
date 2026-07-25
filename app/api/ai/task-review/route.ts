import { NextResponse } from "next/server";
import { deepseekChat, deepseekConfigured } from "@/lib/ai/deepseek";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!deepseekConfigured()) {
      return NextResponse.json({
        score: 65,
        feedback: "DeepSeek is not configured. This is a demo score based on submission completeness.",
        strengths: ["Submission received"],
        improvements: ["Configure DeepSeek for real-time AI scoring"],
      }, { status: 200 });
    }

    const body = await request.json().catch(() => ({}));
    const { taskType, taskDescription, text, dayNumber } = body;

    const prompt = `You are an AI assessment reviewer for CalibiAI. Evaluate the following student submission for Day ${dayNumber || "unknown"} (${taskType || "task"}).

Task Description:
${taskDescription || "No description provided."}

Student Submission:
${text || "No text submitted."}

Return ONLY valid JSON with exactly this structure:
{
  "score": 0-100,
  "feedback": "2-3 paragraph detailed feedback",
  "strengths": ["2-4 specific strengths"],
  "improvements": ["2-3 concrete improvements"]
}

Scoring Rubric:
- 80-100: Excellent depth, correct approach, well-documented, shows real-world understanding.
- 60-79: Good work with minor gaps or missing documentation.
- 40-59: Basic attempt with significant missing elements.
- 0-39: Incomplete, incorrect approach, or missing submission.

Be specific, constructive, and reference the task description directly.`;

    const raw = await deepseekChat({
      system: "You are a precise JSON-only evaluator. Always return valid JSON matching the requested schema. Be fair but rigorous.",
      user: prompt,
      maxTokens: 1200,
      temperature: 0.3,
      json: true,
    });

    let result: { score: number; feedback?: string; strengths?: string[]; improvements?: string[] } | null = null;
    try {
      const jsonStart = raw.indexOf("{");
      const jsonEnd = raw.lastIndexOf("}");
      const candidate = jsonStart >= 0 && jsonEnd >= 0 ? raw.slice(jsonStart, jsonEnd + 1) : raw;
      result = JSON.parse(candidate);
    } catch {
      result = {
        score: 60,
        feedback: "AI review completed with a fallback evaluation due to parsing issues.",
        strengths: ["Submission received"],
        improvements: ["Ensure submissions are clearly structured"],
      };
    }

    // Validate
    if (!result) {
      result = {
        score: 60,
        feedback: "AI review completed with a fallback evaluation.",
        strengths: ["Submission received"],
        improvements: ["Continue practicing"],
      };
    }
    if (typeof result.score !== "number" || result.score < 0 || result.score > 100) {
      result.score = Math.min(100, Math.max(0, result.score ?? 60));
    }
    if (!Array.isArray(result.strengths)) result.strengths = ["Submission received"];
    if (!Array.isArray(result.improvements)) result.improvements = ["Continue practicing"];

    return NextResponse.json({
      score: result.score,
      feedback: result.feedback || "No detailed feedback available.",
      strengths: result.strengths,
      improvements: result.improvements,
    });
  } catch (err) {
    console.error("Task review error:", err);
    return NextResponse.json({
      score: 55,
      feedback: "An error occurred during AI review. A fallback score was assigned.",
      strengths: ["Attempt made"],
      improvements: ["Retry submission when service is stable"],
    }, { status: 200 });
  }
}
