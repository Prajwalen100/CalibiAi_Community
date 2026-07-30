import { describe, expect, it } from "vitest";
import {
  buildIlikePattern,
  buildOrIlikeFilter,
  isSearchableQuery,
  MAX_QUERY_LENGTH,
  normalizeSearchQuery,
} from "./search-query";

describe("normalizeSearchQuery", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeSearchQuery("  rag   pipelines \n")).toBe("rag pipelines");
  });

  it("returns an empty string for non-string input", () => {
    expect(normalizeSearchQuery(null)).toBe("");
    expect(normalizeSearchQuery(undefined)).toBe("");
  });

  it("clamps overly long queries", () => {
    const long = "a".repeat(500);
    expect(normalizeSearchQuery(long)).toHaveLength(MAX_QUERY_LENGTH);
  });
});

describe("isSearchableQuery", () => {
  it("rejects blank and single-character queries", () => {
    expect(isSearchableQuery("")).toBe(false);
    expect(isSearchableQuery("   ")).toBe(false);
    expect(isSearchableQuery("a")).toBe(false);
  });

  it("accepts two characters or more", () => {
    expect(isSearchableQuery("ai")).toBe(true);
    expect(isSearchableQuery(" ai ")).toBe(true);
  });
});

describe("buildIlikePattern", () => {
  it("wraps the term in quoted wildcards", () => {
    expect(buildIlikePattern("rag")).toBe('"%rag%"');
  });

  it("escapes LIKE wildcards so they match literally", () => {
    expect(buildIlikePattern("100%")).toBe('"%100\\%%"');
    expect(buildIlikePattern("a_b")).toBe('"%a\\_b%"');
  });

  it("escapes double quotes so the term cannot be closed early", () => {
    expect(buildIlikePattern('say "hi"')).toBe('"%say \\"hi\\"%"');
  });

  it("escapes backslashes before other escapes", () => {
    expect(buildIlikePattern("a\\b")).toBe('"%a\\\\b%"');
  });

  it("keeps commas inside the quoted term", () => {
    // A bare comma would otherwise split the surrounding .or() expression.
    expect(buildIlikePattern("a,b")).toBe('"%a,b%"');
  });
});

describe("buildOrIlikeFilter", () => {
  it("joins one ilike term per column", () => {
    expect(buildOrIlikeFilter(["title", "content"], "rag")).toBe(
      'title.ilike."%rag%",content.ilike."%rag%"'
    );
  });

  it("keeps injected separators inside the quoted value", () => {
    const filter = buildOrIlikeFilter(["title"], "x,y.ilike.z");
    expect(filter).toBe('title.ilike."%x,y.ilike.z%"');
  });
});
