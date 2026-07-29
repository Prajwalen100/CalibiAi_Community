"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Check, Code2, Copy, Maximize2, X } from "lucide-react";
import { readDocumentTheme, renderMermaid, type MermaidTheme } from "@/lib/ai/mermaid-runtime";

/**
 * Renders a ```mermaid code fence as an actual diagram.
 *
 * Article and assistant content is model-generated, so the source is repaired
 * by the sanitizer first and any diagram that still fails to parse degrades to
 * its readable source instead of mermaid's red error box.
 */

/** Tracks the `dark` class on <html> so diagrams follow the site theme. */
function useDocumentTheme(): MermaidTheme {
  const [theme, setTheme] = useState<MermaidTheme>("light");

  useEffect(() => {
    const sync = () => setTheme(readDocumentTheme());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return theme;
}

function SourceBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto bg-slate-950 p-4 text-[0.8rem] leading-6 text-slate-100">
      <code className="font-mono">{code}</code>
    </pre>
  );
}

const TOOLBAR_BUTTON =
  "rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200";

export function MermaidDiagram({ code, className = "" }: { code: string; className?: string }) {
  const theme = useDocumentTheme();

  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    renderMermaid(code, theme)
      .then((rendered) => {
        if (cancelled) return;
        setSvg(rendered);
        setFailed(false);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [code, theme]);

  const copySource = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — nothing useful to surface */
    }
  }, [code]);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomed(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed]);

  // Unparseable even after sanitizing: show the source, never a broken box.
  if (failed) {
    return (
      <div className={`mt-4 overflow-hidden rounded-xl border border-amber-300 dark:border-amber-500/40 ${className}`}>
        <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5" />
          Diagram source
        </div>
        <SourceBlock code={code} />
      </div>
    );
  }

  return (
    <>
      <figure
        className={`relative mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/60 ${className}`}
      >
        <figcaption className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-1.5 dark:border-slate-700">
          <span className="font-mono text-[11px] uppercase tracking-wide text-slate-400">Diagram</span>
          <span className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowSource((value) => !value)}
              className={TOOLBAR_BUTTON}
              aria-pressed={showSource}
              aria-label={showSource ? "Hide diagram source" : "Show diagram source"}
              title={showSource ? "Hide source" : "Show source"}
            >
              <Code2 className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={copySource} className={TOOLBAR_BUTTON} aria-label="Copy diagram source" title="Copy source">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <button type="button" onClick={() => setZoomed(true)} className={TOOLBAR_BUTTON} aria-label="Expand diagram" title="Expand">
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </span>
        </figcaption>

        {svg ? (
          <div
            className="mermaid-diagram overflow-x-auto px-3 py-5"
            // Markup is produced by mermaid in strict mode (labels escaped)
            // from source that the sanitizer already normalised.
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="flex h-32 items-center justify-center gap-2 text-xs font-medium text-slate-400">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500" />
            Rendering diagram…
          </div>
        )}

        {showSource && (
          <div className="border-t border-slate-200 dark:border-slate-700">
            <SourceBlock code={code} />
          </div>
        )}
      </figure>

      {zoomed && svg && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Expanded diagram"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={() => setZoomed(false)}
        >
          <div
            className="relative max-h-full w-full max-w-6xl overflow-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomed(false)}
              className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              aria-label="Close expanded diagram"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mermaid-diagram mermaid-diagram-zoom mt-4" dangerouslySetInnerHTML={{ __html: svg }} />
          </div>
        </div>
      )}
    </>
  );
}
