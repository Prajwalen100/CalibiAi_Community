import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SquadMembersManager } from "./members-manager";
import { ProfileAvatar } from "@/components/ui/profile-avatar";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function SquadDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: squad, error } = await supabase
    .from("comm_squads")
    .select("id, name, description, purpose, is_open, max_members, owner_id, created_at")
    .eq("id", id)
    .single();

  if (error || !squad) notFound();

  const { data: membersData } = await supabase
    .from("comm_squad_members")
    .select("user_id, role, joined_at")
    .eq("squad_id", id)
    .order("joined_at", { ascending: true });

  const memberIds = (membersData ?? []).map((m) => m.user_id);
  let profiles: Array<{ user_id: string; full_name: string | null; username: string | null; target_role: string | null; avatar_id: number | null }> = [];
  if (memberIds.length > 0) {
    let profResponse = await supabase
      .from("comm_public_profiles")
      .select("user_id, full_name, username, target_role, avatar_id")
      .in("user_id", memberIds);
    if (profResponse.error && /avatar_id/.test(profResponse.error.message)) {
      profResponse = await supabase
        .from("comm_public_profiles")
        .select("user_id, full_name, username, target_role")
        .in("user_id", memberIds) as unknown as typeof profResponse;
    }
    profiles = ((profResponse.data ?? []) as Array<Record<string, unknown>>).map((r) => ({
      user_id: r.user_id as string,
      full_name: (r.full_name as string | null) ?? null,
      username: (r.username as string | null) ?? null,
      target_role: (r.target_role as string | null) ?? null,
      avatar_id: (r.avatar_id as number | null) ?? null,
    }));
  }
  const profileById = new Map(profiles.map((p) => [p.user_id, p]));

  const members = (membersData ?? []).map((m) => {
    const profile = profileById.get(m.user_id);
    return {
      user_id: m.user_id,
      role: m.role as string,
      joined_at: m.joined_at as string,
      full_name: profile?.full_name ?? null,
      username: profile?.username ?? null,
      target_role: profile?.target_role ?? null,
      avatar_id: profile?.avatar_id ?? null,
    };
  });

  const isOwner = !!user && user.id === squad.owner_id;
  const isMember = !!user && members.some((m) => m.user_id === user.id);
  const capReached = !!squad.max_members && members.length >= squad.max_members;

  return (
    <div>
      <Link href="/community/team-finder" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to Team Finder
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <article className="rounded-3xl border border-slate-200 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold capitalize text-brand-700">{squad.purpose.replace(/_/g, " ")}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {members.length}{squad.max_members ? ` / ${squad.max_members}` : ""} members
            </span>
            {capReached && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">Full</span>}
          </div>
          <h1 className="mt-4 text-3xl font-black">{squad.name}</h1>
          <p className="mt-3 text-sm text-slate-500">Created {new Date(squad.created_at).toLocaleDateString()}</p>
          {squad.description && (
            <p className="mt-6 whitespace-pre-wrap leading-7 text-slate-700">{squad.description}</p>
          )}

          <section className="mt-8">
            <h2 className="flex items-center gap-2 text-lg font-bold"><Users className="h-5 w-5" /> Roster</h2>
            <ul className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-100">
              {members.map((m) => (
                <li key={m.user_id} className="flex items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <ProfileAvatar avatarId={m.avatar_id} size={40} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{m.full_name || "Unnamed member"}</p>
                      <p className="truncate text-xs text-slate-500">{m.username ? `@${m.username}` : "no username"}{m.target_role ? ` · ${m.target_role}` : ""}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${m.role === "owner" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-700"}`}>{m.role}</span>
                </li>
              ))}
            </ul>
          </section>
        </article>

        <aside className="h-fit rounded-3xl border border-brand-100 bg-brand-50 p-6">
          {isOwner ? (
            <>
              <h2 className="text-lg font-bold text-brand-950">Add more teammates</h2>
              <p className="mt-2 text-sm text-brand-900">Search below and tap a member to add them instantly.</p>
              <SquadMembersManager squadId={squad.id} currentMemberIds={memberIds} maxMembers={squad.max_members} />
            </>
          ) : isMember ? (
            <>
              <h2 className="text-lg font-bold text-brand-950">You&apos;re in this squad 🎉</h2>
              <p className="mt-2 text-sm text-brand-900">Head back to Team Finder to build another crew or add more members through the owner.</p>
              <Link href="/community/team-finder" className="btn-primary mt-4 inline-flex">Back to Team Finder</Link>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-brand-950">Interested?</h2>
              <p className="mt-2 text-sm text-brand-900">Only the squad owner can add members. Reach out to them so you can be invited.</p>
              <Link href="/community/team-finder" className="btn-primary mt-4 inline-flex">Back to Team Finder</Link>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
