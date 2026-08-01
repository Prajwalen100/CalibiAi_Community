"use client";

import { useEffect } from "react";
import { readDocumentTheme, renderMermaid, type MermaidTheme } from "@/lib/ai/mermaid-runtime";

/**
 * Upgrades mermaid placeholders inside the server-rendered lesson HTML into
 * real diagrams.
 *
 * The lesson reader ships pre-rendered HTML (see `renderLessonMarkdown`), so
 * there is no React tree to hook into. Each mermaid fence is emitted as
 * `<div class="md-mermaid" data-mermaid="…"><pre>source</pre></div>`; this
 * component swaps in the SVG once mermaid loads and leaves the `<pre>` in place
 * when JS is off or the diagram cannot be parsed.
 */
export function LessonDiagrams({ containerId }: { containerId: string }) {
  useEffect(() => {
    let cancelled = false;

    const paint = async (theme: MermaidTheme) => {
      let root = document.getElementById(containerId);
      if (!root) {
        // Retry once after a frame to handle client-side routing / async mounting
        await new Promise((resolve) => requestAnimationFrame(resolve));
        root = document.getElementById(containerId);
      }
      if (!root) return;

      const targets = Array.from(root.querySelectorAll<HTMLElement>(".md-mermaid[data-mermaid]"));
      for (const node of targets) {
        if (cancelled) return;
        if (node.dataset.mermaidTheme === theme) continue;

        const source = node.dataset.mermaid ?? "";
        try {
          const svg = await renderMermaid(source, theme);
          if (cancelled) return;
          node.innerHTML = svg;
          node.dataset.mermaidTheme = theme;
          node.classList.add("md-mermaid-rendered");
        } catch (err) {
          console.error("Lesson diagram rendering failed for source:", source, err);
          // Leave the <pre> fallback untouched; mark it so we do not retry.
          node.dataset.mermaidTheme = theme;
        }
      }
    };

    // Chain paints so concurrent theme changes or rapid observer events
    // never overlap on the singleton mermaid instance.
    let paintChain: Promise<void> = Promise.resolve();
    const queuedPaint = (theme: MermaidTheme) => {
      paintChain = paintChain.then(() => paint(theme)).catch(() => {});
    };

    queuedPaint(readDocumentTheme());

    // Re-render on light/dark switches so diagram colours stay legible.
    const observer = new MutationObserver(() => queuedPaint(readDocumentTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [containerId]);

  return null;
}
