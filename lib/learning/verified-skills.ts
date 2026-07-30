/**
 * Pure data layer for the verified-skills feature.
 *
 * Lives separately from the server-only Supabase wrapper so that the fuzzy
 * matcher can be unit tested without booting a Supabase client.
 *
 * The data model is `public.skills` (a canonical catalog) joined to
 * `public.user_skills` (a per-user row with `verified boolean`). The
 * profile page at `/p/[username]` already reads this; the server-only
 * wrapper in `verified-skills.server.ts` is the new write path.
 */

export type CatalogSkill = { id: string; name: string; category: string | null };
export type ResolvedSkill = { skillId: string; name: string };

/**
 * Normalises a free-text skill label and fuzzy-matches it against the seeded
 * catalog. Two match strategies, in order:
 *
 *   1. Case-insensitive exact match — `"python"` matches `"Python"`,
 *      `"REST APIs"` matches `"REST APIs"`.
 *   2. Substring match in either direction — `"Python Lists"` matches
 *      `"Python"`, `"Vector database"` matches `"Vector Databases"`.
 *
 * Returns unique, de-duplicated results in catalog order. Unknown skills are
 * silently dropped (the assessment may surface role-specific micro-skills that
 * are not in the public catalog yet).
 */
export function mapSkillNamesToCatalog(
  rawNames: readonly (string | null | undefined)[],
  catalog: readonly CatalogSkill[],
): ResolvedSkill[] {
  if (!Array.isArray(rawNames) || rawNames.length === 0) return [];
  if (!Array.isArray(catalog) || catalog.length === 0) return [];

  const seen = new Set<string>();
  const out: ResolvedSkill[] = [];

  const lowered = catalog.map((skill) => ({
    skill,
    name: skill.name.toLowerCase().trim(),
  }));

  for (const raw of rawNames) {
    if (typeof raw !== "string") continue;
    const needle = raw.toLowerCase().trim();
    if (!needle) continue;

    let matched: CatalogSkill | null = null;

    for (const { skill, name } of lowered) {
      if (name === needle) {
        matched = skill;
        break;
      }
    }

    if (!matched) {
      for (const { skill, name } of lowered) {
        if (name.includes(needle) || needle.includes(name)) {
          matched = skill;
          break;
        }
      }
    }

    if (!matched) continue;
    if (seen.has(matched.id)) continue;
    seen.add(matched.id);
    out.push({ skillId: matched.id, name: matched.name });
  }

  return out;
}
