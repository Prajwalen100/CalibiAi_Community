"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Loader2, Plus, UserPlus, X, Check } from "lucide-react";
import { searchCommunityUsers, createSquad, addMembersToSquad } from "@/app/community/actions";
import { ProfileAvatar } from "@/components/ui/profile-avatar";

type SearchResult = {
  user_id: string;
  full_name: string | null;
  username: string | null;
  target_role: string | null;
  avatar_id: number | null;
};

type MySquadSummary = {
  id: string;
  name: string;
  purpose: string;
  memberCount: number;
  isOwner: boolean;
};

export function TeamFinderClient({
  currentUserId,
  mySquads,
}: {
  currentUserId: string;
  mySquads: MySquadSummary[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, startSearching] = useTransition();
  const [selected, setSelected] = useState<SearchResult[]>([]);
  const [message, setMessage] = useState<{ tone: "info" | "error" | "success"; text: string } | null>(null);

  // Squad creation form state
  const [showCreate, setShowCreate] = useState(false);
  const [squadName, setSquadName] = useState("");
  const [squadDescription, setSquadDescription] = useState("");
  const [squadPurpose, setSquadPurpose] = useState("project");
  const [squadMax, setSquadMax] = useState("");
  const [creating, startCreating] = useTransition();

  // Existing squad selection
  const [existingSquadId, setExistingSquadId] = useState("");
  const [adding, startAdding] = useTransition();

  const ownedSquads = mySquads.filter((s) => s.isOwner);

  function toggleSelected(user: SearchResult) {
    setSelected((prev) => {
      if (prev.some((u) => u.user_id === user.user_id)) {
        return prev.filter((u) => u.user_id !== user.user_id);
      }
      return [...prev, user];
    });
  }

  function runSearch(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startSearching(async () => {
      const { results: found } = await searchCommunityUsers(query);
      setResults(found.filter((r) => r.user_id !== currentUserId));
      if (found.length === 0) setMessage({ tone: "info", text: "No matches found. Try a different spelling." });
    });
  }

  function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startCreating(async () => {
      const fd = new FormData();
      fd.set("name", squadName);
      fd.set("description", squadDescription);
      fd.set("purpose", squadPurpose);
      if (squadMax) fd.set("max_members", squadMax);
      fd.set("initial_member_ids", selected.map((u) => u.user_id).join(","));
      const result = await createSquad(fd);
      if ("error" in result) {
        setMessage({ tone: "error", text: result.error ?? "Unable to create the squad." });
        return;
      }
      setMessage({ tone: "success", text: `Squad "${squadName}" created${selected.length > 0 ? ` with ${selected.length} member${selected.length === 1 ? "" : "s"} added` : ""}.` });
      setSelected([]);
      setSquadName("");
      setSquadDescription("");
      setSquadMax("");
      setShowCreate(false);
      router.push(`/community/team-finder/${result.id}`);
      router.refresh();
    });
  }

  function submitAddToExisting() {
    if (!existingSquadId) {
      setMessage({ tone: "error", text: "Choose a squad to add these members to." });
      return;
    }
    if (selected.length === 0) {
      setMessage({ tone: "error", text: "Search and select at least one member first." });
      return;
    }
    startAdding(async () => {
      const result = await addMembersToSquad(existingSquadId, selected.map((u) => u.user_id));
      if ("error" in result) {
        setMessage({ tone: "error", text: result.error ?? "Unable to add members." });
        return;
      }
      const squadName = ownedSquads.find((s) => s.id === existingSquadId)?.name ?? "squad";
      setMessage({ tone: "success", text: `Added ${selected.length} member${selected.length === 1 ? "" : "s"} to ${squadName}.` });
      setSelected([]);
      router.refresh();
    });
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="rounded-3xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold">Search teammates</h2>
        <p className="mt-1 text-sm text-slate-600">Search by full name or @username, tick the people you want, then create a squad or add them to one you already lead.</p>

        <form onSubmit={runSearch} className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Type a name or username…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              minLength={2}
              required
            />
          </div>
          <button className="btn-primary" type="submit" disabled={searching}>
            {searching ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Searching</span> : "Search"}
          </button>
        </form>

        {selected.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-brand-100 bg-brand-50 p-3">
            <span className="text-xs font-bold text-brand-900">Selected ({selected.length}):</span>
            {selected.map((u) => (
              <button
                key={u.user_id}
                type="button"
                onClick={() => toggleSelected(u)}
                className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-brand-800 shadow-sm hover:bg-brand-100"
              >
                {u.full_name || u.username || "Member"}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-100">
          {results.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">Search results will appear here.</p>
          ) : results.map((u) => {
            const isSelected = selected.some((s) => s.user_id === u.user_id);
            return (
              <div key={u.user_id} className="flex items-center justify-between gap-3 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <ProfileAvatar avatarId={u.avatar_id} size={36} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{u.full_name || "Unnamed member"}</p>
                    <p className="truncate text-xs text-slate-500">{u.username ? `@${u.username}` : "no username"}{u.target_role ? ` · ${u.target_role}` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {u.username && <Link href={`/community/members/${u.username}`} className="text-xs font-semibold text-slate-600 hover:text-ink">Profile</Link>}
                  <button
                    type="button"
                    onClick={() => toggleSelected(u)}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${isSelected ? "bg-green-100 text-green-700" : "bg-brand-50 text-brand-700 hover:bg-brand-100"}`}
                  >
                    {isSelected ? <><Check className="h-3 w-3" /> Selected</> : <><UserPlus className="h-3 w-3" /> Add</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {message && (
          <p role="alert" className={`mt-4 rounded-2xl border p-3 text-sm ${message.tone === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : message.tone === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
            {message.text}
          </p>
        )}
      </div>

      <aside className="space-y-5">
        <div className="rounded-3xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Create a new squad</h3>
            <button type="button" onClick={() => setShowCreate((s) => !s)} className="rounded-full bg-brand-50 p-1.5 text-brand-700 hover:bg-brand-100">
              <Plus className={`h-4 w-4 transition-transform ${showCreate ? "rotate-45" : ""}`} />
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">{selected.length} selected member{selected.length === 1 ? "" : "s"} will be added.</p>

          {showCreate && (
            <form onSubmit={submitCreate} className="mt-4 space-y-3">
              <div>
                <label className="label" htmlFor="squad-name">Name</label>
                <input id="squad-name" className="input mt-1" value={squadName} onChange={(e) => setSquadName(e.target.value)} required minLength={2} placeholder="e.g. RAG Hackers" />
              </div>
              <div>
                <label className="label" htmlFor="squad-purpose">Purpose</label>
                <select id="squad-purpose" className="input mt-1" value={squadPurpose} onChange={(e) => setSquadPurpose(e.target.value)}>
                  <option value="project">Project</option>
                  <option value="hackathon">Hackathon</option>
                  <option value="startup">Startup</option>
                  <option value="study_group">Study group</option>
                  <option value="research">Research</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="squad-desc">Description</label>
                <textarea id="squad-desc" className="input mt-1" rows={3} value={squadDescription} onChange={(e) => setSquadDescription(e.target.value)} placeholder="What are you building or exploring?" />
              </div>
              <div>
                <label className="label" htmlFor="squad-max">Max members (optional)</label>
                <input id="squad-max" className="input mt-1" type="number" min={1} max={50} value={squadMax} onChange={(e) => setSquadMax(e.target.value)} placeholder="e.g. 5" />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={creating}>
                {creating ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Creating…</span> : "Create squad"}
              </button>
            </form>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 p-5">
          <h3 className="font-bold">Add to an existing squad</h3>
          <p className="mt-1 text-xs text-slate-500">Only squads you own are shown here.</p>
          {ownedSquads.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">You don&apos;t own any squads yet. Create one above.</p>
          ) : (
            <div className="mt-3 space-y-3">
              <select className="input" value={existingSquadId} onChange={(e) => setExistingSquadId(e.target.value)}>
                <option value="">Select a squad…</option>
                {ownedSquads.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} · {s.memberCount} member{s.memberCount === 1 ? "" : "s"}</option>
                ))}
              </select>
              <button type="button" onClick={submitAddToExisting} className="btn-secondary w-full" disabled={adding}>
                {adding ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Adding…</span> : `Add ${selected.length || ""} selected`}
              </button>
            </div>
          )}
        </div>

        {mySquads.length > 0 && (
          <div className="rounded-3xl border border-slate-200 p-5">
            <h3 className="font-bold">My squads</h3>
            <ul className="mt-3 space-y-2">
              {mySquads.map((s) => (
                <li key={s.id}>
                  <Link href={`/community/team-finder/${s.id}`} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:border-brand-300">
                    <div>
                      <p className="text-sm font-semibold">{s.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{s.purpose.replace(/_/g, " ")}</p>
                    </div>
                    <span className="text-xs text-slate-500">{s.memberCount} 👥</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}
