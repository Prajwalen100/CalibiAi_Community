import { describe, expect, it } from "vitest";
import { estimateReadTimeMinutes, normalizeLinks, normalizeTags, slugifyBlogTitle, toBlogPost } from "./posts";

describe("slugifyBlogTitle", () => {
  it("creates url-safe slugs", () => {
    expect(slugifyBlogTitle("Why Verified AI Projects Beat Certificates")).toBe(
      "why-verified-ai-projects-beat-certificates"
    );
    expect(slugifyBlogTitle("  RAG & LLMs: a 2026 guide!  ")).toBe("rag-llms-a-2026-guide");
  });

  it("falls back to untitled-post for empty input", () => {
    expect(slugifyBlogTitle("!!!")).toBe("untitled-post");
  });
});

describe("estimateReadTimeMinutes", () => {
  it("returns at least one minute", () => {
    expect(estimateReadTimeMinutes("short body")).toBe(1);
  });

  it("scales with word count at ~220 wpm", () => {
    expect(estimateReadTimeMinutes(Array.from({ length: 660 }, () => "word").join(" "))).toBe(3);
  });
});

describe("normalizeTags", () => {
  it("splits, trims and de-duplicates comma separated tags", () => {
    expect(normalizeTags(" AI , RAG,AI ,, Careers ")).toEqual(["AI", "RAG", "Careers"]);
  });

  it("accepts arrays", () => {
    expect(normalizeTags(["AI", "AI", "MLOps"])).toEqual(["AI", "MLOps"]);
  });
});

describe("normalizeLinks", () => {
  it("parses 'Label | url' lines", () => {
    expect(normalizeLinks("Docs | https://example.com/docs")).toEqual([
      { label: "Docs", url: "https://example.com/docs" },
    ]);
  });

  it("uses the url as the label for bare urls", () => {
    expect(normalizeLinks("https://example.com")).toEqual([
      { label: "https://example.com", url: "https://example.com" },
    ]);
  });

  it("handles multi-line input and drops invalid entries", () => {
    expect(normalizeLinks("Docs | https://a.com\nnot a link\nhttps://b.com")).toEqual([
      { label: "Docs", url: "https://a.com" },
      { label: "https://b.com", url: "https://b.com" },
    ]);
  });

  it("accepts object arrays and de-duplicates by url", () => {
    expect(
      normalizeLinks([
        { label: "One", url: "https://a.com" },
        { label: "Duplicate", url: "https://a.com" },
      ])
    ).toEqual([{ label: "One", url: "https://a.com" }]);
  });

  it("returns an empty array for junk input", () => {
    expect(normalizeLinks(null)).toEqual([]);
    expect(normalizeLinks(42)).toEqual([]);
  });
});

describe("toBlogPost", () => {
  it("maps database rows into the UI shape", () => {
    const post = toBlogPost({
      id: "abc",
      title: "Test Post",
      body: "Body text here.",
      excerpt: "An excerpt.",
      status: "published",
      author_name: "Prajwal",
      read_time_minutes: 9,
      tags: ["AI"],
      links: [{ label: "Docs", url: "https://example.com" }],
      cover_image_url: "https://img.example.com/a.png",
      published_at: "2026-07-01T00:00:00.000Z",
      created_at: "2026-06-30T00:00:00.000Z",
    });

    expect(post.slug).toBe("test-post");
    expect(post.authorName).toBe("Prajwal");
    expect(post.readTimeMinutes).toBe(9);
    expect(post.links).toEqual([{ label: "Docs", url: "https://example.com" }]);
    expect(post.status).toBe("published");
  });

  it("falls back safely for legacy rows missing the new columns", () => {
    const post = toBlogPost({ id: "x", title: "Legacy", body: "words ".repeat(50), status: "weird" });
    expect(post.authorName).toBeNull();
    expect(post.links).toEqual([]);
    expect(post.status).toBe("draft");
    expect(post.readTimeMinutes).toBeGreaterThanOrEqual(1);
  });
});
