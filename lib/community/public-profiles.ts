import type { createServerSupabaseClient } from "@/lib/supabase/server";

export type CommunityPublicProfile = {
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_id: number | null;
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
  let response = await supabase
    .from("comm_public_profiles")
    .select("user_id, full_name, username, avatar_id")
    .in("user_id", userIds);

  // Migration 005_profile_avatars.sql has not been applied yet — retry without avatar_id.
  if (response.error && /avatar_id/.test(response.error.message)) {
    response = await supabase
      .from("comm_public_profiles")
      .select("user_id, full_name, username")
      .in("user_id", userIds) as typeof response;
  }
  const { data, error } = response;

  if (error) {
    return rows.map((row) => ({ ...row, profiles: null }));
  }

  const profilesByUserId = new Map(
    ((data ?? []) as Array<Record<string, unknown>>).map((profile) => [
      profile.user_id as string,
      {
        user_id: profile.user_id as string,
        full_name: (profile.full_name as string | null) ?? null,
        username: (profile.username as string | null) ?? null,
        avatar_id: (profile.avatar_id as number | null) ?? null,
      } satisfies CommunityPublicProfile,
    ]),
  );

  return rows.map((row) => ({
    ...row,
    profiles: row.user_id ? profilesByUserId.get(row.user_id) ?? null : null,
  }));
}
