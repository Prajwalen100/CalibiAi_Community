/**
 * Markdown block parser for CalibiAI Assistant answers.
 *
 * The assistant replies in markdown, so rendering the raw string in a
 * monospace block made answers look like an unformatted dump. This turns the
 * response into structured blocks (headings, lists, tables, code, quotes) that
 * `components/ai/ai-markdown.tsx` renders as a proper article.
 *
 * It is a whitelist parser: no raw HTML is ever produced, so model output
 * cannot inject markup.
 */

export type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "code"; lang: string; code: string }
  | { type: "quote"; lines: string[] }
  | { type: "table"; header: string[]; rows: string[][] }
  | { type: "hr" };

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableDivider(line: string): boolean {
  return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);
}

export function parseMarkdownBlocks(source: string): MarkdownBlock[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let quote: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ").trim() });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list && list.items.length) blocks.push({ type: "list", ...list });
    list = null;
  };
  const flushQuote = () => {
    if (quote.length) blocks.push({ type: "quote", lines: quote });
    quote = [];
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();

    // Fenced code block
    const fence = line.match(/^\s*```+\s*([A-Za-z0-9+#._-]*)\s*$/);
    if (fence) {
      flushAll();
      const lang = fence[1] || "";
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```+\s*$/.test(lines[i])) {
        body.push(lines[i]);
        i++;
      }
      blocks.push({ type: "code", lang, code: body.join("\n") });
      continue;
    }

    if (!line.trim()) {
      flushAll();
      continue;
    }

    // Horizontal rule
    if (/^\s*(?:---+|\*\*\*+|___+)\s*$/.test(line)) {
      flushAll();
      blocks.push({ type: "hr" });
      continue;
    }

    // Table
    if (line.includes("|") && i + 1 < lines.length && isTableDivider(lines[i + 1]) && line.trim().length > 1) {
      flushAll();
      const header = splitTableRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      i--;
      blocks.push({ type: "table", header, rows });
      continue;
    }

    // Heading
    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.*)$/);
    if (heading) {
      flushAll();
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2].replace(/\s*#+\s*$/, "") });
      continue;
    }

    // Blockquote
    const quoteLine = line.match(/^\s{0,3}>\s?(.*)$/);
    if (quoteLine) {
      flushParagraph();
      flushList();
      quote.push(quoteLine[1]);
      continue;
    }
    flushQuote();

    // List items (-, *, +, or 1. / 1))
    const bullet = line.match(/^\s*[-*+]\s+(.*)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet || ordered) {
      flushParagraph();
      const isOrdered = Boolean(ordered);
      const text = (bullet ? bullet[1] : ordered![1]).trim();
      if (!list || list.ordered !== isOrdered) {
        flushList();
        list = { ordered: isOrdered, items: [] };
      }
      list.items.push(text);
      continue;
    }

    // Continuation of a list item (indented wrapped line)
    if (list && /^\s{2,}\S/.test(raw)) {
      list.items[list.items.length - 1] += ` ${line.trim()}`;
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  flushAll();
  return blocks;
}

/** Tidy up common model formatting slips before the markdown renderer sees them. */
export function normalizeAssistantMarkdown(text: string): string {
  let out = text.replace(/\r\n/g, "\n").trim();

  // Some models wrap the entire markdown answer in a single fenced block.
  const wrapped = out.match(/^```(?:markdown|md)?\s*\n([\s\S]*)\n```$/i);
  if (wrapped) out = wrapped[1].trim();

  out = out
    // Ensure headings/list markers that got glued to the previous line start fresh.
    .replace(/([^\n])\n(#{1,6}\s)/g, "$1\n\n$2")
    // Normalise bullet characters the model sometimes emits.
    .replace(/^[ \t]*[•·]\s+/gm, "- ")
    // Collapse runs of blank lines.
    .replace(/\n{3,}/g, "\n\n")
    // Drop trailing whitespace on each line.
    .replace(/[ \t]+$/gm, "");

  return out.trim();
}
