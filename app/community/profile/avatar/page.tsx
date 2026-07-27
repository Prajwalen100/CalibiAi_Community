import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { AiAvatarGenerator } from "@/components/ui/ai-avatar-generator";

export const dynamic = "force-dynamic";

export default async function ChooseAvatarPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  let profile: { full_name: string | null; username: string | null; avatar_id: number | null; avatar_url: string | null } | null = null;

  try {
    let profileResp = await supabase
      .from("profiles")
      .select("full_name, username, avatar_id, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileResp.error && /avatar_(id|url)/.test(profileResp.error.message)) {
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
        avatar_url: (raw.avatar_url as string | null) ?? null,
      };
    }
  } catch {
    /* avatar columns might not exist yet */
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
        <h1 className="text-2xl font-black">🎭 Your AI Avatar</h1>
        <p className="mt-2 text-slate-600">
          Generate a bespoke avatar with our AI studio — from professional corporate
          portraits to vibrant comic and watercolor styles. Your avatar shows up on your
          profile, posts, comments, and everywhere your name appears.
        </p>
      </div>

      <div className="mt-8 flex flex-col items-center gap-6 rounded-3xl border border-slate-200 bg-white/70 p-8 text-center backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
        <ProfileAvatar
          avatarId={profile?.avatar_id ?? null}
          avatarUrl={profile?.avatar_url ?? null}
          size={96}
        />
        <div>
          <p className="text-lg font-bold text-primary">{displayName}</p>
          <p className="mt-1 text-sm text-subtle">
            {profile?.avatar_url ? "Current avatar: AI-generated" : "No AI avatar set yet"}
          </p>
        </div>
        <AiAvatarGenerator displayName={displayName} initialAvatarUrl={profile?.avatar_url ?? null} />
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 text-sm text-brand-900 dark:border-brand-900/40 dark:bg-brand-950/30 dark:text-brand-200">
        <Sparkles className="h-4 w-4 shrink-0" />
        <p>
          Tip: use a recognizable seed (like your name) so you can recreate the exact same
          avatar later.
        </p>
      </div>
    </div>
  );
}
