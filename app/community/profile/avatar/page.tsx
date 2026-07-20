import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AvatarPickerClient } from "./avatar-picker-client";

export const dynamic = "force-dynamic";

export default async function ChooseAvatarPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  let profile: { full_name: string | null; username: string | null; avatar_id: number | null } | null = null;

  try {
    let profileResp = await supabase
      .from("profiles")
      .select("full_name, username, avatar_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileResp.error && /avatar_id/.test(profileResp.error.message)) {
      profileResp = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("user_id", user.id)
        .maybeSingle() as unknown as typeof profileResp;
    }

    if (profileResp.data) {
      const raw = profileResp.data as Record<string, unknown>;
      profile = {
        full_name: (raw.full_name as string | null) ?? null,
        username: (raw.username as string | null) ?? null,
        avatar_id: (raw.avatar_id as number | null) ?? null,
      };
    }
  } catch {
    /* avatar_id column or profiles table might not exist yet */
  }

  const displayName =
    (profile?.full_name as string) ||
    (profile?.username ? `@${profile.username as string}` : "You");

  return (
    <div>
      <Link
        href="/community"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Community
      </Link>

      <div className="mt-6 max-w-2xl">
        <h1 className="text-2xl font-black">🎭 Choose your avatar</h1>
        <p className="mt-2 text-slate-600">
          Pick a look that&apos;s uniquely you. Your avatar shows up on your profile,
          posts, comments, squads, event registrations, and everywhere else your name
          appears in the community.
        </p>
      </div>

      <div className="mt-8">
        <AvatarPickerClient
          displayName={displayName}
          initialAvatarId={(profile?.avatar_id as number | null) ?? 1}
        />
      </div>
    </div>
  );
}
