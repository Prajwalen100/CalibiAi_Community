/**
 * Mermaid helpers for CalibiAI article/assistant content.
 *
 * Article content is model-generated, so ```mermaid fences arrive with the
 * small syntax slips LLMs reliably make. Mermaid is strict: a single unquoted
 * `(` inside a node label aborts the whole diagram and the reader sees an
 * error box (or, before this, raw diagram source) instead of a chart.
 *
 * Everything here is pure string work so it can be unit tested in Node without
 * loading the (browser-only, ~1MB) mermaid runtime.
 */

/** Code-fence languages that should be rendered as a diagram. */
const MERMAID_LANGS = new Set(["mermaid", "mmd", "mermaidjs"]);

export function isMermaidLang(lang: string | undefined | null): boolean {
  return MERMAID_LANGS.has((lang ?? "").trim().toLowerCase());
}

/** Diagram keywords mermaid understands, used to detect the diagram type. */
const DIAGRAM_TYPE_PATTERN =
  /^(flowchart|graph|sequenceDiagram|classDiagram(-v2)?|stateDiagram(-v2)?|erDiagram|journey|gantt|pie|mindmap|timeline|gitGraph|quadrantChart|requirementDiagram|C4Context|C4Container|C4Component|C4Dynamic|sankey-beta|xychart-beta|block-beta|packet-beta|architecture-beta|kanban|radar-beta|treemap-beta|zenuml|info)\b/;

/**
 * Returns the diagram keyword (`flowchart`, `sequenceDiagram`, …) for a source
 * string, ignoring leading comments, front-matter and directives.
 */
export function getDiagramType(source: string): string | null {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  let inFrontMatter = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line === "---") {
      // YAML front-matter block (`---\nconfig: …\n---`).
      inFrontMatter = !inFrontMatter;
      continue;
    }
    if (inFrontMatter) continue;
    if (line.startsWith("%%")) continue; // comment / directive

    const match = line.match(DIAGRAM_TYPE_PATTERN);
    return match ? match[1] : null;
  }
  return null;
}

/** Node-shape delimiters, longest opener first so `([` wins over `(`. */
const SHAPES: Array<readonly [string, string]> = [
  ["(((", ")))"],
  ["([", "])"],
  ["[[", "]]"],
  ["[(", ")]"],
  ["((", "))"],
  ["{{", "}}"],
  ["[/", "/]"],
  ["[\\", "\\]"],
  ["[", "]"],
  ["(", ")"],
  ["{", "}"],
  [">", "]"],
];

/** Characters that break an unquoted mermaid label. */
const NEEDS_QUOTING = /["()[\]{}|@]/;

/**
 * A label may only start right after a node id. Deliberately excludes `-`, `=`
 * and `.` so arrow tokens (`-->`, `==>`) are never mistaken for the `>` shape.
 */
const ID_CHAR = /[\w\u00C0-\uFFFF]/;

/**
 * What may legally follow a closing shape token. `<` and `>` are excluded on
 * purpose: `]` immediately before `<br/>` is part of the label, not the end
 * of the node (`A["[1.0]<br/>bytes"]`).
 */
function isLabelTerminator(rest: string): boolean {
  return rest === "" || /^[\s\-=.~&;:|)\]}]/.test(rest);
}

/**
 * Index of the closing `"` of a label that opens with `"`, or -1.
 * `#quot;` (mermaid's escape) is not a terminator.
 */
function findClosingQuote(line: string, quoteStart: number): number {
  for (let i = quoteStart + 1; i < line.length; i++) {
    if (line[i] !== '"') continue;
    if (line.startsWith("#quot;", i - 5)) continue;
    return i;
  }
  return -1;
}

function alreadyQuoted(content: string): boolean {
  const trimmed = content.trim();
  return trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"');
}

function quoteLabel(content: string): string {
  // `#quot;` is mermaid's own entity escape for a literal quote in a label.
  return `"${content.replace(/"/g, "#quot;")}"`;
}

/**
 * Wraps risky flowchart node labels in quotes:
 * `A[isna().mean]` -> `A["isna().mean"]`.
 *
 * Scans left to right and copies quoted strings and `|edge labels|` verbatim,
 * so brackets that merely appear *inside* other text are never mistaken for a
 * node shape.
 */
function quoteNodeLabels(line: string): string {
  let out = "";
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    // A bare quoted string (typically an edge label) — copy it untouched.
    if (char === '"') {
      const end = findClosingQuote(line, i);
      if (end === -1) {
        out += line.slice(i);
        break;
      }
      out += line.slice(i, end + 1);
      i = end + 1;
      continue;
    }

    // `|…|` edge label — handled separately by quoteEdgeLabels.
    if (char === "|") {
      const end = line.indexOf("|", i + 1);
      if (end === -1) {
        out += line.slice(i);
        break;
      }
      out += line.slice(i, end + 1);
      i = end + 1;
      continue;
    }

    const prev = i > 0 ? line[i - 1] : "";
    const shape = ID_CHAR.test(prev) ? SHAPES.find(([open]) => line.startsWith(open, i)) : undefined;
    if (!shape) {
      out += char;
      i += 1;
      continue;
    }

    const [open, close] = shape;
    const bodyStart = i + open.length;
    let closeIndex = -1;

    if (line[bodyStart] === '"') {
      // Author already quoted the label: trust the quotes and only look for
      // the shape terminator after the closing quote.
      const endQuote = findClosingQuote(line, bodyStart);
      if (endQuote !== -1 && line.startsWith(close, endQuote + 1)) closeIndex = endQuote + 1;
    } else {
      for (let j = bodyStart; j <= line.length - close.length; j++) {
        if (!line.startsWith(close, j)) continue;
        if (isLabelTerminator(line.slice(j + close.length))) {
          closeIndex = j;
          break;
        }
      }
    }

    // Ambiguous: leave the text exactly as written rather than guess wrong.
    if (closeIndex < bodyStart) {
      out += char;
      i += 1;
      continue;
    }

    const content = line.slice(bodyStart, closeIndex);
    const safe = alreadyQuoted(content) || !NEEDS_QUOTING.test(content) ? content : quoteLabel(content);

    out += open + safe + close;
    i = closeIndex + close.length;
  }

  return out;
}

/** Wraps risky edge labels: `-->|is it (ok)?|` -> `-->|"is it (ok)?"|`. */
function quoteEdgeLabels(line: string): string {
  return line.replace(/(-|=|\.|>|o|x)\|([^|]*)\|/g, (match, arrowEnd: string, label: string) => {
    if (alreadyQuoted(label) || !NEEDS_QUOTING.test(label)) return match;
    return `${arrowEnd}|${quoteLabel(label)}|`;
  });
}

/** Lines that are directives/config rather than diagram nodes. */
const FLOWCHART_PASSTHROUGH =
  /^\s*(%%|classDef\b|class\b|style\b|linkStyle\b|click\b|accTitle\b|accDescr\b|direction\b|end\b|---\s*$)/;

function sanitizeFlowchart(source: string): string {
  return source
    .split("\n")
    .map((line) => {
      if (!line.trim() || FLOWCHART_PASSTHROUGH.test(line)) return line;
      return quoteEdgeLabels(quoteNodeLabels(line));
    })
    .join("\n");
}

/**
 * In sequence diagrams `;` ends a statement, so a semicolon inside message
 * text kills the parse. Swap it for mermaid's numeric entity escape.
 */
function sanitizeSequence(source: string): string {
  return source
    .split("\n")
    .map((line) => {
      if (/^\s*(%%|autonumber|participant|actor|activate|deactivate|end\b|loop|alt|else|opt|par|and|rect|critical|option|break|box)\b/.test(line)) {
        return line;
      }
      const separator = line.indexOf(":");
      if (separator === -1) return line;

      const head = line.slice(0, separator + 1);
      const text = line.slice(separator + 1);
      return head + text.replace(/;/g, "#59;");
    })
    .join("\n");
}

/**
 * Best-effort repair of model-written mermaid so it parses.
 *
 * Always safe to call: unknown diagram types are returned untouched apart from
 * whitespace/fence normalisation.
 */
export function sanitizeMermaidSource(source: string): string {
  let out = (source ?? "").replace(/\r\n/g, "\n");

  // Strip a stray ```mermaid fence that slipped inside the block itself.
  out = out.replace(/^\s*```+\s*[A-Za-z]*\s*\n/, "").replace(/\n\s*```+\s*$/, "");

  // Zero-width + non-breaking spaces from copy-pasted model output.
  out = out.replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\u00a0/g, " ");

  // Normalise self-closing line breaks to the form mermaid documents.
  out = out.replace(/<\s*br\s*\/?\s*>/gi, "<br/>");

  // Tabs confuse mermaid's indentation-sensitive parsers (mindmap, timeline).
  out = out.replace(/\t/g, "    ");

  out = out.replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n").trim();

  const type = getDiagramType(out);
  if (type === "flowchart" || type === "graph") return sanitizeFlowchart(out);
  if (type === "sequenceDiagram") return sanitizeSequence(out);
  return out;
}
