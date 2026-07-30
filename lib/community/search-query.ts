/**
 * Shared helpers for community search.
 *
 * PostgREST's `.or()` filter takes a comma-separated string where each term is
 * `column.operator.value`. Commas, parentheses and double quotes inside the
 * value would terminate the term early, and `%`/`_` are LIKE wildcards. Both
 * the nav-bar quick search and the full search page build patterns from raw
 * user input, so the escaping lives here once and is unit tested.
 */

/** Longest query we will send to the database. */
export const MAX_QUERY_LENGTH = 80;

/** Shortest query that triggers a search. */
export const MIN_QUERY_LENGTH = 2;

/**
 * Collapses whitespace and clamps length. Returns "" for input that should not
 * trigger a search at all.
 */
export function normalizeSearchQuery(raw: string | null | undefined): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_LENGTH);
}

/** True when the normalized query is long enough to search with. */
export function isSearchableQuery(raw: string | null | undefined): boolean {
  return normalizeSearchQuery(raw).length >= MIN_QUERY_LENGTH;
}

/**
 * Builds a PostgREST-safe `ilike` pattern, wrapped in double quotes so commas
 * and spaces inside the value cannot split the surrounding `.or()` expression.
 *
 * Escapes, in order:
 *  - backslash, so our own escapes cannot be forged
 *  - `%` and `_`, the LIKE wildcards
 *  - `"`, which would close the quoted term early
 */
export function buildIlikePattern(raw: string): string {
  const escaped = normalizeSearchQuery(raw)
    .replace(/\\/g, "\\\\")
    .replace(/[%_]/g, "\\$&")
    .replace(/"/g, '\\"');
  return `"%${escaped}%"`;
}

/**
 * Builds a full PostgREST `.or()` expression matching `query` against every
 * given column, e.g. `title.ilike."%ai%",content.ilike."%ai%"`.
 */
export function buildOrIlikeFilter(columns: string[], query: string): string {
  const pattern = buildIlikePattern(query);
  return columns.map((column) => `${column}.ilike.${pattern}`).join(",");
}
