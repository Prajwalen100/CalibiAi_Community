import type { ReactNode } from "react";
import { parseMarkdownBlocks } from "@/lib/ai/markdown";

/**
 * Renders a CalibiAI Assistant markdown answer as a readable article.
 * Parsing lives in `lib/ai/markdown.ts` (unit tested); this file only maps
 * blocks to styled JSX.
 */

const INLINE_PATTERN =
  /(\[[^\]]+\]\((?:https?:\/\/|\/)[^\s)]+\)|`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|(?<![A-Za-z0-9])_[^_\n]+_(?![A-Za-z0-9])|~~[^~]+~~)/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  INLINE_PATTERN.lastIndex = 0;

  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    const token = match[0];
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    const key = `${keyPrefix}-${match.index}`;

    if (token.startsWith("[")) {
      const link = token.match(/^\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)$/);
      if (link) {
        const external = link[2].startsWith("http");
        nodes.push(
          <a
            key={key}
            href={link[2]}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="font-semibold text-indigo-600 underline underline-offset-2 hover:text-indigo-800 dark:text-indigo-300"
          >
            {link[1]}
          </a>
        );
      } else {
        nodes.push(token);
      }
    } else if (token.startsWith("`")) {
      nodes.push(
        <code
          key={key}
          className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-indigo-700 dark:bg-slate-800 dark:text-indigo-300"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("***")) {
      nodes.push(
        <strong key={key} className="font-bold">
          <em>{token.slice(3, -3)}</em>
        </strong>
      );
    } else if (token.startsWith("**") || token.startsWith("__")) {
      nodes.push(
        <strong key={key} className="font-bold text-slate-900 dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("~~")) {
      nodes.push(
        <span key={key} className="line-through opacity-70">
          {token.slice(2, -2)}
        </span>
      );
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    cursor = match.index + token.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

export function AiMarkdown({ content, className = "" }: { content: string; className?: string }) {
  const blocks = parseMarkdownBlocks(content ?? "");

  return (
    <div className={`ai-markdown text-[0.95rem] leading-relaxed text-slate-700 dark:text-slate-200 ${className}`}>
      {blocks.map((block, index) => {
        const key = `block-${index}`;
        switch (block.type) {
          case "heading": {
            const size =
              block.level <= 1
                ? "mt-6 text-xl font-black text-slate-900 dark:text-white"
                : block.level === 2
                  ? "mt-6 text-lg font-black text-slate-900 dark:text-white"
                  : block.level === 3
                    ? "mt-5 text-base font-bold text-slate-900 dark:text-white"
                    : "mt-4 text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300";
            const Tag = (`h${Math.min(block.level + 1, 6)}` as unknown) as "h2";
            return (
              <Tag key={key} className={`${size} first:mt-0 scroll-m-20`}>
                {renderInline(block.text, key)}
              </Tag>
            );
          }
          case "paragraph":
            return (
              <p key={key} className="mt-3 first:mt-0">
                {renderInline(block.text, key)}
              </p>
            );
          case "list":
            return block.ordered ? (
              <ol key={key} className="mt-3 list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-indigo-500">
                {block.items.map((item, itemIndex) => (
                  <li key={`${key}-${itemIndex}`} className="pl-1">
                    {renderInline(item, `${key}-${itemIndex}`)}
                  </li>
                ))}
              </ol>
            ) : (
              <ul key={key} className="mt-3 list-disc space-y-1.5 pl-5 marker:text-indigo-500">
                {block.items.map((item, itemIndex) => (
                  <li key={`${key}-${itemIndex}`} className="pl-1">
                    {renderInline(item, `${key}-${itemIndex}`)}
                  </li>
                ))}
              </ul>
            );
          case "code":
            return (
              <div key={key} className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                {block.lang && (
                  <div className="border-b border-slate-800 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-slate-400">
                    {block.lang}
                  </div>
                )}
                <pre className="overflow-x-auto p-4 text-[0.8rem] leading-6 text-slate-100">
                  <code className="font-mono">{block.code}</code>
                </pre>
              </div>
            );
          case "quote":
            return (
              <blockquote
                key={key}
                className="mt-4 rounded-r-xl border-l-4 border-indigo-300 bg-indigo-50/70 px-4 py-3 text-slate-700 dark:border-indigo-500 dark:bg-indigo-950/30 dark:text-slate-200"
              >
                {block.lines.map((line, lineIndex) => (
                  <p key={`${key}-${lineIndex}`} className="mt-1 first:mt-0">
                    {renderInline(line, `${key}-${lineIndex}`)}
                  </p>
                ))}
              </blockquote>
            );
          case "table":
            return (
              <div key={key} className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      {block.header.map((cell, cellIndex) => (
                        <th
                          key={`${key}-h-${cellIndex}`}
                          className="border-b border-slate-200 px-3 py-2 text-left font-bold text-slate-900 dark:border-slate-700 dark:text-white"
                        >
                          {renderInline(cell, `${key}-h-${cellIndex}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={`${key}-r-${rowIndex}`} className="odd:bg-white even:bg-slate-50/60 dark:odd:bg-slate-900 dark:even:bg-slate-800/40">
                        {row.map((cell, cellIndex) => (
                          <td
                            key={`${key}-r-${rowIndex}-${cellIndex}`}
                            className="border-b border-slate-100 px-3 py-2 align-top dark:border-slate-800"
                          >
                            {renderInline(cell, `${key}-r-${rowIndex}-${cellIndex}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "hr":
            return <hr key={key} className="my-5 border-slate-200 dark:border-slate-700" />;
          default:
            return null;
        }
      })}
    </div>
  );
}
