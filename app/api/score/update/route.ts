import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { recalculateAndPersistScore } from "@/lib/score/recalculate";

export const dynamic = "force-dynamic";

function isOptionalPercentage(value: unknown): value is number | undefined {
  return (
    value === undefined ||
    (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100)
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const { readingScore, quizAverage, quizDay } = body;

    if (!isOptionalPercentage(readingScore) || !isOptionalPercentage(quizAverage)) {
      return NextResponse.json(
        { error: "Reading and quiz scores must be between 0 and 100." },
        { status: 422 }
      );
    }
    if (
      quizDay !== undefined &&
      (!Number.isInteger(quizDay) || (quizDay as number) < 1 || (quizDay as number) > 45)
    ) {
      return NextResponse.json({ error: "Invalid roadmap quiz day." }, { status: 422 });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Never accept a user ID from the client — the score always recalculates
    // for the authenticated user only. Uses the same shared logic as
    // community activity, project submission, and the profile page's
    // recompute-on-read fallback, so the number is consistent everywhere.
    const breakdown = await recalculateAndPersistScore(user.id, {
      readingScore: typeof readingScore === "number" ? readingScore : undefined,
      quizAverage: typeof quizAverage === "number" ? quizAverage : undefined,
    });

    if (!breakdown) {
      return NextResponse.json(
        { error: "Score tracking is unavailable. Apply the latest database migrations." },
        { status: 500 }
      );
    }

    if (typeof quizAverage === "number") {
      // Score persistence must not fail just because activity logging is
      // temporarily unavailable.
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        action: "roadmap_quiz_completed",
        metadata: {
          day: typeof quizDay === "number" ? quizDay : null,
          score: quizAverage,
        },
      });
    }

    return NextResponse.json({ success: true, total: breakdown.total, breakdown });
  } catch (error) {
    console.error("Score update error:", error);
    return NextResponse.json({ error: "Failed to update score" }, { status: 500 });
  }
}
