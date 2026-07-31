/**
 * The blog index (/blog) previously rendered every published post at once,
 * which made the page feel cluttered as more posts get published. This
 * component instead shows a small first batch and reveals more on demand.
 *
 * These tests exercise the pure pagination behaviour (initial batch size,
 * "Show more" increment, and hiding the button once everything is visible)
 * using renderToString the same way the existing hydration tests in this
 * repo do, so no jsdom/DOM environment is required.
 */
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { BlogPostGrid } from "@/components/blog/blog-post-grid";
import type { BlogPost } from "@/lib/blog/posts";

function makePost(index: number): BlogPost {
  return {
    id: `post-${index}`,
    slug: `post-${index}`,
    title: `Post number ${index}`,
    excerpt: "excerpt",
    body: "body",
    category: "Education",
    readTimeMinutes: 3,
    status: "published",
    featured: false,
    tags: [],
    links: [],
    authorName: "CalibiAI Team",
    coverImageUrl: null,
    publishedAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: null,
  };
}

describe("BlogPostGrid", () => {
  it("renders only the first 6 posts and a Show more button when there are more", () => {
    const posts = Array.from({ length: 20 }, (_, i) => makePost(i + 1));
    const html = renderToString(createElement(BlogPostGrid, { posts }));

    for (let i = 1; i <= 6; i++) expect(html).toContain(`Post number ${i}`);
    for (let i = 7; i <= 20; i++) expect(html).not.toContain(`Post number ${i}`);
    expect(html).toContain("Show more");
    // Next click reveals 10 more (up to LOAD_MORE_COUNT), not all 14 remaining.
    // React splits the "+{count}" JSX into separate text nodes over SSR
    // comment markers, so match loosely instead of the literal "+10".
    expect(html).toMatch(/\+<!-- -->10/);
  });

  it("does not render a Show more button when everything already fits", () => {
    const posts = Array.from({ length: 5 }, (_, i) => makePost(i + 1));
    const html = renderToString(createElement(BlogPostGrid, { posts }));

    for (let i = 1; i <= 5; i++) expect(html).toContain(`Post number ${i}`);
    expect(html).not.toContain("Show more");
  });

  it("does not render a Show more button when exactly the initial batch fits", () => {
    const posts = Array.from({ length: 6 }, (_, i) => makePost(i + 1));
    const html = renderToString(createElement(BlogPostGrid, { posts }));

    expect(html).not.toContain("Show more");
  });

  it("caps the '+N' badge at the remaining count when fewer than 10 are left", () => {
    const posts = Array.from({ length: 9 }, (_, i) => makePost(i + 1));
    const html = renderToString(createElement(BlogPostGrid, { posts }));

    expect(html).toContain("Show more");
    expect(html).toMatch(/\+<!-- -->3/);
  });
});
