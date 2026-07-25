import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { CsvColumn } from "@/lib/admin/csv";

export type StudentActivity = "active" | "inactive";

export type StudentRecord = {
  userId: string;
  fullName: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  college: string | null;
  branch: string | null;
  gradYear: number | null;
  location: string | null;
  targetRole: string | null;
  learningRole: string | null;
  role: string | null;
  onboardingCompleted: boolean;
  onboardingStep: number | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  scoreTotal: number;
  scoreTier: string | null;
  projectsPts: number;
  skillsPts: number;
  communityPts: number;
  completionPts: number;
  lastActiveAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  activity: StudentActivity;
};

export type StudentFilters = {
  search?: string;
  activity?: StudentActivity | "all";
  college?: string;
  role?: string;
  minScore?: number;
  maxScore?: number;
  activeWithinDays?: number;
};

export type StudentDataset = {
  students: StudentRecord[];
  colleges: string[];
  roles: string[];
  totals: {
    all: number;
    active: number;
    inactive: number;
    withPhone: number;
    averageScore: number;
  };
  error: string | null;
  source: "supabase" | "unavailable";
};

/** A student counts as active when seen within this many days. */
export const DEFAULT_ACTIVE_WINDOW_DAYS = 30;

const PROFILE_COLUMNS =
  "user_id,username,full_name,display_name,email,phone,college,branch,grad_year,location,target_role,learning_role,role,onboarding_completed,onboarding_step,github_url,linkedin_url,portfolio_url,created_at,updated_at";

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function resolveActivity(lastActiveAt: string | null, activeWithinDays: number): StudentActivity {
  if (!lastActiveAt) return "inactive";
  const seen = new Date(lastActiveAt).getTime();
  if (!Number.isFinite(seen)) return "inactive";
  return Date.now() - seen <= activeWithinDays * 24 * 60 * 60 * 1000 ? "active" : "inactive";
}

type ScoreRow = {
  user_id: string;
  total?: number | null;
  tier?: string | null;
  projects_pts?: number | null;
  skills_pts?: number | null;
  community_pts?: number | null;
  completion_pts?: number | null;
  last_calculated_at?: string | null;
};

async function loadLatestActivity(
  client: SupabaseClient,
  userIds: string[]
): Promise<Map<string, string>> {
  const latest = new Map<string, string>();
  if (userIds.length === 0) return latest;

  // activity_logs is the durable "the learner did something" trail. It may not
  // exist on very old databases, so a failure here degrades to profile dates.
  const { data, error } = await client
    .from("activity_logs")
    .select("user_id,created_at")
    .in("user_id", userIds)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error || !data) return latest;

  for (const row of data as Array<{ user_id?: string; created_at?: string }>) {
    const userId = asString(row.user_id);
    const createdAt = asString(row.created_at);
    if (!userId || !createdAt) continue;
    if (!latest.has(userId)) latest.set(userId, createdAt);
  }
  return latest;
}

export async function getStudentDataset(
  options: { activeWithinDays?: number } = {}
): Promise<StudentDataset> {
  const activeWithinDays = options.activeWithinDays ?? DEFAULT_ACTIVE_WINDOW_DAYS;

  const empty: StudentDataset = {
    students: [],
    colleges: [],
    roles: [],
    totals: { all: 0, active: 0, inactive: 0, withPhone: 0, averageScore: 0 },
    error: null,
    source: "unavailable",
  };

  let client: SupabaseClient;
  try {
    client = createAdminSupabaseClient();
  } catch {
    return {
      ...empty,
      error:
        "Supabase service-role credentials are missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to load student data.",
    };
  }

  const { data: profileRows, error: profileError } = await client
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (profileError) {
    return { ...empty, error: profileError.message };
  }

  const profiles = (profileRows ?? []) as Array<Record<string, unknown>>;
  const userIds = profiles
    .map((row) => asString(row.user_id))
    .filter((value): value is string => Boolean(value));

  const [{ data: scoreRows }, lastSeenMap] = await Promise.all([
    client
      .from("scores")
      .select("user_id,total,tier,projects_pts,skills_pts,community_pts,completion_pts,last_calculated_at")
      .in("user_id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]),
    loadLatestActivity(client, userIds),
  ]);

  const scoreMap = new Map<string, ScoreRow>();
  for (const row of (scoreRows ?? []) as ScoreRow[]) {
    if (row.user_id) scoreMap.set(row.user_id, row);
  }

  const students: StudentRecord[] = profiles
    .filter((row) => asString(row.role) !== "employer")
    .map((row) => {
      const userId = asString(row.user_id) ?? "";
      const score = scoreMap.get(userId);
      const lastActiveAt =
        lastSeenMap.get(userId) ??
        asString(score?.last_calculated_at) ??
        asString(row.updated_at) ??
        null;

      return {
        userId,
        fullName:
          asString(row.full_name) ?? asString(row.display_name) ?? asString(row.username) ?? "Unnamed learner",
        username: asString(row.username),
        email: asString(row.email),
        phone: asString(row.phone),
        college: asString(row.college),
        branch: asString(row.branch),
        gradYear: typeof row.grad_year === "number" ? row.grad_year : null,
        location: asString(row.location),
        targetRole: asString(row.target_role),
        learningRole: asString(row.learning_role),
        role: asString(row.role),
        onboardingCompleted: Boolean(row.onboarding_completed),
        onboardingStep: typeof row.onboarding_step === "number" ? row.onboarding_step : null,
        githubUrl: asString(row.github_url),
        linkedinUrl: asString(row.linkedin_url),
        portfolioUrl: asString(row.portfolio_url),
        scoreTotal: asNumber(score?.total),
        scoreTier: asString(score?.tier),
        projectsPts: asNumber(score?.projects_pts),
        skillsPts: asNumber(score?.skills_pts),
        communityPts: asNumber(score?.community_pts),
        completionPts: asNumber(score?.completion_pts),
        lastActiveAt,
        createdAt: asString(row.created_at),
        updatedAt: asString(row.updated_at),
        activity: resolveActivity(lastActiveAt, activeWithinDays),
      } satisfies StudentRecord;
    });

  const colleges = [...new Set(students.map((student) => student.college).filter((v): v is string => Boolean(v)))].sort(
    (a, b) => a.localeCompare(b)
  );
  const roles = [
    ...new Set(
      students
        .map((student) => student.learningRole ?? student.targetRole)
        .filter((v): v is string => Boolean(v))
    ),
  ].sort((a, b) => a.localeCompare(b));

  const active = students.filter((student) => student.activity === "active").length;
  const withPhone = students.filter((student) => Boolean(student.phone)).length;
  const averageScore =
    students.length > 0
      ? Math.round(students.reduce((sum, student) => sum + student.scoreTotal, 0) / students.length)
      : 0;

  return {
    students,
    colleges,
    roles,
    totals: {
      all: students.length,
      active,
      inactive: students.length - active,
      withPhone,
      averageScore,
    },
    error: null,
    source: "supabase",
  };
}

export function filterStudents(students: StudentRecord[], filters: StudentFilters): StudentRecord[] {
  const search = filters.search?.trim().toLowerCase() ?? "";
  const activity = filters.activity ?? "all";
  const college = filters.college?.trim() ?? "";
  const role = filters.role?.trim() ?? "";
  const minScore = Number.isFinite(filters.minScore) ? Number(filters.minScore) : null;
  const maxScore = Number.isFinite(filters.maxScore) ? Number(filters.maxScore) : null;

  return students.filter((student) => {
    if (activity !== "all" && student.activity !== activity) return false;
    if (college && college !== "all" && (student.college ?? "") !== college) return false;
    if (role && role !== "all" && (student.learningRole ?? student.targetRole ?? "") !== role) return false;
    if (minScore !== null && student.scoreTotal < minScore) return false;
    if (maxScore !== null && student.scoreTotal > maxScore) return false;

    if (search) {
      const haystack = [
        student.fullName,
        student.username,
        student.email,
        student.phone,
        student.college,
        student.branch,
        student.location,
        student.targetRole,
        student.learningRole,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}

export const STUDENT_CSV_COLUMNS: CsvColumn<StudentRecord>[] = [
  { key: "fullName", header: "Name", value: (s) => s.fullName },
  { key: "email", header: "Email", value: (s) => s.email },
  { key: "phone", header: "Phone Number", value: (s) => s.phone },
  { key: "username", header: "Username", value: (s) => s.username },
  { key: "college", header: "College", value: (s) => s.college },
  { key: "branch", header: "Branch", value: (s) => s.branch },
  { key: "gradYear", header: "Graduation Year", value: (s) => s.gradYear },
  { key: "location", header: "Location", value: (s) => s.location },
  { key: "role", header: "Learning Role", value: (s) => s.learningRole ?? s.targetRole },
  { key: "status", header: "Status", value: (s) => (s.activity === "active" ? "Active" : "Inactive") },
  { key: "scoreTotal", header: "CalibiAI Score", value: (s) => s.scoreTotal },
  { key: "scoreTier", header: "Score Tier", value: (s) => s.scoreTier },
  { key: "projectsPts", header: "Projects Points", value: (s) => s.projectsPts },
  { key: "skillsPts", header: "Skills Points", value: (s) => s.skillsPts },
  { key: "communityPts", header: "Community Points", value: (s) => s.communityPts },
  { key: "completionPts", header: "Completion Points", value: (s) => s.completionPts },
  { key: "onboarding", header: "Onboarding Completed", value: (s) => (s.onboardingCompleted ? "Yes" : "No") },
  { key: "github", header: "GitHub", value: (s) => s.githubUrl },
  { key: "linkedin", header: "LinkedIn", value: (s) => s.linkedinUrl },
  { key: "portfolio", header: "Portfolio", value: (s) => s.portfolioUrl },
  { key: "lastActiveAt", header: "Last Active", value: (s) => s.lastActiveAt },
  { key: "createdAt", header: "Joined", value: (s) => s.createdAt },
  { key: "userId", header: "User ID", value: (s) => s.userId },
];
