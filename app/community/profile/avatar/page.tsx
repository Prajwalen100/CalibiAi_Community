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

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, avatar_id")
    .eq("user_id", user.id)
    .maybeSingle();

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
