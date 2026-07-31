import crypto from "crypto";
import fs from "fs";
import path from "path";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ROLE_DETAILS, isLearningRole, type LearningRole } from "@/lib/learning/content";
import { resolveStageForScore } from "@/lib/roadmap/engine";
import { resolvePlacementThreshold } from "@/lib/roadmap/settings";
import { analyzeAssessmentWithAI, getFallbackAssessmentResult, type AIAssessmentResult } from "@/lib/ai/assessment";
import { recordVerifiedSkillsFromAssessment } from "@/lib/learning/verified-skills.server";

type Question = {
  id: string;
  topic: string;
  skill: string;
  difficulty: "Easy" | "Medium";
  weight: number;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  roadmap_reference: string;
};

type Bank = { assessment: { skills_assessed: string[] }; questions: Question[] };
type Attempt = {
  id: string;
  role: LearningRole;
  status: "in_progress" | "submitted" | "abandoned";
  seed: string;
  question_ids: string[];
  answers: Record<string, number>;
  answer_results: Record<string, { is_correct: boolean }>;
  shuffled_questions?: StoredShuffledQuestion[];
};

type ShuffledQuestion = {
  id: string;
  topic: string;
  skill: string;
  difficulty: "Easy" | "Medium";
  weight: number;
  question: string;
  options: string[];
  original_correct: number;
};

type StoredShuffledQuestion = ShuffledQuestion & { shuffled_correct: number };

export type Result<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; status?: number } };

const banks = new Map<LearningRole, Bank>();

function bank(role: LearningRole): Bank {
  const cached = banks.get(role);
  if (cached) return cached;

  const value = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "content/assessment", ROLE_DETAILS[role].assessmentFile),
      "utf8"
    )
  ) as Bank;

  const bySkill = new Map<string, number>();
  value.questions.forEach(q => bySkill.set(q.skill, (bySkill.get(q.skill) ?? 0) + 1));

  if (value.assessment.skills_assessed.length !== 10 || [...bySkill.values()].some(n => n < 2)) {
    throw new Error("Assessment bank schema is incomplete.");
  }

  banks.set(role, value);
  return value;
}

function rng(seed: string) {
  let value = 0;
  for (const char of seed) value = (value * 31 + char.charCodeAt(0)) >>> 0;
  return () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function pick<T>(items: T[], random: () => number, n: number): T[] {
  const copy = [...items];
  const result: T[] = [];
  while (result.length < n && copy.length) {
    result.push(copy.splice(Math.floor(random() * copy.length), 1)[0]!);
  }
  return result;
}

function selected(role: LearningRole, seed: string): string[] {
  const content = bank(role);
  const random = rng(seed);

  const ids = content.assessment.skills_assessed.flatMap(skill => {
    const qs = content.questions.filter(q => q.skill === skill);
    const medium = qs.filter(q => q.difficulty === "Medium");
    const easy = qs.filter(q => q.difficulty === "Easy");

    return medium.length && easy.length
      ? [pick(easy, random, 1)[0]!, pick(medium, random, 1)[0]!]
      : pick(qs, random, 2);
  }).map(q => q.id);

  return pick(ids, random, ids.length);
}

/**
 * Fisher-Yates shuffle with seeded random number generator
 */
function shuffle<T>(array: T[], random: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/**
 * Shuffle options for a question and track where the correct answer ends up
 */
function shuffleOptions(question: Question, random: () => number): ShuffledQuestion & { shuffled_correct: number } {
  const correctOption = question.options[question.correct_answer];
  const shuffledOptions = shuffle(question.options, random);
  const shuffled_correct = shuffledOptions.indexOf(correctOption);
  
  return {
    id: question.id,
    topic: question.topic,
    skill: question.skill,
    difficulty: question.difficulty,
    weight: question.weight,
    question: question.question,
    options: shuffledOptions,
    original_correct: question.correct_answer,
    shuffled_correct,
  };
}

/**
 * Prepare shuffled questions for an attempt
 */
function prepareShuffledQuestions(role: LearningRole, questionIds: string[], seed: string): StoredShuffledQuestion[] {
  const content = bank(role);
  const random = rng(seed + "_options");
  
  return questionIds.map(id => {
    const question = content.questions.find(q => q.id === id)!;
    return shuffleOptions(question, random);
  });
}

function publicQuestion(question: StoredShuffledQuestion) {
  const { shuffled_correct, ...safe } = question;
  return { ...safe, correct_answer: shuffled_correct };
}

async function userAndRole() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, role: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("learning_role")
    .eq("user_id", user.id)
    .maybeSingle();

  const role = isLearningRole(profile?.learning_role) ? profile.learning_role : null;
  return { supabase, user, role };
}

export async function startAttempt(): Promise<Result<{
  attemptId: string;
  questions: ReturnType<typeof publicQuestion>[];
  answers: Record<string, number>;
}>> {
  const { supabase, user, role } = await userAndRole();
  if (!user) return { data: null, error: { message: "Please sign in to start the assessment.", status: 401 } };
  if (!role) return { data: null, error: { message: "Please complete onboarding and select a learning role first.", status: 403 } };

  const { data: active } = await supabase
    .from("assessment_results")
    .select("id,seed,question_ids,answers,shuffled_questions")
    .eq("user_id", user.id)
    .eq("role", role)
    .eq("status", "in_progress")
    .maybeSingle();

  let row = active;
  if (!row) {
    const { count } = await supabase
      .from("assessment_results")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("role", role);

    const seed = crypto.randomUUID();
    const questionIds = selected(role, seed);
    const shuffledQuestions = prepareShuffledQuestions(role, questionIds, seed);

    const { data, error } = await supabase
      .from("assessment_results")
      .insert({
        user_id: user.id,
        role,
        attempt_number: (count ?? 0) + 1,
        seed,
        question_ids: questionIds,
        shuffled_questions: shuffledQuestions,
        status: "in_progress",
      })
      .select("id,seed,question_ids,answers,shuffled_questions")
      .single();

    if (error || !data) return { data: null, error: { message: "Could not start your assessment.", status: 500 } };
    row = data;
  }

  const shuffledQuestions = (row.shuffled_questions ?? []) as StoredShuffledQuestion[];
  
  // If shuffled questions not stored (legacy data), create them on the fly
  if (shuffledQuestions.length === 0) {
    const questionIds = (row.question_ids as string[]) || [];
    const freshShuffled = prepareShuffledQuestions(role, questionIds, row.seed);
    
    await supabase
      .from("assessment_results")
      .update({ shuffled_questions: freshShuffled })
      .eq("id", row.id);
    
    return {
      data: {
        attemptId: row.id,
        questions: freshShuffled.map(q => publicQuestion(q)),
        answers: (row.answers ?? {}) as Record<string, number>,
      },
      error: null,
    };
  }

  return {
    data: {
      attemptId: row.id,
      questions: shuffledQuestions.map(q => publicQuestion(q)),
      answers: (row.answers ?? {}) as Record<string, number>,
    },
    error: null,
  };
}

export async function recordAnswer(
  attemptId: string,
  questionId: string,
  selectedIndex: number
): Promise<Result<{ correct_answer: number; is_correct: boolean; explanation: string }>> {
  if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex > 3) {
    return { data: null, error: { message: "Invalid answer option.", status: 422 } };
  }

  const { supabase, user } = await userAndRole();
  if (!user) return { data: null, error: { message: "Please sign in again.", status: 401 } };

  const { data: row } = await supabase
    .from("assessment_results")
    .select("id,role,status,question_ids,answers,answer_results,shuffled_questions,seed")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!row || row.status !== "in_progress" || !isLearningRole(row.role) || !(row.question_ids as string[]).includes(questionId)) {
    return { data: null, error: { message: "Assessment question was not found.", status: 404 } };
  }

  const question = bank(row.role).questions.find(q => q.id === questionId)!;
  const shuffledQuestions = (row.shuffled_questions ?? []) as StoredShuffledQuestion[];
  const shuffledQuestion = shuffledQuestions.find(q => q.id === questionId);
  
  // Use shuffled correct answer if available, otherwise fall back to original
  const correctAnswer = shuffledQuestion?.shuffled_correct ?? question.correct_answer;
  
  const answers = (row.answers ?? {}) as Record<string, number>;
  const results = (row.answer_results ?? {}) as Record<string, { is_correct: boolean }>;

  if (answers[questionId] !== undefined) {
    return {
      data: {
        correct_answer: correctAnswer,
        is_correct: results[questionId]!.is_correct,
        explanation: question.explanation,
      },
      error: null,
    };
  }

  answers[questionId] = selectedIndex;
  results[questionId] = { is_correct: selectedIndex === correctAnswer };

  const { error } = await supabase
    .from("assessment_results")
    .update({ answers, answer_results: results })
    .eq("id", attemptId)
    .eq("status", "in_progress");

  if (error) return { data: null, error: { message: "Could not record your answer." } };

  return {
    data: {
      correct_answer: correctAnswer,
      is_correct: results[questionId]!.is_correct,
      explanation: question.explanation,
    },
    error: null,
  };
}

export async function finishAttempt(attemptId: string): Promise<Result<{
  overall: number;
  level: string;
  skillScores: { skill: string; score: number; band: string }[];
  aiInsights?: AIAssessmentResult;
}>> {
  const { supabase, user } = await userAndRole();
  if (!user) return { data: null, error: { message: "Please sign in again.", status: 401 } };

  const { data: row } = await supabase
    .from("assessment_results")
    .select("*")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .maybeSingle() as { data: Attempt | null };

  if (!row || !isLearningRole(row.role)) {
    return { data: null, error: { message: "Assessment not found.", status: 404 } };
  }
  if (row.status === "abandoned") {
    return { data: null, error: { message: "This assessment is no longer active.", status: 409 } };
  }

  const qs = (row.question_ids).map(id => bank(row.role).questions.find(q => q.id === id)!);
  const shuffledQuestions = (row.shuffled_questions ?? []) as StoredShuffledQuestion[];

  if (Object.keys(row.answers ?? {}).length !== qs.length) {
    return { data: null, error: { message: "Answer every question before finishing.", status: 422 } };
  }

  // Calculate skill scores using shuffled correct answers
  const skillScores = bank(row.role).assessment.skills_assessed.map(skill => {
    const own = qs.filter(q => q.skill === skill);
    const possible = own.reduce((n, q) => n + (q.difficulty === "Medium" ? 1.3 : 1), 0);
    
    const earned = own.reduce((n, q) => {
      // Check if the user's answer matches the shuffled correct answer
      const isCorrect = row.answer_results[q.id]?.is_correct === true;
      return n + (isCorrect ? (q.difficulty === "Medium" ? 1.3 : 1) : 0);
    }, 0);
    
    const score = Math.round(100 * earned / possible);
    return { skill, score, band: score < 40 ? "weak" : score < 75 ? "developing" : "strong" };
  });

  const overall = Math.round(skillScores.reduce((n, s) => n + s.score, 0) / skillScores.length);
  const weak = skillScores.filter(s => s.band === "weak").sort((a, b) => a.score - b.score);
  const strong = skillScores.filter(s => s.band === "strong").sort((a, b) => b.score - a.score);

  // Placement is now a single configurable score threshold, resolved through
  // the roadmap engine (DB setting -> env var -> default 60). The previous
  // rule also required `strong.length >= 6 && weak.length <= 1`, which made
  // placement depend on how many skills a role's assessment happened to cover.
  const placementThreshold = await resolvePlacementThreshold();
  const level = resolveStageForScore(overall, placementThreshold);

  const roadmapFile = ROLE_DETAILS[row.role].roadmap[level as "beginner" | "intermediate"];
  const roadmap = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "content/roadmap", roadmapFile), "utf8")
  ) as { days: { day: number; title: string; skills_gained?: string[] }[] };

  // Get AI insights for the assessment
  let aiInsights: AIAssessmentResult | undefined = undefined;
  try {
    const aiResult = await analyzeAssessmentWithAI(row.role, skillScores, overall);
    if (aiResult) {
      aiInsights = aiResult;
    }
  } catch {
    // Fall back to basic analysis if AI fails
    aiInsights = getFallbackAssessmentResult(skillScores, overall);
  }

  const graph = {
    role: row.role,
    level,
    overall,
    skills: skillScores.map(s => ({
      ...s,
      related_days: roadmap.days
        .filter(day =>
          [day.title, ...(day.skills_gained ?? [])].some(text =>
            text.toLowerCase().includes(s.skill.toLowerCase()) ||
            s.skill.toLowerCase().includes(text.toLowerCase())
          )
        )
        .map(day => day.day),
      recommendation: s.band === "weak" ? "reinforce" : s.band === "strong" ? "compress" : "keep",
      ai_insight: aiInsights?.skillAnalysis.find(sa => sa.skill === s.skill)?.insight,
    })),
    weak_skills: weak.map(s => s.skill),
    strong_skills: strong.map(s => s.skill),
    ai_insights: aiInsights ? {
      weak_areas: aiInsights.weakAreas,
      strong_areas: aiInsights.strongAreas,
      personalized_tips: aiInsights.personalizedTips,
      roadmap_focus_weeks: aiInsights.roadmapRecommendation.focusWeeks,
      priority_skills: aiInsights.roadmapRecommendation.prioritySkills,
      estimated_timeline: aiInsights.estimatedTimeline,
    } : undefined,
    generated_at: new Date().toISOString(),
  };

  const { error: skillsError } = await supabase.from("skill_scores").upsert(
    skillScores.map(s => ({ assessment_result_id: attemptId, user_id: user.id, ...s })),
    { onConflict: "assessment_result_id,skill" }
  );
  if (skillsError) {
    return { data: null, error: { message: "Could not save your skill scores. Please retry.", status: 500 } };
  }

  const { error: graphError } = await supabase.from("knowledge_graph").upsert(
    { assessment_result_id: attemptId, user_id: user.id, graph },
    { onConflict: "assessment_result_id" }
  );
  if (graphError) {
    return { data: null, error: { message: "Could not save your assessment profile. Please retry.", status: 500 } };
  }

  const submittedAt = new Date().toISOString();
  const { data: submitted, error: submitError } = await supabase
    .from("assessment_results")
    .update({ status: "submitted", overall_score: overall, aggregate_score: overall, level, submitted_at: submittedAt })
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (submitError || !submitted) {
    return { data: null, error: { message: "Could not finish your assessment. Please retry.", status: 500 } };
  }

  // Grant verified-skill rows for any `band = strong` skills so the public
  // profile's "Verified skills" radar populates. Best-effort — failures here
  // are logged inside the helper and must not fail the submission.
  await recordVerifiedSkillsFromAssessment(user.id, skillScores, attemptId);

  // Update user's total score with assessment performance
  // Assessment contributes to completion_pts (up to 100 points max)
  const assessmentScorePoints = Math.round(overall * 0.5); // 50% weight for assessment
  
  try {
    const { error: rpcError } = await supabase.rpc("update_user_score_from_assessment", {
      p_user_id: user.id,
      p_assessment_score: overall,
      p_points: assessmentScorePoints,
    });
    
    if (rpcError) {
      throw rpcError;
    }
  } catch {
    // Fallback: direct update if RPC doesn't exist
    const { data: scoreData } = await supabase
      .from("scores")
      .select("completion_pts, total")
      .eq("user_id", user.id)
      .single();
    
    const currentCompletionPts = scoreData?.completion_pts ?? 0;
    const currentTotal = scoreData?.total ?? 0;
    const newCompletionPts = Math.max(currentCompletionPts, assessmentScorePoints);
    const newTotal = currentTotal - currentCompletionPts + newCompletionPts;
    
    await supabase
      .from("scores")
      .update({
        completion_pts: newCompletionPts,
        total: newTotal,
        last_calculated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
  }

  return { data: { overall, level, skillScores, aiInsights }, error: null };
}
