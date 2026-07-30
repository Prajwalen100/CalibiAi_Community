"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import {
  isSearchableQuery,
  MAX_QUERY_LENGTH,
  normalizeSearchQuery,
} from "@/lib/community/search-query";
import type { QuickSearchResponse } from "@/app/api/community/search/route";

/** Debounce before hitting the API, in ms. */
const DEBOUNCE_MS = 250;

type FlatResult = {
  key: string;
  href: string;
  title: string;
  subtitle: string;
  icon: string;
  group: string;
};

const EMPTY: QuickSearchResponse = {
  query: "",
  members: [],
  communities: [],
  posts: [],
  total: 0,
};

/** Flattens the grouped response into one keyboard-navigable list. */
function flatten(data: QuickSearchResponse): FlatResult[] {
  return [
    ...data.members.map((m) => ({
      key: `member-${m.id}`,
      href: m.href,
      title: m.title,
      subtitle: m.subtitle,
      icon: "👤",
      group: "Members",
    })),
    ...data.communities.map((c) => ({
      key: `community-${c.id}`,
      href: c.href,
      title: c.title,
      subtitle: c.subtitle,
      icon: c.emoji || "🏘️",
      group: "Communities",
    })),
    ...data.posts.map((p) => ({
      key: `post-${p.id}`,
      href: p.href,
      title: p.title,
      subtitle: p.subtitle,
      icon: "📝",
      group: "Posts",
    })),
  ];
}

/**
 * Navigation-bar search.
 *
 * Clicking the icon expands an input inline in the header (it does not navigate
 * away), and results stream into a dropdown anchored under the nav as the
 * member types. Enter on a highlighted row opens it; Enter with nothing
 * highlighted falls through to the full search page.
 */
export function NavSearch() {
  const router = useRouter();
  const listboxId = useId();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [data, setData] = useState<QuickSearchResponse>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Guards against a slow earlier request overwriting a newer one.
  const requestIdRef = useRef(0);

  const results = flatten(data);
  const trimmed = normalizeSearchQuery(query);
  const searchable = isSearchableQuery(query);
  const showDropdown = open && searchable;

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const reset = useCallback(() => {
    setQuery("");
    setData(EMPTY);
    setFailed(false);
    setActiveIndex(-1);
  }, []);

  // Debounced fetch. Runs only while the panel is open so a stale query does
  // not keep polling after the member collapses the field.
  useEffect(() => {
    // No synchronous setState here: state transitions happen inside the
    // debounced callback so this effect never triggers a cascading render.
    if (!open || !searchable) return;

    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/community/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error(`Search failed: ${response.status}`);
        const payload = (await response.json()) as QuickSearchResponse;
        // Ignore responses that arrived out of order.
        if (requestId !== requestIdRef.current) return;
        setData(payload);
        setFailed(false);
        setActiveIndex(-1);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        if (requestId !== requestIdRef.current) return;
        setData(EMPTY);
        setFailed(true);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, searchable, trimmed]);

  // Collapse on outside click and on Escape from anywhere.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) close();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
        inputRef.current?.blur();
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  const goTo = useCallback(
    (href: string) => {
      close();
      reset();
      router.push(href);
    },
    [close, reset, router]
  );

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (results.length > 0) setActiveIndex((i) => (i + 1) % results.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (results.length > 0) {
        setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
      }
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const active = results[activeIndex];
      if (active) {
        goTo(active.href);
      } else if (searchable) {
        // Nothing highlighted — hand off to the full results page.
        goTo(`/community/search?q=${encodeURIComponent(trimmed)}`);
      }
    }
  }

  // Precompute which rows start a new group instead of mutating during render.
  const startsGroup = results.map(
    (result, index) => index === 0 || result.group !== results[index - 1].group
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Collapsed: icon only. Expanded: inline input inside the nav bar. */}
      {!open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            // Focus after the input mounts.
            window.requestAnimationFrame(() => inputRef.current?.focus());
          }}
          aria-label="Search community"
          aria-expanded={false}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-600 shadow-sm transition-all duration-200 hover:bg-white hover:text-brand-600 dark:border-white/10 dark:bg-white/8 dark:text-white/70 dark:hover:bg-white/12 dark:hover:text-white"
          style={{
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <Search className="h-4 w-4" />
        </button>
      ) : (
        <div className="flex h-9 w-[min(17rem,55vw)] items-center gap-2 rounded-full border border-slate-200 bg-white/90 pl-3 pr-2 shadow-sm transition-all duration-200 focus-within:border-brand-400 sm:w-72 dark:border-white/15 dark:bg-white/10">
          <Search className="h-4 w-4 shrink-0 text-slate-400 dark:text-white/50" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 && results[activeIndex]
                ? `${listboxId}-${results[activeIndex].key}`
                : undefined
            }
            aria-label="Search community"
            autoComplete="off"
            maxLength={MAX_QUERY_LENGTH}
            placeholder="Search posts, people…"
            value={query}
            onChange={(event) => {
              const next = event.target.value;
              setQuery(next);
              // Drop stale rows as soon as the query is too short to search,
              // so they cannot flash back when it becomes searchable again.
              if (!isSearchableQuery(next)) {
                setData(EMPTY);
                setLoading(false);
                setActiveIndex(-1);
              }
            }}
            onKeyDown={onInputKeyDown}
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-white/40"
          />
          {loading && (
            <Loader2
              className="h-3.5 w-3.5 shrink-0 animate-spin text-brand-500"
              aria-hidden="true"
            />
          )}
          <button
            type="button"
            onClick={() => {
              if (query) {
                reset();
                inputRef.current?.focus();
              } else {
                close();
              }
            }}
            aria-label={query ? "Clear search" : "Close search"}
            className="shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Live results, anchored to the nav bar. */}
      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Search results"
          className="absolute right-0 top-[calc(100%+0.6rem)] z-50 max-h-[70vh] w-[min(22rem,88vw)] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl dark:border-white/10 dark:bg-slate-900"
        >
          {loading && results.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-slate-500 dark:text-white/50">
              Searching…
            </p>
          )}

          {!loading && failed && (
            <p className="px-3 py-6 text-center text-sm text-slate-500 dark:text-white/50">
              Search is unavailable right now. Please try again.
            </p>
          )}

          {!loading && !failed && results.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-slate-500 dark:text-white/50">
              No matches for &ldquo;{trimmed}&rdquo;
            </p>
          )}

          {results.map((result, index) => {
            const showHeader = startsGroup[index];
            const isActive = index === activeIndex;

            return (
              <div key={result.key}>
                {showHeader && (
                  <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                    {result.group}
                  </p>
                )}
                <button
                  type="button"
                  id={`${listboxId}-${result.key}`}
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => goTo(result.href)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                    isActive
                      ? "bg-slate-100 dark:bg-white/10"
                      : "hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="shrink-0 text-base" aria-hidden="true">
                    {result.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800 dark:text-white/90">
                      {result.title}
                    </span>
                    <span className="block truncate text-xs capitalize text-slate-500 dark:text-white/50">
                      {result.subtitle}
                    </span>
                  </span>
                </button>
              </div>
            );
          })}

          {results.length > 0 && (
            <>
              <div className="mx-2 my-1 border-t border-slate-100 dark:border-white/10" />
              <button
                type="button"
                onClick={() =>
                  goTo(`/community/search?q=${encodeURIComponent(trimmed)}`)
                }
                className="w-full px-3 py-2 text-left text-xs font-semibold text-brand-600 transition-colors hover:bg-slate-50 dark:text-brand-400 dark:hover:bg-white/5"
              >
                See all results for &ldquo;{trimmed}&rdquo;
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
