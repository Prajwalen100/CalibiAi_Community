/**
 * Test stub for Next.js's `server-only` package.
 *
 * `server-only` intentionally throws when bundled for the client. Vitest runs
 * in a plain Node environment where that guard cannot resolve, so the alias in
 * vitest.config.ts points at this empty module. The real guard is untouched in
 * dev and production builds.
 */
export {};
