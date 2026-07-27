"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, RefreshCw, CheckCircle2, Loader2, X, Wand2 } from "lucide-react";
import { saveProfileAvatar } from "@/app/community/profile/avatar/actions";

type StyleKey = "corporate" | "comic" | "watercolor" | "cyberpunk";

const STYLES: Array<{ key: StyleKey; label: string; dicebear: string; hint: string }> = [
  { key: "corporate", label: "Corporate", dicebear: "notionists", hint: "Professional portrait" },
  { key: "comic", label: "Comic", dicebear: "adventurer", hint: "Vibrant multi-panel" },
  { key: "watercolor", label: "Watercolor", dicebear: "lorelei", hint: "Soft painted illustration" },
  { key: "cyberpunk", label: "Cyberpunk", dicebear: "bottts", hint: "Detailed tech avatar" },
];

function buildUrl(style: StyleKey, seed: string) {
  const dice = STYLES.find((s) => s.key === style)?.dicebear ?? "notionists";
  return `https://api.dicebear.com/9.x/${dice}/svg?seed=${encodeURIComponent(seed)}`;
}

function randomSeed() {
  return Math.random().toString(36).slice(2, 10);
}

export function AiAvatarGenerator({
  displayName,
  initialAvatarUrl,
}: {
  displayName: string;
  initialAvatarUrl?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<StyleKey>("corporate");
  const [seed, setSeed] = useState(() => (initialAvatarUrl ? "current" : randomSeed()));
  const [saving, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const previewUrl = buildUrl(style, seed === "current" && initialAvatarUrl ? initialAvatarUrl : seed === "current" ? randomSeed() : seed);

  function regenerate() {
    setSeed(randomSeed());
    setMessage(null);
  }

  function handleSave() {
    setMessage(null);
    const url = buildUrl(style, seed);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("avatar_url", url);
      const result = await saveProfileAvatar(fd);
      if ("error" in result) {
        setMessage({ tone: "error", text: result.error ?? "Unable to save avatar." });
        return;
      }
      setMessage({ tone: "success", text: "AI avatar saved! It now shows across the platform." });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-brand-500/30"
      >
        <Wand2 className="h-4 w-4" /> Generate your AI avatar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/15 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:bg-slate-900/95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 text-white">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-primary">AI Avatar Studio</p>
                  <p className="text-xs text-subtle">Generate a bespoke look for {displayName}</p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-lg p-2 text-secondary hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Preview */}
            <div className="mt-5 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Generated avatar preview"
                className="h-32 w-32 rounded-2xl border border-slate-200 bg-slate-50 shadow-inner dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            {/* Style picker */}
            <div className="mt-5 grid grid-cols-2 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => { setStyle(s.key); setMessage(null); }}
                  className={`rounded-xl border p-3 text-left transition ${
                    style === s.key
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-950/40"
                      : "border-slate-200 hover:border-brand-300 dark:border-slate-700"
                  }`}
                >
                  <p className="text-sm font-bold text-primary">{s.label}</p>
                  <p className="text-[11px] text-subtle">{s.hint}</p>
                </button>
              ))}
            </div>

            {/* Seed + regenerate */}
            <div className="mt-4 flex items-center gap-2">
              <input
                value={seed === "current" ? "" : seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="Optional seed (e.g. your name)"
                className="input flex-1"
              />
              <button
                type="button"
                onClick={regenerate}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-secondary hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Shuffle
              </button>
            </div>

            {message && (
              <p
                role="status"
                className={`mt-3 rounded-xl border p-3 text-center text-sm ${
                  message.tone === "success"
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                {message.text}
              </p>
            )}

            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex flex-1 items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4" /> Save avatar</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
