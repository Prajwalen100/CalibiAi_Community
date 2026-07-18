import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { attachCommunityProfiles } from "@/lib/community/public-profiles";

export const dynamic = "force-dynamic";

const resourceTypeEmoji: Record<string, string> = {
  pdf: "📄", cheatsheet: "📋", prompt_library: "🧠",
  workflow: "⚡", template: "📝", opensource: "🔓",
};

type ResourceRow = { id: string; title: string; content: string; resource_type: string | null; resource_url: string | null; upvotes: number; profiles: { full_name: string | null; username: string | null } | null };

export default async function ResourcesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let resources: ResourceRow[] = [];

  const { data, error } = await supabase
    .from("comm_posts")
    .select("id, user_id, title, content, resource_type, resource_url, upvotes")
    .eq("post_type", "resource")
    .order("upvotes", { ascending: false })
    .limit(30);
  if (!error) {
    resources = await attachCommunityProfiles(supabase, (data ?? []) as Array<Record<string, unknown>>) as ResourceRow[];
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">📚 Resource Hub</h1>
          <p className="mt-2 text-slate-600">Community-contributed PDFs, cheat sheets, prompt libraries, AI workflows, templates, and open-source tools.</p>
        </div>
        {user && <Link href="/community/create?type=resource" className="btn-primary">Share a Resource</Link>}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Object.entries(resourceTypeEmoji).map(([type, emoji]) => (
          <Link key={type} href={`/community?tab=resource`} className="rounded-2xl border border-slate-200 p-4 text-center transition hover:border-brand-500 hover:shadow-sm">
            <span className="text-2xl">{emoji}</span>
            <p className="mt-1 text-xs font-bold capitalize">{type.replace("_", " ")}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {resources.length > 0 ? resources.map((r) => {
          const emoji = resourceTypeEmoji[r.resource_type ?? ""] ?? "📎";
          return (
            <Link key={r.id} href={`/community/post/${r.id}`} className="card block hover:border-brand-500 transition-colors">
              <div className="flex items-start gap-4">
                <span className="text-3xl">{emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold capitalize text-slate-600">{(r.resource_type ?? "resource").replace("_", " ")}</span>
                  </div>
                  <h3 className="mt-1 font-bold">{r.title}</h3>
                  <p className="mt-1 text-sm text-slate-600 line-clamp-2">{r.content}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                    <span>by {r.profiles?.full_name ?? "Anonymous"}</span>
                    <span>👍 {r.upvotes}</span>
                    {r.resource_url && <span className="font-semibold text-brand-700 hover:underline">Open →</span>}
                  </div>
                </div>
              </div>
            </Link>
          );
        }) : (
          <div className="card text-center">
            <p className="text-4xl">📚</p>
            <h3 className="mt-4 font-bold">No resources shared yet</h3>
            <p className="mt-2 text-sm text-slate-600">Share a useful resource with the community!</p>
          </div>
        )}
      </div>
    </div>
  );
}
