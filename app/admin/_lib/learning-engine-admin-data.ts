import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export type HealthTone = "ok" | "warn" | "danger" | "info";

export type RoleKey =
  | "genai_engineer"
  | "ai_engineer"
  | "ai_automation_engineer"
  | "data_science_engineer";

export type RoadmapLevel = "beginner" | "intermediate";

export type RoleDefinition = {
  key: RoleKey;
  label: string;
  shortLabel: string;
  accent: string;
  description: string;
  assessmentFile: string;
  roadmapFiles: Record<RoadmapLevel, string>;
};

export type AssessmentSummary = {
  role: RoleDefinition;
  fileName: string;
  hash: string | null;
  status: HealthTone;
  checks: string[];
  title: string;
  totalQuestions: number;
  expectedQuestions: number;
  generatedAssessmentSize: number;
  questionsPerSkillSelected: number;
  totalWeight: number;
  passingScore: string;
  answerReveal: string;
  skillCount: number;
  skills: string[];
  difficultyCounts: Record<string, number>;
  skillDistribution: Array<{ skill: string; count: number; easy: number; medium: number }>;
  validAnswerIndexes: number;
  invalidAnswerIndexes: number;
  sampleQuestions: Array<{ id: string; skill: string; difficulty: string; question: string }>;
};

export type RoadmapSummary = {
  role: RoleDefinition;
  level: RoadmapLevel;
  fileName: string;
  hash: string | null;
  status: HealthTone;
  checks: string[];
  title: string;
  description: string;
  outcome: string;
  totalDays: number;
  expectedDays: number;
  weekCount: number;
  sequentialDays: boolean;
  firstDayTitle: string;
  lastDayTitle: string;
  difficultyCounts: Record<string, number>;
  resourceTotals: {
    videos: number;
    docs: number;
    repositories: number;
    papers: number;
    quizQuestions: number;
    assignments: number;
    practicalTasks: number;
    projects: number;
  };
  topSkills: Array<{ skill: string; count: number }>;
};

export type RepositoryStatus = {
  apiRoutes: Array<{ method: string; path: string; file: string; owner: string; status: HealthTone; present: boolean }>;
  databaseTables: Array<{ table: string; owner: string; status: HealthTone; present: boolean }>;
  migrationsCount: number;
};

export type RoleReadiness = {
  role: RoleDefinition;
  status: HealthTone;
  assessmentStatus: HealthTone;
  beginnerStatus: HealthTone;
  intermediateStatus: HealthTone;
  skillCount: number;
  questionCount: number;
  roadmapDays: number;
};

export type LearningEngineAdminData = {
  generatedAt: string;
  spec: typeof SPEC_DETAILS;
  roles: RoleDefinition[];
  assessments: AssessmentSummary[];
  roadmaps: RoadmapSummary[];
  readiness: RoleReadiness[];
  totals: {
    roles: number;
    assessmentBanks: number;
    assessmentQuestions: number;
    generatedAssessmentQuestions: number;
    roadmapFiles: number;
    roadmapDays: number;
    quizQuestions: number;
    resourceLinks: number;
    projects: number;
    assignments: number;
  };
  repositoryStatus: RepositoryStatus;
};

type JsonRecord = Record<string, unknown>;

type AssessmentQuestion = {
  id?: string;
  topic?: string;
  skill?: string;
  difficulty?: string;
  weight?: number;
  question?: string;
  options?: unknown[];
  correct_answer?: number;
};

type AssessmentContent = {
  assessment?: {
    id?: string;
    title?: string;
    role?: string;
    total_questions?: number;
    total_weight?: number;
    passing_score?: number | null;
    questions_per_skill?: number;
    selection?: {
      questions_per_skill_selected?: number;
      generated_assessment_size?: number;
    };
    skills_assessed?: unknown[];
    answer_reveal?: string;
  };
  questions?: AssessmentQuestion[];
};

type RoadmapDay = {
  day?: number;
  title?: string;
  difficulty?: string;
  youtube?: unknown[];
  official_docs?: unknown[];
  github_repositories?: unknown[];
  research_papers?: unknown[];
  quiz?: unknown[];
  assignment?: string;
  practical_task?: string;
  mini_project?: string;
  skills_gained?: unknown[];
};

type RoadmapContent = {
  roadmap?: {
    title?: string;
    role?: string;
    level?: string;
    total_days?: number;
    description?: string;
    outcome?: string;
  };
  days?: RoadmapDay[];
};

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    key: "genai_engineer",
    label: "GenAI Engineer",
    shortLabel: "GenAI",
    accent: "from-sky-400 to-blue-600",
    description: "LLM apps, prompt engineering, embeddings, RAG, AI agents and MCP.",
    assessmentFile: "genai_engineer_beginner_assessment.json",
    roadmapFiles: {
      beginner: "roadmap_genai_beginner.json",
      intermediate: "roadmap_genai_intermediate.json",
    },
  },
  {
    key: "ai_engineer",
    label: "AI Engineer",
    shortLabel: "AI Eng",
    accent: "from-violet-400 to-fuchsia-600",
    description: "ML foundations, deep learning, deployment and production AI engineering.",
    assessmentFile: "ai_engineer_beginner_assessment.json",
    roadmapFiles: {
      beginner: "roadmap_ai_engineer_beginner.json",
      intermediate: "roadmap_ai_engineer_intermediate.json",
    },
  },
  {
    key: "ai_automation_engineer",
    label: "AI Automation Engineer",
    shortLabel: "Automation",
    accent: "from-emerald-400 to-teal-600",
    description: "Workflow automation, agentic processes, integrations and practical AI ops.",
    assessmentFile: "ai_automation_engineer_beginner_assessment.json",
    roadmapFiles: {
      beginner: "roadmap_automation_beginner.json",
      intermediate: "roadmap_automation_intermediate.json",
    },
  },
  {
    key: "data_science_engineer",
    label: "Data Science Engineer",
    shortLabel: "Data Science",
    accent: "from-amber-400 to-orange-600",
    description: "Statistics, analytics, data pipelines, ML modeling and data storytelling.",
    assessmentFile: "data_science_engineer_beginner_assessment.json",
    roadmapFiles: {
      beginner: "roadmap_ds_beginner.json",
      intermediate: "roadmap_ds_intermidiate.json",
    },
  },
];

export const SPEC_DETAILS = {
  title: "CalibiAI Personalized Learning Engine",
  version: "1.0",
  stack: "Next.js 15/16 App Router · Supabase DB/Auth · Amazon Bedrock · JSON Knowledge Base",
  scope:
    "Personalized Learning Engine only: onboarding, assessment, scoring, knowledge graph, roadmap assignment, daily missions, progress, Talent Score, and weekly review.",
  sourceFile: "CalibiAI_Personalized_Learning_Engine_Spec.pdf",
  adminMode:
    "Testing console. It is intentionally isolated at /admin, read-only, and content-driven so it does not mutate learner, community, LMS, recruiter, or marketing flows.",
} as const;

export const SUCCESS_METRICS = [
  { metric: "Onboarding completion", target: ">= 90%", detail: "Users reaching dashboard / users who start onboarding" },
  { metric: "Time-to-roadmap", target: "< 5 min", detail: "Login to first dashboard render, p95" },
  { metric: "D1 / D7 activation", target: ">= 60% / >= 35%", detail: "Users completing at least one mission" },
  { metric: "Weekly review delivery", target: ">= 99%", detail: "Eligible users receive a review within 24h" },
  { metric: "Assessment latency", target: "< 1.5s", detail: "Submit to score and graph persisted, p95" },
  { metric: "Bedrock personalization", target: "< 8s", detail: "Assignment to overlay ready, async p95" },
] as const;

export const USER_JOURNEY = [
  "Existing Supabase login succeeds; engine checks profiles.onboarding_completed.",
  "Incomplete learners enter the 5-step onboarding wizard: Welcome, Profile, Role, Connect, Ready.",
  "Placement assessment selects 20 questions from the role's 100-question bank, 2 per skill.",
  "Server computes deterministic skill_scores and stores a knowledge_graph row; AI does not score.",
  "Overall score + weak/strong skill breadth classify the learner as Beginner or Intermediate.",
  "Role + level selects one immutable 45-day roadmap JSON and expands progress rows.",
  "Bedrock may add a personalization overlay, but fallback raw JSON order always works.",
  "Dashboard surfaces Today's Mission, roadmap %, streak, Talent Score and next project.",
  "Daily task completion writes progress, sessions, XP, streak updates and activity logs.",
  "Every 7 active days, Weekly Review runs and can re-sequence only future content.",
] as const;

export const TALENT_SCORE_COMPONENTS = [
  { component: "Assessment", points: 150, formula: "round(1.5 × overall_score)" },
  { component: "Projects", points: 220, formula: "Quality-weighted completed mini/capstone projects" },
  { component: "Assignments", points: 150, formula: "Completed assignments ÷ available assignments" },
  { component: "Learning", points: 150, formula: "Minutes learned vs cumulative weekly goal" },
  { component: "Consistency", points: 150, formula: "0.5 × streak factor + 0.5 × trailing active-day ratio" },
  { component: "GitHub", points: 80, formula: "Synced commits/PRs with diminishing returns" },
  { component: "Community", points: 50, formula: "Existing community score, read-only" },
  { component: "Weekly Goals", points: 50, formula: "Tasks and minutes goal completion" },
] as const;

export const AI_AGENTS = [
  {
    name: "Roadmap Agent",
    purpose: "Produces overlay sequence plus compress/reinforce/keep day actions.",
    fallback: "Raw JSON day order with all days kept.",
  },
  {
    name: "Assessment Analysis Agent",
    purpose: "Turns deterministic skill scores into a supportive narrative.",
    fallback: "Template narrative from weak and strong skill arrays.",
  },
  {
    name: "Daily Mission Agent",
    purpose: "Adds brief motivation and one existing extra practice task on reinforce days.",
    fallback: "Static motivation; no extra task.",
  },
  {
    name: "Weekly Review Agent",
    purpose: "Creates strict-JSON weekly report and validated future roadmap updates.",
    fallback: "Lite stats-only weekly review with ai_enriched=false.",
  },
  {
    name: "Talent Score Recommendation Agent",
    purpose: "Suggests how to improve Talent Score; never changes the number.",
    fallback: "Deterministic tips based on lowest score component.",
  },
  {
    name: "Learning Recommendation Agent",
    purpose: "Selects one next best existing unlocked action.",
    fallback: "Next unlocked day's first required task.",
  },
  {
    name: "Project Review Agent",
    purpose: "Rubric feedback and 0-100 project quality score.",
    fallback: "Rubric checklist with deferred numeric score.",
  },
] as const;

export const API_CATALOG = [
  { method: "POST", path: "/api/onboarding", owner: "Onboarding", file: "app/api/onboarding/route.ts" },
  { method: "POST", path: "/api/onboarding/github", owner: "Onboarding", file: "app/api/onboarding/github/route.ts" },
  { method: "POST", path: "/api/onboarding/resume", owner: "Onboarding", file: "app/api/onboarding/resume/route.ts" },
  { method: "POST", path: "/api/assessment/start", owner: "Assessment", file: "app/api/assessment/start/route.ts" },
  { method: "POST", path: "/api/assessment/answer", owner: "Assessment", file: "app/api/assessment/answer/route.ts" },
  { method: "POST", path: "/api/assessment/submit", owner: "Assessment", file: "app/api/assessment/submit/route.ts" },
  { method: "GET", path: "/api/assessment/history", owner: "Assessment", file: "app/api/assessment/history/route.ts" },
  { method: "POST", path: "/api/roadmap/assign", owner: "Roadmap", file: "app/api/roadmap/assign/route.ts" },
  { method: "GET", path: "/api/dashboard", owner: "Dashboard", file: "app/api/dashboard/route.ts" },
  { method: "GET", path: "/api/mission/today", owner: "Daily Mission", file: "app/api/mission/today/route.ts" },
  { method: "POST", path: "/api/tasks/:id/complete", owner: "Daily Mission", file: "app/api/tasks/[id]/complete/route.ts" },
  { method: "POST", path: "/api/weekly-review/run", owner: "Weekly Review", file: "app/api/weekly-review/run/route.ts" },
  { method: "GET", path: "/api/admin/blog-posts", owner: "Blog CMS", file: "app/api/admin/blog-posts/route.ts" },
  { method: "POST", path: "/api/admin/blog-posts", owner: "Blog CMS", file: "app/api/admin/blog-posts/route.ts" },
  { method: "PATCH", path: "/api/admin/blog-posts/:id", owner: "Blog CMS", file: "app/api/admin/blog-posts/[id]/route.ts" },
  { method: "GET", path: "/api/talent/current", owner: "Talent Score", file: "app/api/talent/current/route.ts" },
  { method: "POST", path: "/api/ai/health", owner: "AI Gateway", file: "app/api/ai/health/route.ts" },
] as const;

export const DATABASE_TABLES = [
  { table: "profiles", owner: "Core" },
  { table: "roles", owner: "Core catalog" },
  { table: "assessments", owner: "Assessment catalog" },
  { table: "assessment_results", owner: "Assessment" },
  { table: "skill_scores", owner: "Assessment" },
  { table: "knowledge_graph", owner: "Assessment" },
  { table: "roadmaps", owner: "Roadmap catalog" },
  { table: "user_roadmaps", owner: "Roadmap" },
  { table: "roadmap_progress", owner: "Roadmap" },
  { table: "daily_tasks", owner: "Daily Mission" },
  { table: "task_progress", owner: "Daily Mission" },
  { table: "quiz_attempts", owner: "Progress" },
  { table: "project_reviews", owner: "Projects" },
  { table: "learning_sessions", owner: "Tracking" },
  { table: "talent_scores", owner: "Talent Score" },
  { table: "badges", owner: "Talent Score" },
  { table: "weekly_goals", owner: "Talent Score" },
  { table: "weekly_reports", owner: "Weekly Review" },
  { table: "activity_logs", owner: "Tracking" },
  { table: "progress_rollups", owner: "Tracking" },
  { table: "ai_invocations", owner: "AI audit" },
] as const;

export const DEMO_LEARNERS = [
  {
    name: "Aarav Mehta",
    role: "GenAI Engineer",
    stage: "Assessment in progress",
    status: "Needs nudge",
    talent: 0,
    roadmapPct: 0,
    streak: 0,
    focus: ["RAG", "AI Agents"],
    nextAction: "Resume 20-question placement test",
  },
  {
    name: "Nisha Pawar",
    role: "AI Engineer",
    stage: "Day 12 mission",
    status: "Healthy",
    talent: 482,
    roadmapPct: 27,
    streak: 6,
    focus: ["Deep Learning", "MLOps"],
    nextAction: "Finish assignment artifact link",
  },
  {
    name: "Pratik Harne",
    role: "AI Automation Engineer",
    stage: "Weekly review due",
    status: "Review queue",
    talent: 641,
    roadmapPct: 44,
    streak: 8,
    focus: ["Workflow APIs", "Agent ops"],
    nextAction: "Run week 3 review fallback-safe",
  },
  {
    name: "Nidhi Chavan",
    role: "Data Science Engineer",
    stage: "Day 31 reinforced",
    status: "At risk",
    talent: 536,
    roadmapPct: 69,
    streak: 1,
    focus: ["Statistics", "Model evaluation"],
    nextAction: "Reduce load; recover missed topic",
  },
] as const;

export const ADMIN_QUEUES = [
  { label: "Onboarding drop-offs", count: 18, tone: "warn", detail: "Users paused before Step 5 / Start Assessment" },
  { label: "Assessments to resume", count: 11, tone: "warn", detail: "In-progress attempts with no activity in 24h" },
  { label: "Roadmaps pending overlay", count: 6, tone: "info", detail: "Raw order active; Bedrock overlay can retry async" },
  { label: "Weekly reviews due", count: 9, tone: "ok", detail: "Eligible after 7 active learning days" },
  { label: "AI fallback reports", count: 2, tone: "danger", detail: "Lite reviews awaiting enrichment retry" },
  { label: "Project reviews queued", count: 14, tone: "info", detail: "Submissions waiting for rubric feedback" },
] as const;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeDifficulty(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) return "Unknown";
  const lower = value.toLowerCase();
  if (lower === "easy") return "Easy";
  if (lower === "medium") return "Medium";
  if (lower === "hard") return "Hard";
  if (lower === "beginner") return "Beginner";
  if (lower === "intermediate") return "Intermediate";
  return value.trim();
}

function addCount(map: Map<string, number>, key: string, by = 1) {
  map.set(key, (map.get(key) ?? 0) + by);
}

function mapToSortedRecord(map: Map<string, number>) {
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce<Record<string, number>>((record, [key, value]) => {
      record[key] = value;
      return record;
    }, {});
}

function topEntries(map: Map<string, number>, limit: number) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([skill, count]) => ({ skill, count }));
}

async function readJsonWithHash<T>(...segments: string[]): Promise<{ value: T; hash: string } | null> {
  try {
    const filePath = path.join(/* turbopackIgnore: true */ process.cwd(), ...segments);
    const raw = await fs.readFile(filePath, "utf8");
    return {
      value: JSON.parse(raw) as T,
      hash: crypto.createHash("sha256").update(raw).digest("hex").slice(0, 12),
    };
  } catch {
    return null;
  }
}

async function fileExists(relativePath: string) {
  try {
    await fs.access(path.join(/* turbopackIgnore: true */ process.cwd(), relativePath));
    return true;
  } catch {
    return false;
  }
}

async function loadAssessmentSummary(role: RoleDefinition): Promise<AssessmentSummary> {
  const loaded = await readJsonWithHash<AssessmentContent>("content", "assessment", role.assessmentFile);
  if (!loaded) {
    return {
      role,
      fileName: role.assessmentFile,
      hash: null,
      status: "danger",
      checks: ["Assessment JSON file is missing."],
      title: "Missing assessment bank",
      totalQuestions: 0,
      expectedQuestions: 100,
      generatedAssessmentSize: 20,
      questionsPerSkillSelected: 2,
      totalWeight: 0,
      passingScore: "null",
      answerReveal: "unknown",
      skillCount: 0,
      skills: [],
      difficultyCounts: {},
      skillDistribution: [],
      validAnswerIndexes: 0,
      invalidAnswerIndexes: 0,
      sampleQuestions: [],
    };
  }

  const content = loaded.value;
  const assessment = isRecord(content.assessment) ? content.assessment : {};
  const questions = Array.isArray(content.questions) ? content.questions : [];
  const skillsFromMeta = asStringArray(assessment.skills_assessed);
  const skills = skillsFromMeta.length > 0
    ? skillsFromMeta
    : [...new Set(questions.map((q) => q.skill).filter((skill): skill is string => typeof skill === "string"))];
  const difficultyMap = new Map<string, number>();
  const bySkill = new Map<string, { count: number; easy: number; medium: number }>();
  let validAnswerIndexes = 0;

  for (const question of questions) {
    const difficulty = normalizeDifficulty(question.difficulty);
    addCount(difficultyMap, difficulty);

    if (typeof question.skill === "string") {
      const bucket = bySkill.get(question.skill) ?? { count: 0, easy: 0, medium: 0 };
      bucket.count += 1;
      if (difficulty === "Easy") bucket.easy += 1;
      if (difficulty === "Medium") bucket.medium += 1;
      bySkill.set(question.skill, bucket);
    }

    const optionCount = Array.isArray(question.options) ? question.options.length : 0;
    if (
      Number.isInteger(question.correct_answer) &&
      typeof question.correct_answer === "number" &&
      question.correct_answer >= 0 &&
      question.correct_answer < optionCount
    ) {
      validAnswerIndexes += 1;
    }
  }

  const skillDistribution = skills.map((skill) => ({
    skill,
    count: bySkill.get(skill)?.count ?? 0,
    easy: bySkill.get(skill)?.easy ?? 0,
    medium: bySkill.get(skill)?.medium ?? 0,
  }));

  const checks: string[] = [];
  if (questions.length === 100) checks.push("100-question bank present.");
  else checks.push(`Expected 100 questions, found ${questions.length}.`);

  if (skills.length === 10) checks.push("10 skills declared.");
  else checks.push(`Expected 10 skills, found ${skills.length}.`);

  const allSkillBucketsReady = skillDistribution.every((skill) => skill.count === 10);
  checks.push(allSkillBucketsReady ? "Every skill has 10 questions." : "One or more skill buckets are not 10 questions.");

  const easyCount = difficultyMap.get("Easy") ?? 0;
  const mediumCount = difficultyMap.get("Medium") ?? 0;
  checks.push(easyCount === 70 && mediumCount === 30 ? "70/30 Easy/Medium distribution verified." : `Difficulty distribution is Easy ${easyCount}, Medium ${mediumCount}.`);
  checks.push(validAnswerIndexes === questions.length ? "All correct_answer values are valid 0-based option indexes." : `${questions.length - validAnswerIndexes} questions have invalid answer indexes.`);

  const status: HealthTone = questions.length === 100 && skills.length === 10 && allSkillBucketsReady && validAnswerIndexes === questions.length ? "ok" : "warn";

  return {
    role,
    fileName: role.assessmentFile,
    hash: loaded.hash,
    status,
    checks,
    title: typeof assessment.title === "string" ? assessment.title : `${role.label} Assessment`,
    totalQuestions: questions.length,
    expectedQuestions: typeof assessment.total_questions === "number" ? assessment.total_questions : 100,
    generatedAssessmentSize:
      isRecord(assessment.selection) && typeof assessment.selection.generated_assessment_size === "number"
        ? assessment.selection.generated_assessment_size
        : 20,
    questionsPerSkillSelected:
      isRecord(assessment.selection) && typeof assessment.selection.questions_per_skill_selected === "number"
        ? assessment.selection.questions_per_skill_selected
        : 2,
    totalWeight: typeof assessment.total_weight === "number" ? assessment.total_weight : questions.reduce((sum, question) => sum + (typeof question.weight === "number" ? question.weight : 0), 0),
    passingScore: assessment.passing_score === null ? "null (placement only)" : String(assessment.passing_score ?? "unspecified"),
    answerReveal: typeof assessment.answer_reveal === "string" ? assessment.answer_reveal : "unknown",
    skillCount: skills.length,
    skills,
    difficultyCounts: mapToSortedRecord(difficultyMap),
    skillDistribution,
    validAnswerIndexes,
    invalidAnswerIndexes: questions.length - validAnswerIndexes,
    sampleQuestions: questions.slice(0, 3).map((question) => ({
      id: typeof question.id === "string" ? question.id : "unknown",
      skill: typeof question.skill === "string" ? question.skill : "Unknown skill",
      difficulty: normalizeDifficulty(question.difficulty),
      question: typeof question.question === "string" ? question.question : "Untitled question",
    })),
  };
}

async function loadRoadmapSummary(role: RoleDefinition, level: RoadmapLevel): Promise<RoadmapSummary> {
  const fileName = role.roadmapFiles[level];
  const loaded = await readJsonWithHash<RoadmapContent>("content", "roadmap", fileName);
  if (!loaded) {
    return {
      role,
      level,
      fileName,
      hash: null,
      status: "danger",
      checks: ["Roadmap JSON file is missing."],
      title: "Missing roadmap",
      description: "",
      outcome: "",
      totalDays: 0,
      expectedDays: 45,
      weekCount: 0,
      sequentialDays: false,
      firstDayTitle: "Missing",
      lastDayTitle: "Missing",
      difficultyCounts: {},
      resourceTotals: {
        videos: 0,
        docs: 0,
        repositories: 0,
        papers: 0,
        quizQuestions: 0,
        assignments: 0,
        practicalTasks: 0,
        projects: 0,
      },
      topSkills: [],
    };
  }

  const content = loaded.value;
  const roadmap = isRecord(content.roadmap) ? content.roadmap : {};
  const days = Array.isArray(content.days) ? content.days : [];
  const difficultyMap = new Map<string, number>();
  const skillMap = new Map<string, number>();
  const resourceTotals = {
    videos: 0,
    docs: 0,
    repositories: 0,
    papers: 0,
    quizQuestions: 0,
    assignments: 0,
    practicalTasks: 0,
    projects: 0,
  };

  for (const day of days) {
    addCount(difficultyMap, normalizeDifficulty(day.difficulty));
    resourceTotals.videos += Array.isArray(day.youtube) ? day.youtube.length : 0;
    resourceTotals.docs += Array.isArray(day.official_docs) ? day.official_docs.length : 0;
    resourceTotals.repositories += Array.isArray(day.github_repositories) ? day.github_repositories.length : 0;
    resourceTotals.papers += Array.isArray(day.research_papers) ? day.research_papers.length : 0;
    resourceTotals.quizQuestions += Array.isArray(day.quiz) ? day.quiz.length : 0;
    resourceTotals.assignments += typeof day.assignment === "string" && day.assignment.trim().length > 0 ? 1 : 0;
    resourceTotals.practicalTasks += typeof day.practical_task === "string" && day.practical_task.trim().length > 0 ? 1 : 0;
    resourceTotals.projects += typeof day.mini_project === "string" && day.mini_project.trim().length > 0 ? 1 : 0;
    for (const skill of asStringArray(day.skills_gained)) addCount(skillMap, skill);
  }

  const sequentialDays = days.every((day, index) => day.day === index + 1);
  const checks = [
    days.length === 45 ? "45-day roadmap present." : `Expected 45 days, found ${days.length}.`,
    sequentialDays ? "Day numbers are sequential 1-45." : "Day numbers are not fully sequential.",
    resourceTotals.quizQuestions > 0 ? `${resourceTotals.quizQuestions} quiz questions embedded.` : "No quiz questions found.",
    resourceTotals.projects === days.length ? "Every day has a mini_project." : `${resourceTotals.projects}/${days.length} days include a mini_project.`,
    resourceTotals.assignments === days.length ? "Every day has an assignment." : `${resourceTotals.assignments}/${days.length} days include an assignment.`,
  ];

  const status: HealthTone = days.length === 45 && sequentialDays && resourceTotals.quizQuestions > 0 ? "ok" : "warn";

  return {
    role,
    level,
    fileName,
    hash: loaded.hash,
    status,
    checks,
    title: typeof roadmap.title === "string" ? roadmap.title : `${role.label} ${level} Roadmap`,
    description: typeof roadmap.description === "string" ? roadmap.description : "",
    outcome: typeof roadmap.outcome === "string" ? roadmap.outcome : "",
    totalDays: days.length,
    expectedDays: typeof roadmap.total_days === "number" ? roadmap.total_days : 45,
    weekCount: Math.ceil(days.length / 7),
    sequentialDays,
    firstDayTitle: typeof days[0]?.title === "string" ? days[0].title : "Untitled first day",
    lastDayTitle: typeof days[days.length - 1]?.title === "string" ? days[days.length - 1]?.title ?? "Untitled last day" : "Untitled last day",
    difficultyCounts: mapToSortedRecord(difficultyMap),
    resourceTotals,
    topSkills: topEntries(skillMap, 8),
  };
}

async function getRepositoryStatus(): Promise<RepositoryStatus> {
  const apiRoutes = await Promise.all(
    API_CATALOG.map(async (route) => {
      const present = await fileExists(route.file);
      return { ...route, present, status: present ? "ok" as const : "warn" as const };
    })
  );

  let migrationsText = "";
  let migrationsCount = 0;
  try {
    const migrationsDir = path.join(/* turbopackIgnore: true */ process.cwd(), "supabase", "migrations");
    const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith(".sql"));
    migrationsCount = files.length;
    const chunks = await Promise.all(files.map((file) => fs.readFile(path.join(migrationsDir, file), "utf8")));
    migrationsText = chunks.join("\n").toLowerCase();
  } catch {
    migrationsText = "";
  }

  const databaseTables = DATABASE_TABLES.map((entry) => {
    const needle = entry.table.toLowerCase();
    const present = migrationsText.includes(`public.${needle}`) || migrationsText.includes(` ${needle} `) || migrationsText.includes(` ${needle}\n`);
    return { ...entry, present, status: present ? "ok" as const : "warn" as const };
  });

  return { apiRoutes, databaseTables, migrationsCount };
}

function mergeRoleReadiness(assessments: AssessmentSummary[], roadmaps: RoadmapSummary[]) {
  return ROLE_DEFINITIONS.map((role) => {
    const assessment = assessments.find((item) => item.role.key === role.key);
    const beginner = roadmaps.find((item) => item.role.key === role.key && item.level === "beginner");
    const intermediate = roadmaps.find((item) => item.role.key === role.key && item.level === "intermediate");
    const statuses = [assessment?.status, beginner?.status, intermediate?.status];
    const status: HealthTone = statuses.includes("danger") ? "danger" : statuses.includes("warn") ? "warn" : "ok";
    return {
      role,
      status,
      assessmentStatus: assessment?.status ?? "danger",
      beginnerStatus: beginner?.status ?? "danger",
      intermediateStatus: intermediate?.status ?? "danger",
      skillCount: assessment?.skillCount ?? 0,
      questionCount: assessment?.totalQuestions ?? 0,
      roadmapDays: (beginner?.totalDays ?? 0) + (intermediate?.totalDays ?? 0),
    };
  });
}

export async function getLearningEngineAdminData(): Promise<LearningEngineAdminData> {
  const assessments = await Promise.all(ROLE_DEFINITIONS.map((role) => loadAssessmentSummary(role)));
  const roadmaps = await Promise.all(
    ROLE_DEFINITIONS.flatMap((role) => [
      loadRoadmapSummary(role, "beginner"),
      loadRoadmapSummary(role, "intermediate"),
    ])
  );
  const repositoryStatus = await getRepositoryStatus();
  const readiness = mergeRoleReadiness(assessments, roadmaps);
  const roadmapResourceTotals = roadmaps.reduce(
    (totals, roadmap) => {
      totals.quizQuestions += roadmap.resourceTotals.quizQuestions;
      totals.resourceLinks += roadmap.resourceTotals.videos + roadmap.resourceTotals.docs + roadmap.resourceTotals.repositories + roadmap.resourceTotals.papers;
      totals.projects += roadmap.resourceTotals.projects;
      totals.assignments += roadmap.resourceTotals.assignments;
      return totals;
    },
    { quizQuestions: 0, resourceLinks: 0, projects: 0, assignments: 0 }
  );

  return {
    generatedAt: new Date().toISOString(),
    spec: SPEC_DETAILS,
    roles: ROLE_DEFINITIONS,
    assessments,
    roadmaps,
    readiness,
    totals: {
      roles: ROLE_DEFINITIONS.length,
      assessmentBanks: assessments.length,
      assessmentQuestions: assessments.reduce((sum, item) => sum + item.totalQuestions, 0),
      generatedAssessmentQuestions: ROLE_DEFINITIONS.length * 20,
      roadmapFiles: roadmaps.length,
      roadmapDays: roadmaps.reduce((sum, item) => sum + item.totalDays, 0),
      quizQuestions: roadmapResourceTotals.quizQuestions,
      resourceLinks: roadmapResourceTotals.resourceLinks,
      projects: roadmapResourceTotals.projects,
      assignments: roadmapResourceTotals.assignments,
    },
    repositoryStatus,
  };
}
