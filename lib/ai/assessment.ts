import { deepseekChat, deepseekConfigured } from "@/lib/ai/deepseek";

export type AIAssessmentResult = {
  overallBand: "beginner" | "intermediate" | "advanced" | "developing";
  skillAnalysis: {
    skill: string;
    level: "weak" | "developing" | "strong";
    strength: number; // 0-100
    insight: string;
    recommendation: string;
  }[];
  weakAreas: string[];
  strongAreas: string[];
  personalizedTips: string[];
  roadmapRecommendation: {
    focusWeeks: number[];
    skipDays: number[];
    prioritySkills: string[];
  };
  estimatedTimeline: string;
  confidence: number; // 0-1, how confident the AI is in this assessment
};

type SkillScore = {
  skill: string;
  score: number;
  band: string;
};

const SYSTEM_PROMPT = `You are CalibiAI's AI Assessment Analyst. Your role is to analyze student assessment results and provide personalized, actionable insights. You have deep expertise in software engineering, AI/ML, data science, and related fields.

IMPORTANT RULES:
1. Always return valid JSON matching the requested schema
2. Be specific and actionable in your recommendations
3. Consider the holistic picture of the student's skills
4. Never make up skills or data not present in the input
5. Provide confidence scores that reflect the certainty of your analysis
6. Focus on practical, achievable recommendations`;

async function invokeModel(prompt: string): Promise<string | null> {
  if (!deepseekConfigured()) return null;
  try {
    return await deepseekChat({
      system: SYSTEM_PROMPT,
      user: prompt,
      maxTokens: 2000,
      temperature: 0.3,
      json: true,
    });
  } catch {
    return null;
  }
}

export async function analyzeAssessmentWithAI(
  role: string,
  skillScores: SkillScore[],
  overallScore: number
): Promise<AIAssessmentResult | null> {
  const skillList = skillScores.map(s => 
    `- ${s.skill}: ${s.score}% (${s.band})`
  ).join("\n");

  const prompt = `Analyze this student's assessment results and provide personalized insights.

Student Profile:
- Role: ${role}
- Overall Score: ${overallScore}%

Skill Breakdown:
${skillList}

Return ONLY valid JSON with this exact structure:
{
  "overallBand": "beginner" | "intermediate" | "advanced",
  "skillAnalysis": [
    {
      "skill": "string",
      "level": "weak" | "developing" | "strong",
      "strength": 0-100,
      "insight": "2-3 sentence specific insight about this skill level",
      "recommendation": "Specific action to improve or maintain this skill"
    }
  ],
  "weakAreas": ["list of 2-3 specific weak areas with concrete examples"],
  "strongAreas": ["list of 2-3 specific strong areas"],
  "personalizedTips": ["5-6 actionable tips tailored to this student's profile"],
  "roadmapRecommendation": {
    "focusWeeks": [week numbers 1-7 that need extra focus based on weak skills],
    "skipDays": [day numbers that can be accelerated due to strong foundations],
    "prioritySkills": ["top 3-5 skills to focus on first"]
  },
  "estimatedTimeline": "realistic time estimate for reaching intermediate level",
  "confidence": 0.0-1.0
}

Scoring Guide:
- 0-39%: weak/beginner
- 40-74%: developing
- 75-100%: strong/intermediate

Consider:
- The overall score as the primary indicator
- Consistency across skills
- Practical application readiness
- Industry expectations for the role`;

  try {
    const raw = await invokeModel(prompt);
    if (!raw) return null;

    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const candidate = jsonStart >= 0 && jsonEnd >= 0 ? raw.slice(jsonStart, jsonEnd + 1) : raw;

    const result = JSON.parse(candidate) as AIAssessmentResult;

    // Validate the result structure
    if (!result.overallBand || !Array.isArray(result.skillAnalysis) || !result.weakAreas || !result.strongAreas) {
      return null;
    }

    return result;
  } catch {
    return null;
  }
}

export async function generateWeeklySummaryWithAI(
  role: string,
  weekNumber: number,
  completedDays: { day: number; title: string; status: string }[],
  skillScores: SkillScore[]
): Promise<{
  summary: string;
  achievements: string[];
  improvements: string[];
  nextWeekTips: string[];
} | null> {
  const completedList = completedDays.map(d => 
    `- Day ${d.day}: ${d.title} (${d.status})`
  ).join("\n");

  const prompt = `Generate a weekly learning summary for a student.

Student Profile:
- Role: ${role}
- Week: ${weekNumber}
- Skill Scores: ${JSON.stringify(skillScores)}

Completed This Week:
${completedList || "No days completed yet"}

Return ONLY valid JSON:
{
  "summary": "2-3 sentence overall summary of the week's progress",
  "achievements": ["3-4 specific achievements from this week"],
  "improvements": ["2-3 areas that need improvement next week"],
  "nextWeekTips": ["5-6 specific tips for the upcoming week"]
}`;

  try {
    const raw = await invokeModel(prompt);
    if (!raw) return null;

    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const candidate = jsonStart >= 0 && jsonEnd >= 0 ? raw.slice(jsonStart, jsonEnd + 1) : raw;

    const result = JSON.parse(candidate) as {
      summary: string;
      achievements: string[];
      improvements: string[];
      nextWeekTips: string[];
    };

    if (!result.summary || !result.achievements) {
      return null;
    }

    return result;
  } catch {
    return null;
  }
}

// Fallback results when AI is not available
export function getFallbackAssessmentResult(
  skillScores: SkillScore[],
  overallScore: number
): AIAssessmentResult {
  const weak = skillScores.filter(s => s.score < 40).map(s => s.skill);
  const strong = skillScores.filter(s => s.score >= 75).map(s => s.skill);

  return {
    overallBand: overallScore >= 75 ? "intermediate" : overallScore >= 40 ? "developing" : "beginner",
    skillAnalysis: skillScores.map(s => ({
      skill: s.skill,
      level: s.score < 40 ? "weak" : s.score < 75 ? "developing" : "strong",
      strength: s.score,
      insight: s.score < 40 
        ? `${s.skill} needs significant improvement. Focus on fundamentals and practice.`
        : s.score < 75
          ? `${s.skill} is at a developing level. More practice will strengthen this skill.`
          : `${s.skill} is a strong area. Keep practicing to maintain proficiency.`,
      recommendation: s.score < 40 
        ? `Dedicate extra time to ${s.skill} fundamentals in the coming weeks.`
        : s.score < 75
          ? `Continue practicing ${s.skill} through projects and exercises.`
          : `Use ${s.skill} knowledge to build portfolio projects.`,
    })),
    weakAreas: weak.slice(0, 3),
    strongAreas: strong.slice(0, 3),
    personalizedTips: [
      "Focus on completing daily tasks consistently",
      "Practice coding exercises for weaker skills",
      "Build small projects to reinforce learning",
      "Review explanations for incorrectly answered questions",
      "Set up a dedicated learning schedule",
    ],
    roadmapRecommendation: {
      focusWeeks: [1, 2, 3], // First few weeks for fundamentals
      skipDays: strong.length > 2 ? [1, 2] : [], // Skip basics if strong
      prioritySkills: weak.slice(0, 5),
    },
    estimatedTimeline: weak.length > 3 ? "10-12 weeks" : "6-8 weeks",
    confidence: 0.6, // Lower confidence for fallback
  };
}
