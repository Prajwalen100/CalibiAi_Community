import type { createServerSupabaseClient } from "@/lib/supabase/server";

export type CommunityPublicProfile = {
  user_id: string;
  full_name: string | null;
  username: string | null;
};

type ServerSupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

type RowWithAuthor = Record<string, unknown> & { user_id?: string | null };

/**
 * `comm_posts.user_id` points to auth.users, while profile records point to the
 * same auth user. They do not have a direct database relationship, so
 * PostgREST cannot embed `profiles(...)` in a comm_posts query. Fetch the
 * small, public profile directory separately and merge it into the rows.
 */
export async function attachCommunityProfiles<T extends RowWithAuthor>(
  supabase: ServerSupabaseClient,
  rows: T[],
): Promise<Array<T & { profiles: CommunityPublicProfile | null }>> {
  const userIds = [...new Set(
    rows
      .map((row) => row.user_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0),
  )];

  if (userIds.length === 0) {
    return rows.map((row) => ({ ...row, profiles: null }));
  }

  // The view deliberately exposes only a display name and username. If the
  // latest migration has not been applied yet, still return the posts instead
  // of hiding the whole feed; cards will use their Anonymous fallback.
  const { data, error } = await supabase
    .from("comm_public_profiles")
    .select("user_id, full_name, username")
    .in("user_id", userIds);

  if (error) {
    return rows.map((row) => ({ ...row, profiles: null }));
  }

  const profilesByUserId = new Map(
    (data ?? []).map((profile) => [
      profile.user_id,
      {
        user_id: profile.user_id,
        full_name: profile.full_name,
        username: profile.username,
      } satisfies CommunityPublicProfile,
    ]),
  );

  return rows.map((row) => ({
    ...row,
    profiles: row.user_id ? profilesByUserId.get(row.user_id) ?? null : null,
  }));
}
