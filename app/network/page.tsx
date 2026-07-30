import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NetworkClient } from "./network-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Network • Exclusive AI Talent Marketplace | CalibiAI",
  description:
    "An exclusive AI Talent Marketplace reserved only for Production Ready AI Engineers. Unlock verified jobs, freelance contracts, AI client requests, and recruiter access.",
};

export default async function NetworkPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentScore = 642;
  const requiredScore = 850;

  if (user) {
    try {
      const { data: scoreRow } = await supabase
        .from("scores")
        .select("total")
        .eq("user_id", user.id)
        .maybeSingle();

      if (scoreRow && typeof scoreRow.total === "number" && scoreRow.total > 0) {
        currentScore = scoreRow.total;
      }
    } catch {
      // Fallback to default 642 if query fails
    }
  }

  return (
    <NetworkClient
      currentScore={currentScore}
      requiredScore={requiredScore}
    />
  );
}
