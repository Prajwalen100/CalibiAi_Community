"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";

type Props = { initialQuery: string };

/** Updates the URL after a short pause, allowing the server search results to
 * refresh as the member types without requiring a separate submit action. */
export function LiveSearchForm({ initialQuery }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();

  useEffect(() => setQuery(initialQuery), [initialQuery]);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized === initialQuery.trim()) return;
    const timer = window.setTimeout(() => {
      startTransition(() => {
        router.replace(normalized ? `${pathname}?q=${encodeURIComponent(normalized)}` : pathname, { scroll: false });
      });
    }, 280);
    return () => window.clearTimeout(timer);
  }, [query, initialQuery, pathname, router]);

  return (
    <div className="relative mt-6">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      <input
        className="input w-full py-3 pl-11 pr-20"
        name="q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search posts, communities, members..."
        autoFocus
        autoComplete="off"
        aria-label="Search community"
      />
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {isPending && <Loader2 className="h-4 w-4 animate-spin text-brand-600" aria-label="Searching" />}
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-subtle">Results update as you type.</p>
    </div>
  );
}
