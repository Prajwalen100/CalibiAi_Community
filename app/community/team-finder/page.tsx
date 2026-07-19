import Link from "next/link";
import { Users, Plus, Sparkles } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TeamFinderClient } from "./team-finder-client";

export const dynamic = "force-dynamic";

type SquadRow = {
  id: string;
  name: string;
  description: string | null;
  purpose: string;
  is_open: boolean;
  max_members: number | null;
  owner_id: string;
  created_at: string;
};

type SquadWithMembers = SquadRow & {
  member_count: number;
  is_member: boolean;
  is_owner: boolean;
};

export default async function TeamFinderPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let squads: SquadWithMembers[] = [];
  let mySquads: SquadWithMembers[] = [];
  let setupNeeded: string | null = null;

  const { data, error } = await supabase
    .from("comm_squads")
    .select("id, name, description, purpose, is_open, max_members, owner_id, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    if (/comm_squads|relation .* does not exist/i.test(error.message)) {
      setupNeeded = "The Team Finder database has not been set up yet. Apply migration 004_squads_events_applications.sql to enable squads.";
    }
  } else if (data && data.length > 0) {
    const ids = data.map((s) => s.id);
    const { data: memberRows } = await supabase
      .from("comm_squad_members")
      .select("squad_id, user_id")
      .in("squad_id", ids);

    const countBySquad = new Map<string, number>();
    const mySquadIds = new Set<string>();
    (memberRows ?? []).forEach((row) => {
      countBySquad.set(row.squad_id, (countBySquad.get(row.squad_id) ?? 0) + 1);
      if (user && row.user_id === user.id) mySquadIds.add(row.squad_id);
    });

    squads = (data as SquadRow[]).map((s) => ({
      ...s,
      member_count: countBySquad.get(s.id) ?? 0,
      is_member: mySquadIds.has(s.id),
      is_owner: !!user && s.owner_id === user.id,
    }));

    mySquads = squads.filter((s) => s.is_member || s.is_owner);
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-black">🔍 Team Finder</h1>
          <p className="mt-2 text-slate-600">
            Search teammates by name or username, then create a new squad or add them to an existing one.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4 text-center">
          <p className="text-2xl">🤝</p>
          <p className="mt-2 text-sm font-bold">Find teammates</p>
          <p className="mt-1 text-xs text-slate-600">Search by name or @username</p>
        </div>
        <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4 text-center">
          <p className="text-2xl">🚀</p>
          <p className="mt-2 text-sm font-bold">Create a squad</p>
          <p className="mt-1 text-xs text-slate-600">Hackathon, startup or study group</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-center">
          <p className="text-2xl">➕</p>
          <p className="mt-2 text-sm font-bold">Add to an existing squad</p>
          <p className="mt-1 text-xs text-slate-600">Grow your existing crew</p>
        </div>
      </div>

      {setupNeeded && (
        <div role="alert" className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-bold">Setup needed</p>
          <p className="mt-1">{setupNeeded}</p>
        </div>
      )}

      {!user ? (
        <div className="mt-6 card text-center">
          <Users className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="mt-3 font-bold">Sign in to build a squad</h2>
          <p className="mt-1 text-sm text-slate-600">Search members and create teams once you&apos;re signed in.</p>
          <Link href="/" className="btn-primary mt-4 inline-flex">Sign in</Link>
        </div>
      ) : (
        <TeamFinderClient
          currentUserId={user.id}
          mySquads={mySquads.map((s) => ({ id: s.id, name: s.name, purpose: s.purpose, memberCount: s.member_count, isOwner: s.is_owner }))}
        />
      )}

      {squads.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2"><Sparkles className="h-5 w-5 text-brand-600" /> Open squads</h2>
            <span className="text-xs text-slate-500">{squads.length} squad{squads.length === 1 ? "" : "s"}</span>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {squads.map((s) => (
              <Link key={s.id} href={`/community/team-finder/${s.id}`} className="card block transition-colors hover:border-brand-500">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold capitalize text-brand-700">{s.purpose.replace(/_/g, " ")}</span>
                  <span className="text-xs text-slate-500">{s.member_count}{s.max_members ? ` / ${s.max_members}` : ""} members</span>
                </div>
                <h3 className="mt-3 text-lg font-bold">{s.name}</h3>
                {s.description && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{s.description}</p>}
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>Created {new Date(s.created_at).toLocaleDateString()}</span>
                  {s.is_owner ? (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-800">Owner</span>
                  ) : s.is_member ? (
                    <span className="rounded-full bg-green-50 px-2 py-0.5 font-semibold text-green-700">Member</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-semibold text-brand-700"><Plus className="h-3 w-3" /> View squad</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
