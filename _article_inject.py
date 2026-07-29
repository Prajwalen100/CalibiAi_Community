#!/usr/bin/env python3
"""Inject a Markdown article body into the `content` field of a course-article JSON.

Usage:
    python _article_inject.py <path-to-article.json> <path-to-article.md>

Guarantees:
  * Only the `content` key is modified. Every other key keeps its original value,
    order and type.
  * Output stays valid JSON, written with the same 2-space indentation style used
    by the generator.
  * Prints a single line starting with `OK` on success (including the word count)
    or a line starting with `ERROR` on failure (exit code 1).
"""

from __future__ import annotations

import json
import re
import sys
from collections import OrderedDict
from pathlib import Path


def word_count(markdown: str) -> int:
    """Count prose-ish words: strip fences/markup noise, then count tokens."""
    text = markdown
    # Keep code block contents out of the count is NOT desired -- the guide counts
    # the rendered article, so we only drop fence markers themselves.
    text = re.sub(r"^```.*$", "", text, flags=re.MULTILINE)
    tokens = [t for t in re.split(r"\s+", text) if re.search(r"[0-9A-Za-z]", t)]
    return len(tokens)


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("ERROR usage: python _article_inject.py <article.json> <article.md>")
        return 1

    json_path = Path(argv[1])
    md_path = Path(argv[2])

    if not json_path.is_file():
        print(f"ERROR json not found: {json_path}")
        return 1
    if not md_path.is_file():
        print(f"ERROR markdown not found: {md_path}")
        return 1

    try:
        raw = json_path.read_text(encoding="utf-8")
        data = json.loads(raw, object_pairs_hook=OrderedDict)
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR could not parse json {json_path}: {exc}")
        return 1

    if "content" not in data:
        print(f"ERROR no 'content' field in {json_path}")
        return 1

    body = md_path.read_text(encoding="utf-8").strip()
    if not body:
        print(f"ERROR markdown file is empty: {md_path}")
        return 1
    if not body.lstrip().startswith("#"):
        print(f"ERROR markdown must start with an H1 heading: {md_path}")
        return 1
    if body.lstrip().startswith("---"):
        print(f"ERROR markdown must not contain YAML frontmatter: {md_path}")
        return 1

    before = OrderedDict((k, v) for k, v in data.items() if k != "content")
    data["content"] = body + "\n"
    after = OrderedDict((k, v) for k, v in data.items() if k != "content")

    if list(before.items()) != list(after.items()):
        print(f"ERROR non-content fields would change in {json_path}")
        return 1

    out = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
    try:
        json.loads(out)
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR produced invalid json for {json_path}: {exc}")
        return 1

    json_path.write_text(out, encoding="utf-8")
    n = word_count(body)
    print(f"OK {json_path.name} <- {md_path.name} ({n} words)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
