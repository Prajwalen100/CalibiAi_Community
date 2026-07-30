import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { calculateNetworkReadiness } from "@/lib/network/readiness";
import { NetworkClient } from "./network-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Network • Exclusive AI Talent Marketplace | CalibiAI",
  description:
    "An exclusive AI Talent Marketplace reserved only for Production Ready AI Engineers. Unlock verified jobs, freelance contracts, AI client requests, and recruiter access.",
};

type StoredRoadmap = {
  days?: { day: number }[];
  totalDays?: number;
};

export default async function NetworkPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Signed-out visitors see a representative preview of the gate.
  let currentScore = 0;
  let totalRoadmapDays = 0;
  let completedRoadmapDays = 0;
  let verifiedProjectsCount = 0;
  let averageProjectScore: number | null = null;
  let hasGithubPortfolio = false;
  let hasCapstone = false;

  if (user) {
    try {
      const [
        { data: scoreRow },
        { data: roadmapRow },
        { data: progressRows },
        { data: projectRows },
      ] = await Promise.all([
        supabase.from("scores").select("total").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("roadmaps")
          .select("generated_plan")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("roadmap_progress").select("status").eq("user_id", user.id),
        supabase
          .from("projects")
          .select("verified,ai_score,repo_url,complexity_tier")
          .eq("user_id", user.id),
      ]);

      if (scoreRow && typeof scoreRow.total === "number") {
        currentScore = scoreRow.total;
      }

      const plan = (roadmapRow?.generated_plan ?? null) as StoredRoadmap | null;
      const planDays = Array.isArray(plan?.days) ? plan.days.length : 0;
      totalRoadmapDays =
        typeof plan?.totalDays === "number" && plan.totalDays > 0
          ? plan.totalDays
          : planDays;
      completedRoadmapDays = (progressRows ?? []).filter(
        (row) => row.status === "completed"
      ).length;

      const verified = (projectRows ?? []).filter((p) => p.verified === true);
      verifiedProjectsCount = verified.length;
      hasGithubPortfolio = verified.some(
        (p) => typeof p.repo_url === "string" && p.repo_url.trim().length > 0
      );
      // Tier 4+ verified work counts as a production-grade capstone.
      hasCapstone = verified.some((p) => Number(p.complexity_tier ?? 0) >= 4);

      const scored = verified
        .map((p) => Number(p.ai_score))
        .filter((n) => Number.isFinite(n));
      if (scored.length > 0) {
        averageProjectScore =
          scored.reduce((sum, n) => sum + n, 0) / scored.length;
      }
    } catch {
      // Fall back to the zeroed defaults if any query fails.
    }
  }

  const readiness = calculateNetworkReadiness({
    currentScore,
    totalRoadmapDays,
    completedRoadmapDays,
    verifiedProjectsCount,
    averageProjectScore,
    hasGithubPortfolio,
    hasCapstone,
  });

  return <NetworkClient readiness={readiness} isSignedIn={Boolean(user)} />;
}
