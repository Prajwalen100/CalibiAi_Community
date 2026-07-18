import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CreatePostForm } from "./create-form";

export const dynamic = "force-dynamic";

export default async function CreatePostPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; community?: string }>;
}) {
  const { type, community } = await searchParams;
  // Jobs use their own structured workflow and never share the discussion
  // composer. Keep old /community/create?type=job links working as well.
  if (type === "job") redirect("/community/jobs/create");

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  let communities: Array<{ id: string; name: string; emoji: string; slug: string }> = [];
  try {
    const { data } = await supabase.from("comm_communities").select("id, name, emoji, slug").order("sort_order");
    communities = data ?? [];
  } catch { /* table might not exist */ }

  return (
    <div>
      <h1 className="text-2xl font-black">Create a Post</h1>
      <p className="mt-2 text-slate-600">Share something with the CalibiAI community.</p>
      <CreatePostForm
        communities={communities}
        defaultType={type}
        defaultCommunity={community}
      />
    </div>
  );
}
