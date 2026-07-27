import { NextResponse } from "next/server";
import { z } from "zod";
import { runPromptPlayground } from "@/lib/ai/bedrock";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const BodySchema = z.object({ prompt: z.string().min(1).max(4000) });

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = BodySchema.parse(await request.json());
  const answer = await runPromptPlayground(body.prompt);

  // Persist the Q&A so the student can revisit it later and we can surface a
  // saved-question count. Saving history is best-effort: a failure here must
  // never block the answer from being returned to the user.
  let qaId: string | null = null;
  try {
    const { data: qa, error: qaError } = await supabase
      .from("student_ai_qa")
      .insert({
        user_id: user.id,
        question: body.prompt,
        answer,
        model: "calibiai-assistant",
      })
      .select("id")
      .single();
    if (!qaError && qa) qaId = String((qa as Record<string, unknown>).id);
  } catch {
    // Ignore history-write failures.
  }

  await supabase.from("ai_usage_logs").insert({ user_id: user.id, feature: "prompt_playground", input_tokens_est: Math.ceil(body.prompt.length / 4), output_tokens_est: Math.ceil(answer.length / 4) });
  return NextResponse.json({ answer, qaId });
}
