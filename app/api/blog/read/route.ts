import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { recalculateAndPersistScore } from "@/lib/score/recalculate";

export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  slug: z.string().min(1).max(200),
});

/**
 * Marks a blog post as read for the current user once they scroll to the
 * end of it (see `components/blog/blog-read-tracker.tsx`). The write is
 * idempotent — the (user_id, post_slug) unique index collapses repeat
 * reads into the same row — and feeds directly into the Reading Engagement
 * percentage shown on the dashboard.
 */
export async function POST(request: Request) {
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid blog slug." },
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

  const { error } = await supabase.from("blog_post_reads").upsert(
    { user_id: user.id, post_slug: parsed.data.slug },
    { onConflict: "user_id,post_slug", ignoreDuplicates: true }
  );

  if (error) {
    // A missing migration (024) must not break the reading experience —
    // the reader has already seen the article either way.
    if (error.code === "42P01" || /blog_post_reads|relation .* does not exist/i.test(error.message)) {
      return NextResponse.json({ success: true, tracked: false });
    }
    console.error("Failed to record blog post read", error);
    return NextResponse.json({ error: "Could not record read." }, { status: 500 });
  }

  // Best-effort: refresh Reading Engagement immediately so the dashboard
  // reflects this read without waiting for the next page's recompute.
  await recalculateAndPersistScore(user.id).catch(() => null);

  return NextResponse.json({ success: true, tracked: true });
}
