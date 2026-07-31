import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import {
  DEFAULT_PLACEMENT_THRESHOLD,
  normalizePlacementThreshold,
  SETTINGS_KEYS,
} from "./config";

/**
 * Runtime roadmap settings.
 *
 * Resolution order, most specific first:
 *   1. `app_settings` row  — admin-editable at runtime, no redeploy.
 *   2. `ROADMAP_PLACEMENT_THRESHOLD` env var — per-environment override.
 *   3. `DEFAULT_PLACEMENT_THRESHOLD` — the built-in default (60).
 *
 * Every lookup degrades gracefully: a missing table (migration not yet
 * applied), an unreachable database or a malformed value all fall through to
 * the next source rather than breaking placement.
 */

export type RoadmapSettings = {
  placementThreshold: number;
  autoPromotionEnabled: boolean;
  /** Where the threshold came from. Surfaced in the admin UI. */
  thresholdSource: "database" | "environment" | "default";
};

function thresholdFromEnv(): number | null {
  return normalizePlacementThreshold(process.env.ROADMAP_PLACEMENT_THRESHOLD);
}

/** Reads the effective settings. Never throws. */
export async function getRoadmapSettings(): Promise<RoadmapSettings> {
  const envThreshold = thresholdFromEnv();
  const fallback: RoadmapSettings = {
    placementThreshold: envThreshold ?? DEFAULT_PLACEMENT_THRESHOLD,
    autoPromotionEnabled: true,
    thresholdSource: envThreshold !== null ? "environment" : "default",
  };

  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("key,value")
      .in("key", [SETTINGS_KEYS.placementThreshold, SETTINGS_KEYS.autoPromotionEnabled]);

    if (error || !data) return fallback;

    const byKey = new Map(data.map((row) => [row.key as string, row.value]));

    const dbThreshold = normalizePlacementThreshold(byKey.get(SETTINGS_KEYS.placementThreshold));
    const rawAutoPromotion = byKey.get(SETTINGS_KEYS.autoPromotionEnabled);
    const autoPromotionEnabled =
      rawAutoPromotion === undefined || rawAutoPromotion === null
        ? fallback.autoPromotionEnabled
        : rawAutoPromotion === true || rawAutoPromotion === "true";

    return {
      placementThreshold: dbThreshold ?? fallback.placementThreshold,
      autoPromotionEnabled,
      thresholdSource: dbThreshold !== null ? "database" : fallback.thresholdSource,
    };
  } catch {
    return fallback;
  }
}

/** Convenience accessor for callers that only need the threshold. */
export async function resolvePlacementThreshold(): Promise<number> {
  return (await getRoadmapSettings()).placementThreshold;
}

/** Persists an admin-supplied placement threshold. */
export async function setPlacementThreshold(value: unknown): Promise<{ ok: boolean; message?: string }> {
  const normalized = normalizePlacementThreshold(value);
  if (normalized === null) {
    return { ok: false, message: "Threshold must be a number between 0 and 100." };
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase
      .from("app_settings")
      .upsert(
        { key: SETTINGS_KEYS.placementThreshold, value: normalized, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
    if (error) return { ok: false, message: "Could not save the threshold. Is migration 025 applied?" };
    return { ok: true };
  } catch {
    return { ok: false, message: "Settings storage is unavailable." };
  }
}

/** Enables or disables automatic Beginner -> Intermediate promotion. */
export async function setAutoPromotionEnabled(enabled: boolean): Promise<{ ok: boolean; message?: string }> {
  try {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase
      .from("app_settings")
      .upsert(
        { key: SETTINGS_KEYS.autoPromotionEnabled, value: enabled, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
    if (error) return { ok: false, message: "Could not save the setting. Is migration 025 applied?" };
    return { ok: true };
  } catch {
    return { ok: false, message: "Settings storage is unavailable." };
  }
}
