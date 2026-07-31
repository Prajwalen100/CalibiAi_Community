"use client";

/**
 * Browser-side mermaid loader.
 *
 * Mermaid is ~1MB and touches `document` at import time, so it must never end
 * up in a server bundle. Everything here is lazily imported on first diagram
 * and the singleton is shared by every renderer on the page.
 */

import { sanitizeMermaidSource } from "@/lib/ai/mermaid";

export type MermaidTheme = "light" | "dark";

type MermaidApi = {
  initialize: (config: Record<string, unknown>) => void;
  render: (id: string, source: string) => Promise<{ svg: string }>;
};

let mermaidPromise: Promise<MermaidApi> | null = null;
let initializedTheme: MermaidTheme | null = null;
let initializedHtmlLabels: boolean | null = null;
let renderCounter = 0;

// Serialize all mermaid renders so concurrent calls (theme changes,
// multiple diagrams on the page) don't race the singleton instance.
let renderLock = Promise.resolve();

function mermaidConfig(theme: MermaidTheme, htmlLabels = true) {
  const dark = theme === "dark";
  return {
    startOnLoad: false,
    // Labels come from model output, so keep mermaid's HTML escaping on.
    securityLevel: "strict" as const,
    theme: dark ? ("dark" as const) : ("default" as const),
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
    fontSize: 14,
    flowchart: { htmlLabels, curve: "basis" as const, useMaxWidth: true, padding: 14, nodeSpacing: 45, rankSpacing: 55 },
    sequence: { useMaxWidth: true, wrap: true, width: 190, mirrorActors: false },
    gantt: { useMaxWidth: true },
    er: { useMaxWidth: true },
    journey: { useMaxWidth: true },
    themeVariables: dark
      ? {
          background: "transparent",
          primaryColor: "#1e293b",
          primaryTextColor: "#e2e8f0",
          primaryBorderColor: "#3b82f6",
          secondaryColor: "#312e81",
          tertiaryColor: "#0f172a",
          lineColor: "#7c8da6",
          textColor: "#e2e8f0",
          mainBkg: "#1e293b",
          nodeBorder: "#3b82f6",
          clusterBkg: "#0f172a",
          clusterBorder: "#334155",
          titleColor: "#f8fafc",
          edgeLabelBackground: "#0f172a",
          actorBkg: "#1e293b",
          actorBorder: "#3b82f6",
          actorTextColor: "#e2e8f0",
          signalColor: "#94a3b8",
          signalTextColor: "#cbd5e1",
          labelBoxBkgColor: "#1e293b",
          labelTextColor: "#e2e8f0",
          noteBkgColor: "#422006",
          noteTextColor: "#fef3c7",
          noteBorderColor: "#a16207",
        }
      : {
          background: "transparent",
          primaryColor: "#eef8ff",
          primaryTextColor: "#0f172a",
          primaryBorderColor: "#1f8fff",
          secondaryColor: "#ede9fe",
          tertiaryColor: "#f8fafc",
          lineColor: "#64748b",
          textColor: "#0f172a",
          mainBkg: "#eef8ff",
          nodeBorder: "#1f8fff",
          clusterBkg: "#f8fafc",
          clusterBorder: "#cbd5e1",
          titleColor: "#0f172a",
          edgeLabelBackground: "#ffffff",
          actorBkg: "#eef8ff",
          actorBorder: "#1f8fff",
          actorTextColor: "#0f172a",
          signalColor: "#475569",
          signalTextColor: "#334155",
          labelBoxBkgColor: "#eef8ff",
          labelTextColor: "#0f172a",
          noteBkgColor: "#fef9c3",
          noteTextColor: "#713f12",
          noteBorderColor: "#facc15",
        },
  };
}

async function getMermaid(theme: MermaidTheme, htmlLabels: boolean): Promise<MermaidApi> {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((mod) => (mod.default ?? mod) as unknown as MermaidApi);
  }
  const mermaid = await mermaidPromise;
  if (initializedTheme !== theme || initializedHtmlLabels !== htmlLabels) {
    mermaid.initialize(mermaidConfig(theme, htmlLabels));
    initializedTheme = theme;
    initializedHtmlLabels = htmlLabels;
  }
  return mermaid;
}

function postProcessSvg(svg: string): string {
  // Let the SVG shrink to its container rather than keeping a fixed width.
  return svg
    .replace(/\swidth="[\d.]+(?:px)?"/, "")
    .replace(/<svg /, '<svg preserveAspectRatio="xMidYMid meet" ');
}

/**
 * Sanitizes and renders mermaid source to an SVG string.
 * Throws when the diagram is unparseable so callers can fall back to source.
 *
 * Flowchart edge labels are rendered as HTML (`foreignObject`) by default,
 * which depends on browser layout/font measurement. A handful of real-world
 * browsers measure those labels as zero-size on the first attempt (or have
 * mermaid bugs around degenerate edge paths, e.g.
 * "Could not find a suitable point for the given distance"), which fails the
 * whole diagram and would drop readers onto raw source. SVG text labels avoid
 * the HTML-layout dependency entirely, so when the first render throws we
 * retry once with `htmlLabels: false` before giving up.
 */
export async function renderMermaid(source: string, theme: MermaidTheme): Promise<string> {
  // Wait for any previous render to finish before touching the singleton.
  await renderLock;

  let unlock: () => void;
  renderLock = new Promise((res) => {
    unlock = res as () => void;
  });

  const renderedIds: string[] = [];
  let firstError: unknown = null;

  try {
    const sanitized = sanitizeMermaidSource(source);

    // Preferred rendering first; the SVG-text fallback only kicks in when
    // the HTML-label pass actually throws, so healthy browsers never notice.
    for (const htmlLabels of [true, false]) {
      const mermaid = await getMermaid(theme, htmlLabels);
      try {
        renderCounter += 1;
        const id = `calibiai-mermaid-${renderCounter}`;
        renderedIds.push(id);
        const { svg } = await mermaid.render(id, sanitized);
        return postProcessSvg(svg);
      } catch (err) {
        if (firstError === null) firstError = err;
      }
    }

    throw firstError;
  } finally {
    // mermaid leaves a hidden measuring node behind if rendering throws.
    for (const id of renderedIds) document.getElementById(`d${id}`)?.remove();
    unlock!();
  }
}

/** Reads the site theme from the `dark` class the ThemeProvider sets on <html>. */
export function readDocumentTheme(): MermaidTheme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}
