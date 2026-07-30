/**
 * Server-side adapter that turns assessment results and AI Lab mini-project
 * passes into `public.user_skills.verified = true` rows.
 *
 * Why this file exists: the data model and read side were already wired
 * (`app/p/[username]/page.tsx` joins `user_skills → skills` to render the
 * "Verified skills" radar), but `user_skills` is admin-write only (RLS in
 * `001_initial_schema.sql`) and nothing was inserting into it, so the
 * section always rendered empty.
 *
 * The pure mapping logic lives in `./verified-skills.ts` so it can be
 * unit tested without booting Supabase. This file does the I/O using the
 * admin Supabase client (which bypasses RLS) and is `server-only` so it
 * can never accidentally be imported from a client component.
 */

import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  mapSkillNamesToCatalog,
  type CatalogSkill,
  type ResolvedSkill,
} from "./verified-skills";

export type { CatalogSkill, ResolvedSkill } from "./verified-skills";
export { mapSkillNamesToCatalog } from "./verified-skills";

async function loadCatalog(): Promise<CatalogSkill[]> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("skills")
    .select("id,name,category")
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data as unknown as CatalogSkill[];
}

type RecordVerifiedSkillsInput = {
  userId: string;
  rawSkillNames: readonly (string | null | undefined)[];
  assessmentRef: string;
};

export type RecordVerifiedSkillsResult = {
  matched: ResolvedSkill[];
  inserted: number;
  skipped: number;
};

/**
 * Common implementation shared by both the assessment and the AI Lab paths.
 *
 * Upserts `user_skills` rows for every matched catalog skill. The `verified`
 * column is only ever set to `true` (never cleared) and `verified_at` is only
 * ever set if it was previously `null`, so a row verified by an earlier
 * assessment never has its timestamp clobbered by a later weaker run.
 */
async function recordVerifiedSkills(
  input: RecordVerifiedSkillsInput,
): Promise<RecordVerifiedSkillsResult> {
  const { userId, rawSkillNames, assessmentRef } = input;
  if (!userId) return { matched: [], inserted: 0, skipped: 0 };

  const names = rawSkillNames.filter(
    (name): name is string => typeof name === "string" && name.trim().length > 0,
  );
  if (names.length === 0) return { matched: [], inserted: 0, skipped: 0 };

  const catalog = await loadCatalog();
  const matched = mapSkillNamesToCatalog(names, catalog);
  if (matched.length === 0) return { matched: [], inserted: 0, skipped: names.length };

  const supabase = createAdminSupabaseClient();

  // Read existing rows so we can preserve `verified_at` for skills the user
  // already proved at a higher level — a follow-up assessment should not
  // regress the timestamp.
  const { data: existing } = await supabase
    .from("user_skills")
    .select("skill_id, verified, verified_at")
    .eq("user_id", userId)
    .in(
      "skill_id",
      matched.map((skill) => skill.skillId),
    );

  const alreadyVerifiedAt = new Map<string, string>();
  for (const row of (existing ?? []) as { skill_id: string; verified: boolean; verified_at: string | null }[]) {
    if (row.verified && row.verified_at) {
      alreadyVerifiedAt.set(row.skill_id, row.verified_at);
    }
  }

  const nowIso = new Date().toISOString();
  const rows = matched.map(({ skillId }) => {
    const existingVerifiedAt = alreadyVerifiedAt.get(skillId);
    return {
      user_id: userId,
      skill_id: skillId,
      verified: true,
      verified_at: existingVerifiedAt ?? nowIso,
      assessment_ref: assessmentRef || null,
    };
  });

  const { error } = await supabase
    .from("user_skills")
    .upsert(rows, { onConflict: "user_id,skill_id", ignoreDuplicates: false });

  if (error) {
    // Don't throw — verification is a side-effect of the main flow. The
    // assessment / mini-project submission is the source of truth and the
    // student should still see their result even if the catalog is missing.
    console.error("user_skills upsert failed", { userId, assessmentRef, error });
    return { matched, inserted: 0, skipped: matched.length };
  }

  return { matched, inserted: matched.length, skipped: 0 };
}

/**
 * Grant verified-skill rows for every `strong`-band skill the student just
 * demonstrated on an onboarding assessment.
 */
export async function recordVerifiedSkillsFromAssessment(
  userId: string,
  skillScores: ReadonlyArray<{ skill?: string | null; band?: string | null; score?: number | null }>,
  assessmentResultId: string,
): Promise<RecordVerifiedSkillsResult> {
  const strongNames = skillScores
    .filter((row) => (row.band ?? "").toLowerCase() === "strong")
    .map((row) => row.skill ?? "")
    .filter((name) => name.trim().length > 0);

  return recordVerifiedSkills({
    userId,
    rawSkillNames: strongNames,
    assessmentRef: `assessment:${assessmentResultId}`,
  });
}

/**
 * Grant verified-skill rows for the day's `skills_gained` list when the
 * student passes an AI Lab mini-project. Passed = `review.passed === true`
 * (see `app/api/ai/task-review/route.ts`).
 */
export async function recordVerifiedSkillsFromRoadmapTask(
  userId: string,
  skillsGained: readonly (string | null | undefined)[],
  assessmentId: string,
): Promise<RecordVerifiedSkillsResult> {
  return recordVerifiedSkills({
    userId,
    rawSkillNames: skillsGained,
    assessmentRef: `roadmap_task:${assessmentId}`,
  });
}
