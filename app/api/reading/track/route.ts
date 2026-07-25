import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { articleId, timeSpentSeconds } = body;

    if (!articleId) return NextResponse.json({ error: "Missing article ID" }, { status: 400 });

    // Insert reading activity
    const { data, error } = await supabase.from("activity_logs").insert({
      user_id: user.id,
      action: "read_article",
      metadata: { article_id: articleId, time_spent_seconds: timeSpentSeconds ?? 0 },
    }).select();

    if (error) {
      console.error("Reading track error:", error);
      return NextResponse.json({ error: "Failed to track reading" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Reading track exception:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
