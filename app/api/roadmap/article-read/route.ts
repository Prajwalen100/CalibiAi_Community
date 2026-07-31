import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStudentAccess } from "@/lib/auth/student-access";
import { isLearningRole } from "@/lib/learning/content";
import { getRoadmapDayAccess } from "@/lib/learning/day-access";
import { recalculateAndPersistScore } from "@/lib/score/recalculate";

export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  day: z.number().int().min(1).max(45),
});

/**
 * Marks the "Detailed Article for This Day" as read for the current user.
 *
 * Called via `navigator.sendBeacon` (or a plain fetch) from the day page
 * the moment the user clicks the Read Detailed Article button. The write
 * is idempotent — repeated calls collapse into the same row thanks to
 * the (user_roadmap_id, day) unique constraint.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid day." },
      { status: 422 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const access = await getStudentAccess(supabase, user.id);
  if (!access.canAccessStudentArea) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const role = access.profile?.learning_role;
  if (!isLearningRole(role)) {
    return NextResponse.json({ error: "Learning role missing." }, { status: 409 });
  }

  const { data: assignment } = await supabase
    .from("user_roadmaps")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", role)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!assignment) {
    return NextResponse.json({ error: "No active roadmap." }, { status: 409 });
  }

  const dayAccess = await getRoadmapDayAccess(supabase, user.id, parsed.data.day);
  if (dayAccess.isLocked) {
    return NextResponse.json(
      { error: `Day ${parsed.data.day} is locked.` },
      { status: 403 }
    );
  }

  // ON CONFLICT on the (user_roadmap_id, day) unique index keeps this
  // strictly idempotent — reloading the page will not add a duplicate row.
  const { error } = await supabase.from("roadmap_article_reads").upsert(
    {
      user_id: user.id,
      user_roadmap_id: assignment.id,
      day: parsed.data.day,
    },
    { onConflict: "user_roadmap_id,day", ignoreDuplicates: true }
  );

  if (error) {
    console.error("Failed to record article read", error);
    return NextResponse.json(
      { error: "Could not record article read." },
      { status: 500 }
    );
  }

  // Reading Engagement moves the moment a new article is read — don't wait
  // for the dashboard's stale-score fallback to notice.
  await recalculateAndPersistScore(user.id).catch(() => null);

  return NextResponse.json({ success: true });
}
