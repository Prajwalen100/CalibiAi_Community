import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { calculateNetworkReadiness } from "@/lib/network/readiness";
import { NetworkClient } from "./network-client";
import { getRoadmapContext } from "@/lib/roadmap/service";

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
        { data: projectRows },
      ] = await Promise.all([
        supabase.from("scores").select("total").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("projects")
          .select("verified,ai_score,repo_url,complexity_tier,originality_status")
          .eq("user_id", user.id),
      ]);

      if (scoreRow && typeof scoreRow.total === "number" && Number(scoreRow.total) > 0) {
        currentScore = scoreRow.total;
      } else {
        // Self-healing fallback: legacy rows could be 0 after old initializers.
        // Recalculate from live data, same as dashboard does.
        try {
          const { recalculateAndPersistScore } = await import("@/lib/score/recalculate");
          const recalculated = await recalculateAndPersistScore(user.id);
          if (recalculated && typeof recalculated.total === "number") {
            currentScore = recalculated.total;
          }
        } catch {
          // keep 0
        }
      }

      // "Complete AI Roadmap" gates entry to the Network, so it must mean the
      // FULL journey: 90 days for a learner who started on Beginner, 45 for a
      // direct-Intermediate placement. Counting `roadmap_progress` by user_id
      // alone would also double-count, because both stages number days 1..45.
      const journeyContext = await getRoadmapContext(supabase, user.id);
      totalRoadmapDays = journeyContext.state?.overallJourneyDays ?? 0;
      completedRoadmapDays = journeyContext.state?.overallCompletedDays ?? 0;

      const verified = (projectRows ?? []).filter(
        (p: any) => p.verified === true && p.originality_status !== "flagged"
      );
      verifiedProjectsCount = verified.length;
      hasGithubPortfolio = verified.some(
        (p: any) => typeof p.repo_url === "string" && p.repo_url.trim().length > 0
      );

      // Capstone detection must handle both legacy integer tiers (1-5) and new text tiers
      // (beginner/intermediate/advanced) after migration 002_community.sql.
      // Tier 4+ / advanced counts as production-grade capstone.
      const isCapstoneTier = (tier: unknown) => {
        if (typeof tier === "number") return tier >= 4;
        if (typeof tier === "string") {
          const lower = tier.toLowerCase().trim();
          if (lower === "advanced" || lower === "expert") return true;
          const num = Number(lower);
          if (Number.isFinite(num)) return num >= 4;
          // Fallback: intermediate is 3, advanced is 5 in old mapping
          if (lower.includes("advanced")) return true;
        }
        return false;
      };
      hasCapstone = verified.some((p: any) => isCapstoneTier(p.complexity_tier));

      const scored = verified
        .map((p: any) => Number(p.ai_score))
        .filter((n: number) => Number.isFinite(n));
      if (scored.length > 0) {
        averageProjectScore =
          scored.reduce((sum: number, n: number) => sum + n, 0) / scored.length;
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
