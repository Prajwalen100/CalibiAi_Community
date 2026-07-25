import fs from "node:fs";
import path from "node:path";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isLearningRole, ROLE_DETAILS, type LearningRole } from "@/lib/learning/content";
import type { Result } from "@/lib/services/onboarding";

type RoadmapDay = {
  day: number;
  title: string;
  objectives?: string[];
  topics?: string[];
  estimated_time?: string;
  difficulty?: string;
  practical_task?: string;
  mini_project?: string;
  assignment?: string;
  expected_outcome?: string;
  skills_gained?: string[];
  youtube?: { title: string; channel: string; url: string }[];
  official_docs?: { title: string; url: string }[];
  quiz?: { question: string; options: string[]; answer: string }[];
};

type RoadmapContent = {
  roadmap: {
    title: string;
    role: string;
    level: string;
    total_days: number;
    description?: string;
    outcome?: string;
  };
  days: RoadmapDay[];
};

type WeeklyTarget = {
  week: number;
  title: string;
  focus: string;
  days: number[];
  keyTopics: string[];
  milestones: string[];
};

function loadRoadmap(role: LearningRole, level: "beginner" | "intermediate") {
  const fileName = ROLE_DETAILS[role].roadmap[level];
  const filePath = path.join(process.cwd(), "content", "roadmap", fileName);
  const content = JSON.parse(fs.readFileSync(filePath, "utf8")) as RoadmapContent;

  if (!content.roadmap || !Array.isArray(content.days) || content.days.length === 0) {
    throw new Error("The selected roadmap content is incomplete.");
  }
  if (content.days.some((day, index) => !Number.isInteger(day.day) || day.day !== index + 1 || !day.title)) {
    throw new Error("The selected roadmap days are invalid.");
  }

  return { content, fileName };
}

/**
 * Generate weekly targets from daily content
 */
function generateWeeklyTargets(days: RoadmapDay[]): WeeklyTarget[] {
  const weeks: WeeklyTarget[] = [];
  const daysPerWeek = 7;
  const totalWeeks = Math.ceil(days.length / daysPerWeek);

  for (let week = 0; week < totalWeeks; week++) {
    const startDay = week * daysPerWeek + 1;
    const endDay = Math.min((week + 1) * daysPerWeek, days.length);
    const weekDays = days.slice(week * daysPerWeek, (week + 1) * daysPerWeek);

    // Collect unique topics and skills
    const allTopics = weekDays.flatMap(d => d.topics ?? []);
    const allSkills = weekDays.flatMap(d => d.skills_gained ?? []);
    const uniqueTopics = [...new Set(allTopics)].slice(0, 5);
    const uniqueSkills = [...new Set(allSkills)].slice(0, 3);

    // Generate milestones based on the week
    const milestones: string[] = [];
    if (weekDays[0]?.practical_task) {
      milestones.push("Complete the week's practical task");
    }
    if (weekDays[0]?.mini_project) {
      milestones.push("Submit the mini project");
    }
    if (weekDays.some(d => d.quiz && d.quiz.length > 0)) {
      milestones.push("Pass the weekly quiz (80%+)");
    }
    if (weekDays[0]?.assignment) {
      milestones.push("Submit the weekly assignment");
    }

    weeks.push({
      week: week + 1,
      title: `Week ${week + 1}`,
      focus: uniqueSkills.length > 0 ? uniqueSkills.join(", ") : `Learning Days ${startDay}-${endDay}`,
      days: weekDays.map(d => d.day),
      keyTopics: uniqueTopics,
      milestones,
    });
  }

  return weeks;
}

/**
 * Transform a roadmap day into a dashboard-friendly format
 */
function transformDayForDashboard(day: RoadmapDay, week: number) {
  return {
    day: day.day,
    week,
    title: day.title,
    objectives: day.objectives ?? [],
    topics: day.topics ?? [],
    estimated_time: day.estimated_time ?? "2-3 hours",
    difficulty: day.difficulty ?? "Beginner",
    practical_task: day.practical_task,
    mini_project: day.mini_project,
    assignment: day.assignment,
    expected_outcome: day.expected_outcome,
    skills_gained: day.skills_gained ?? [],
    resources: {
      youtube: day.youtube ?? [],
      docs: day.official_docs ?? [],
    },
    has_quiz: day.quiz && day.quiz.length > 0,
  };
}

function loadAndTransformRoadmap(role: LearningRole, level: "beginner" | "intermediate") {
  const { content, fileName } = loadRoadmap(role, level);
  
  const daysPerWeek = 7;
  const weeklyTargets = generateWeeklyTargets(content.days);
  
  const transformedDays = content.days.map((day, index) => {
    const week = Math.floor(index / daysPerWeek) + 1;
    return transformDayForDashboard(day, week);
  });

  return {
    roadmap: content.roadmap,
    fileName,
    days: transformedDays,
    weeklyTargets,
    totalDays: content.days.length,
    totalWeeks: weeklyTargets.length,
  };
}

/**
 * Deterministically assigns the static role + level roadmap after assessment.
 * The operation is retry-safe: a partially-created active assignment is reused
 * and its progress rows are upserted before onboarding is unlocked.
 */
export async function assignRoadmap(): Promise<Result<{ userRoadmapId: string }>> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: { message: "Please sign in again.", code: "UNAUTHENTICATED" } };
  }

  const [{ data: profile, error: profileError }, { data: assessment, error: assessmentError }] = await Promise.all([
    supabase
      .from("profiles")
      .select("learning_role,onboarding_completed")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("assessment_results")
      .select("id,role,level,overall_score")
      .eq("user_id", user.id)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (profileError || !profile) {
    return { data: null, error: { message: "Your onboarding profile could not be loaded.", code: profileError?.code } };
  }
  if (assessmentError) {
    return { data: null, error: { message: "Your assessment result could not be loaded.", code: assessmentError.code } };
  }
  if (!assessment || !isLearningRole(assessment.role) || !isLearningRole(profile.learning_role)) {
    return { data: null, error: { message: "Complete the placement assessment before assigning your roadmap." } };
  }
  if (assessment.role !== profile.learning_role) {
    return { data: null, error: { message: "Your assessment role no longer matches your selected role. Please retake the assessment." } };
  }
  if (assessment.level !== "beginner" && assessment.level !== "intermediate") {
    return { data: null, error: { message: "Your assessment level is missing. Please submit the assessment again." } };
  }

  let roadmap: ReturnType<typeof loadAndTransformRoadmap>;
  try {
    roadmap = loadAndTransformRoadmap(assessment.role, assessment.level);
  } catch (error) {
    return {
      data: null,
      error: { message: error instanceof Error ? error.message : "The selected roadmap could not be loaded." },
    };
  }

  const { data: graphRow } = await supabase
    .from("knowledge_graph")
    .select("graph")
    .eq("assessment_result_id", assessment.id)
    .maybeSingle();
  const graph = graphRow?.graph as { weak_skills?: string[]; strong_skills?: string[] } | null | undefined;

  let { data: assignment, error: assignmentReadError } = await supabase
    .from("user_roadmaps")
    .select("id,roadmap_id")
    .eq("user_id", user.id)
    .eq("role", assessment.role)
    .eq("status", "active")
    .maybeSingle();

  if (assignmentReadError) {
    return {
      data: null,
      error: {
        message: "Roadmap assignment is unavailable. Make sure the latest Supabase migrations are applied.",
        code: assignmentReadError.code,
      },
    };
  }

  // Prepare the full roadmap data with daily and weekly targets
  const fullRoadmapData = {
    roadmap: roadmap.roadmap,
    file_key: roadmap.fileName,
    assessment_result_id: assessment.id,
    assessment_score: assessment.overall_score,
    weeklyTargets: roadmap.weeklyTargets,
    days: roadmap.days,
    totalDays: roadmap.totalDays,
    totalWeeks: roadmap.totalWeeks,
    personalization: {
      focus_skills: graph?.weak_skills ?? [],
      strong_skills: graph?.strong_skills ?? [],
      weak_skill_days: roadmap.days
        .filter(day => 
          day.skills_gained?.some(skill => 
            graph?.weak_skills?.some(ws => 
              skill.toLowerCase().includes(ws.toLowerCase()) ||
              ws.toLowerCase().includes(skill.toLowerCase())
            )
          )
        )
        .map(d => d.day),
    },
  };

  if (!assignment) {
    const { data: catalogRow, error: catalogError } = await supabase
      .from("roadmaps")
      .insert({
        user_id: user.id,
        role: assessment.role,
        generated_plan: fullRoadmapData,
      })
      .select("id")
      .single();

    if (catalogError || !catalogRow) {
      return { data: null, error: { message: "We couldn't save your roadmap. Please retry.", code: catalogError?.code } };
    }

    const sequence = roadmap.days.map((day) => day.day);
    const created = await supabase
      .from("user_roadmaps")
      .insert({
        user_id: user.id,
        roadmap_id: catalogRow.id,
        role: assessment.role,
        level: assessment.level,
        status: "active",
        personalization: {
          sequence,
          day_actions: {},
          focus_skills: graph?.weak_skills ?? [],
          strong_skills: graph?.strong_skills ?? [],
          weekly_targets: roadmap.weeklyTargets,
          version: 2,
          source: "deterministic",
        },
      })
      .select("id,roadmap_id")
      .single();

    if (created.error || !created.data) {
      // A duplicate request may have won the unique-index race. Reuse it.
      const retry = await supabase
        .from("user_roadmaps")
        .select("id,roadmap_id")
        .eq("user_id", user.id)
        .eq("role", assessment.role)
        .eq("status", "active")
        .maybeSingle();
      assignment = retry.data;
      assignmentReadError = retry.error;
      if (assignmentReadError || !assignment) {
        return { data: null, error: { message: "We couldn't activate your roadmap. Please retry.", code: created.error?.code } };
      }
    } else {
      assignment = created.data;
    }
  }

  const progressRows = roadmap.days.map((day) => ({
    user_id: user.id,
    user_roadmap_id: assignment!.id,
    module_id: `${assignment!.id}:day:${day.day}`,
    day: day.day,
    prereq_days: day.day === 1 ? [] : [day.day - 1],
    status: day.day === 1 ? "not_started" : "locked",
    unlock_at: day.day === 1 ? new Date().toISOString() : null,
  }));

  const { error: progressError } = await supabase
    .from("roadmap_progress")
    .upsert(progressRows, { onConflict: "user_id,module_id" });
  if (progressError) {
    return { data: null, error: { message: "We couldn't prepare your roadmap days. Please retry.", code: progressError.code } };
  }

  const { data: completedProfile, error: completeError } = await supabase
    .from("profiles")
    .update({ onboarding_completed: true, onboarding_step: 5 })
    .eq("user_id", user.id)
    .select("user_id")
    .maybeSingle();
  if (completeError || !completedProfile) {
    return { data: null, error: { message: "We couldn't finish onboarding. Please retry.", code: completeError?.code } };
  }

  // Initialize scores with assessment contribution
  const assessmentScorePoints = Math.round((assessment.overall_score ?? 0) * 0.5);
  
  await Promise.all([
    supabase.from("scores").upsert(
      {
        user_id: user.id,
        projects_pts: 0,
        skills_pts: 0,
        community_pts: 0,
        completion_pts: assessmentScorePoints,
        recognition_pts: 0,
        total: assessmentScorePoints,
        tier: assessmentScorePoints >= 75 ? "silver" : assessmentScorePoints >= 50 ? "bronze" : "bronze",
        last_calculated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    ),
    supabase.from("activity_logs").insert({
      user_id: user.id,
      action: "roadmap_assigned",
      metadata: { 
        role: assessment.role, 
        level: assessment.level, 
        user_roadmap_id: assignment.id,
        assessment_score: assessment.overall_score,
        completion_pts_awarded: assessmentScorePoints,
      },
    }),
  ]);

  return { data: { userRoadmapId: assignment.id }, error: null };
}

export type { RoadmapDay, WeeklyTarget };
