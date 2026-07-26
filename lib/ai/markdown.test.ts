import { describe, expect, it } from "vitest";
import { normalizeAssistantMarkdown, parseMarkdownBlocks } from "@/lib/ai/markdown";

describe("parseMarkdownBlocks", () => {
  it("parses headings, paragraphs and inline text", () => {
    const blocks = parseMarkdownBlocks("Short answer.\n\n## Why this happens\n\nBecause of chunking.");
    expect(blocks).toEqual([
      { type: "paragraph", text: "Short answer." },
      { type: "heading", level: 2, text: "Why this happens" },
      { type: "paragraph", text: "Because of chunking." },
    ]);
  });

  it("separates bullet and numbered lists", () => {
    const blocks = parseMarkdownBlocks("- one\n- two\n\n1. first\n2. second");
    expect(blocks).toEqual([
      { type: "list", ordered: false, items: ["one", "two"] },
      { type: "list", ordered: true, items: ["first", "second"] },
    ]);
  });

  it("joins wrapped list-item continuation lines", () => {
    const blocks = parseMarkdownBlocks("- a bullet that\n  wraps onto a second line");
    expect(blocks).toEqual([{ type: "list", ordered: false, items: ["a bullet that wraps onto a second line"] }]);
  });

  it("keeps fenced code verbatim with its language", () => {
    const blocks = parseMarkdownBlocks('```python\nprint("hi")\n\nprint("bye")\n```');
    expect(blocks).toEqual([{ type: "code", lang: "python", code: 'print("hi")\n\nprint("bye")' }]);
  });

  it("does not treat markdown inside a code fence as blocks", () => {
    const blocks = parseMarkdownBlocks("```\n# not a heading\n- not a list\n```");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("code");
  });

  it("parses tables", () => {
    const blocks = parseMarkdownBlocks("| Option | Speed |\n| --- | --- |\n| FAISS | Fast |\n| pgvector | Medium |");
    expect(blocks).toEqual([
      { type: "table", header: ["Option", "Speed"], rows: [["FAISS", "Fast"], ["pgvector", "Medium"]] },
    ]);
  });

  it("parses blockquotes and horizontal rules", () => {
    const blocks = parseMarkdownBlocks("> note one\n> note two\n\n---\n\nafter");
    expect(blocks).toEqual([
      { type: "quote", lines: ["note one", "note two"] },
      { type: "hr" },
      { type: "paragraph", text: "after" },
    ]);
  });

  it("returns nothing for empty input", () => {
    expect(parseMarkdownBlocks("")).toEqual([]);
    expect(parseMarkdownBlocks("   \n\n  ")).toEqual([]);
  });
});

describe("normalizeAssistantMarkdown", () => {
  it("unwraps an answer fenced as a whole markdown block", () => {
    expect(normalizeAssistantMarkdown("```markdown\n## Title\n\nBody text.\n```")).toBe("## Title\n\nBody text.");
  });

  it("keeps genuine code fences intact", () => {
    const input = 'Answer:\n\n```python\nprint("hi")\n```';
    expect(normalizeAssistantMarkdown(input)).toBe(input);
  });

  it("puts a blank line before a heading glued to the previous line", () => {
    expect(normalizeAssistantMarkdown("Answer text.\n## Section")).toBe("Answer text.\n\n## Section");
  });

  it("normalises bullet glyphs and collapses blank-line runs", () => {
    expect(normalizeAssistantMarkdown("• one\n• two\n\n\n\nend")).toBe("- one\n- two\n\nend");
  });

  it("strips trailing whitespace on lines", () => {
    expect(normalizeAssistantMarkdown("line one   \nline two\t")).toBe("line one\nline two");
  });
});
