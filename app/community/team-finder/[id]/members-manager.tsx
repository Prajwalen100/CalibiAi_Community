"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, UserPlus, Check } from "lucide-react";
import { searchCommunityUsers, addMembersToSquad } from "@/app/community/actions";

type SearchResult = {
  user_id: string;
  full_name: string | null;
  username: string | null;
  target_role: string | null;
};

export function SquadMembersManager({
  squadId,
  currentMemberIds,
  maxMembers,
}: {
  squadId: string;
  currentMemberIds: string[];
  maxMembers: number | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, startSearching] = useTransition();
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [adding, startAdding] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function runSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    startSearching(async () => {
      const { results: found } = await searchCommunityUsers(query);
      setResults(found);
    });
  }

  function addOne(user: SearchResult) {
    setError(null);
    setMessage(null);
    startAdding(async () => {
      const result = await addMembersToSquad(squadId, [user.user_id]);
      if ("error" in result) {
        setError(result.error ?? "Unable to add this member.");
        return;
      }
      setAddedIds((prev) => [...prev, user.user_id]);
      setMessage(`${user.full_name || user.username || "Member"} added to the squad.`);
      router.refresh();
    });
  }

  const alreadyIds = new Set([...currentMemberIds, ...addedIds]);

  return (
    <div className="mt-4">
      <form onSubmit={runSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search by name or username…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            minLength={2}
            required
          />
        </div>
        <button type="submit" className="btn-primary" disabled={searching}>
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </button>
      </form>

      <div className="mt-3 max-h-72 divide-y divide-brand-100 overflow-y-auto rounded-2xl border border-brand-100 bg-white">
        {results.length === 0 ? (
          <p className="p-3 text-xs text-slate-500">No results yet.</p>
        ) : results.map((u) => {
          const isMember = alreadyIds.has(u.user_id);
          return (
            <div key={u.user_id} className="flex items-center justify-between gap-2 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{u.full_name || "Unnamed"}</p>
                <p className="truncate text-xs text-slate-500">{u.username ? `@${u.username}` : "no username"}</p>
              </div>
              {isMember ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                  <Check className="h-3 w-3" /> In squad
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => addOne(u)}
                  disabled={adding || (maxMembers !== null && currentMemberIds.length + addedIds.length >= maxMembers)}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UserPlus className="h-3 w-3" /> Add
                </button>
              )}
            </div>
          );
        })}
      </div>

      {message && <p className="mt-3 rounded-xl border border-green-200 bg-green-50 p-2 text-xs font-semibold text-green-800">{message}</p>}
      {error && <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-2 text-xs font-semibold text-rose-700">{error}</p>}
    </div>
  );
}
