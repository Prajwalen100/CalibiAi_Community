import { NextResponse } from "next/server";
import { z } from "zod";
import { improveWriting } from "@/lib/ai/bedrock";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const BodySchema = z.object({
  text: z.string().min(1).max(6000),
  context: z.string().max(60).optional(),
});

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = BodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter some text first." }, { status: 400 });
  }

  const improved = await improveWriting(parsed.data.text, parsed.data.context);
  if (!improved) {
    return NextResponse.json(
      { error: "AI writing assistant is not available right now. Please try again later." },
      { status: 503 },
    );
  }

  try {
    await supabase.from("ai_usage_logs").insert({
      user_id: user.id,
      feature: "improve_writing",
      input_tokens_est: Math.ceil(parsed.data.text.length / 4),
      output_tokens_est: Math.ceil(improved.length / 4),
    });
  } catch {
    // Usage logging is best-effort only.
  }

  return NextResponse.json({ improved });
}
