import type { ReactNode } from "react";

type BlogMarkdownProps = {
  body: string;
  mode?: "public" | "admin";
};

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] };

function stripLooseAsterisks(value: string) {
  return value.replace(/\*/g, "");
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/gi;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const token = match[0];
    if (match.index > cursor) nodes.push(stripLooseAsterisks(text.slice(cursor, match.index)));

    if (token.startsWith("[") && token.includes("](")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/i);
      if (linkMatch) {
        nodes.push(
          <a key={`link-${match.index}`} href={linkMatch[2]} target="_blank" rel="noopener noreferrer">
            {stripLooseAsterisks(linkMatch[1])}
          </a>
        );
      } else {
        nodes.push(stripLooseAsterisks(token));
      }
    } else if (token.startsWith("`")) {
      nodes.push(<code key={`code-${match.index}`}>{stripLooseAsterisks(token.slice(1, -1))}</code>);
    } else if (token.startsWith("**") || token.startsWith("__")) {
      nodes.push(<strong key={`strong-${match.index}`}>{stripLooseAsterisks(token.slice(2, -2))}</strong>);
    } else if (token.startsWith("*") || token.startsWith("_")) {
      nodes.push(<em key={`em-${match.index}`}>{stripLooseAsterisks(token.slice(1, -1))}</em>);
    } else {
      nodes.push(stripLooseAsterisks(token));
    }

    cursor = match.index + token.length;
  }

  if (cursor < text.length) nodes.push(stripLooseAsterisks(text.slice(cursor)));
  return nodes;
}

function parseBlocks(body: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  function flushParagraph() {
    if (paragraph.length === 0) return;
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
    paragraph = [];
  }

  function flushList() {
    if (!list) return;
    blocks.push({ type: "list", ordered: list.ordered, items: list.items });
    list = null;
  }

  for (const rawLine of body.replace(/\r\n/g, "\n").split("\n")) {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s*(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2].trim() });
      continue;
    }

    const unordered = trimmed.match(/^[-*•]\s+(.+)$/);
    const ordered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const item = (unordered?.[1] ?? ordered?.[1] ?? "").trim();
      const isOrdered = Boolean(ordered);
      if (!list || list.ordered !== isOrdered) {
        flushList();
        list = { ordered: isOrdered, items: [] };
      }
      list.items.push(item);
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  return blocks;
}

export function BlogMarkdown({ body, mode = "public" }: BlogMarkdownProps) {
  const blocks = parseBlocks(body);

  if (blocks.length === 0) {
    return <p className={mode === "admin" ? "text-sm admin-faint" : "text-secondary"}>Nothing to preview yet.</p>;
  }

  const headingClass = (level: number) => {
    if (mode === "admin") {
      if (level <= 1) return "pt-2 text-xl font-black admin-title";
      if (level === 2) return "pt-2 text-lg font-black admin-title";
      return "pt-2 text-base font-black admin-title";
    }
    if (level <= 1) return "mt-8 text-3xl font-black tracking-tight text-primary first:mt-0";
    if (level === 2) return "mt-7 text-2xl font-black tracking-tight text-primary first:mt-0";
    return "mt-6 text-xl font-black text-primary first:mt-0";
  };

  const paragraphClass = mode === "admin" ? "text-sm leading-7 admin-muted" : "text-base leading-8 text-secondary sm:text-lg";
  const listClass =
    mode === "admin"
      ? "ml-5 space-y-1 text-sm leading-7 admin-muted"
      : "ml-6 space-y-2 text-base leading-8 text-secondary sm:text-lg";

  return (
    <div className={mode === "admin" ? "space-y-3" : "space-y-5"}>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const content = renderInline(block.text);
          if (block.level <= 1) return <h2 key={index} className={headingClass(block.level)}>{content}</h2>;
          if (block.level === 2) return <h2 key={index} className={headingClass(block.level)}>{content}</h2>;
          return <h3 key={index} className={headingClass(block.level)}>{content}</h3>;
        }

        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag key={index} className={`${listClass} ${block.ordered ? "list-decimal" : "list-disc"}`}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item)}</li>
              ))}
            </ListTag>
          );
        }

        return (
          <p key={index} className={paragraphClass}>
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
