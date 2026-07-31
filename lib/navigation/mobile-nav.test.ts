import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  EMPLOYER_TAB_ITEMS,
  isNavItemActive,
  PUBLIC_MENU_ITEMS,
  STUDENT_MENU_ITEMS,
  STUDENT_TAB_ITEMS,
} from "./mobile-nav";

describe("mobile navigation config", () => {
  it("exposes exactly five primary tabs for students", () => {
    // The bottom bar is sized for five targets; more would break touch sizing.
    expect(STUDENT_TAB_ITEMS).toHaveLength(5);
    expect(STUDENT_TAB_ITEMS.map((item) => item.label)).toEqual([
      "Dashboard",
      "Learning",
      "Community",
      "Network",
      "Profile",
    ]);
  });

  it("exposes five primary tabs for employers", () => {
    expect(EMPLOYER_TAB_ITEMS).toHaveLength(5);
  });

  it("keeps secondary items out of the primary tab bar", () => {
    const primary = new Set(STUDENT_TAB_ITEMS.map((item) => item.label));
    for (const item of STUDENT_MENU_ITEMS) {
      expect(primary.has(item.label)).toBe(false);
    }
  });

  it("carries serializable icon names, never components", () => {
    // The nav config is imported by the server-rendered SiteHeader. Passing a
    // component across the RSC boundary throws at build time, so this guards
    // against a regression that only surfaces during `next build`.
    for (const item of [...STUDENT_TAB_ITEMS, ...STUDENT_MENU_ITEMS, ...EMPLOYER_TAB_ITEMS, ...PUBLIC_MENU_ITEMS]) {
      expect(typeof item.icon).toBe("string");
    }
  });
});

describe("isNavItemActive", () => {
  it("matches nested routes via matchPrefix", () => {
    const community = STUDENT_TAB_ITEMS.find((item) => item.label === "Community")!;
    expect(isNavItemActive(community, "/community")).toBe(true);
    expect(isNavItemActive(community, "/community/jobs/123")).toBe(true);
    expect(isNavItemActive(community, "/dashboard")).toBe(false);
  });

  it("does not treat a sibling with a shared string prefix as active", () => {
    const dashboard = STUDENT_TAB_ITEMS.find((item) => item.label === "Dashboard")!;
    // "/dashboards-other" must not light up the "/dashboard" tab.
    expect(isNavItemActive(dashboard, "/dashboards-other")).toBe(false);
  });

  it("honours exact matching for the public home link", () => {
    const home = PUBLIC_MENU_ITEMS.find((item) => item.label === "Home")!;
    expect(isNavItemActive(home, "/")).toBe(true);
    expect(isNavItemActive(home, "/blog")).toBe(false);
  });

  it("never marks a mailto link active", () => {
    const support = STUDENT_MENU_ITEMS.find((item) => item.label === "Support")!;
    expect(isNavItemActive(support, "/anything")).toBe(false);
  });
});

describe("desktop safety contract", () => {
  const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
  const mobileLayer = css.slice(css.indexOf("MOBILE + PWA LAYER"));

  /**
   * Strips every `@media (max-width: ...)` block, brace-matched, leaving only
   * the rules that apply at all viewport widths.
   */
  function stripBelowLgBlocks(text: string): string {
    const out: string[] = [];
    const opener = /@media \(max-width: (?:1023\.98|639\.98)px\)\s*\{/g;
    let index = 0;
    for (;;) {
      opener.lastIndex = index;
      const match = opener.exec(text);
      if (!match) {
        out.push(text.slice(index));
        break;
      }
      out.push(text.slice(index, match.index));
      let depth = 1;
      let cursor = match.index + match[0].length;
      while (cursor < text.length && depth > 0) {
        if (text[cursor] === "{") depth += 1;
        else if (text[cursor] === "}") depth -= 1;
        cursor += 1;
      }
      index = cursor;
    }
    return out.join("");
  }

  it("never restyles a pre-existing class outside a below-lg media query", () => {
    const unscoped = stripBelowLgBlocks(mobileLayer);

    // Classes that already existed before the mobile pass. If the mobile layer
    // redefined any of them unconditionally, desktop rendering would change.
    const preExisting = [
      "card",
      "ui-card",
      "btn-primary",
      "btn-secondary",
      "btn-outline",
      "btn-ghost",
      "input",
      "textarea",
      "heading-1",
      "heading-2",
      "glass-pill",
      "card-hover-lift",
    ];

    for (const name of preExisting) {
      const selector = new RegExp(`\\.${name}\\b[^{]*\\{`);
      expect(
        selector.test(unscoped),
        `.${name} must only be restyled inside a below-lg media query`,
      ).toBe(false);
    }
  });

  it("scopes the tab-bar body offset to below lg", () => {
    // `has-mobile-tabbar` is added to <body> by a client component that stays
    // mounted at every width, so the padding itself must be media-scoped.
    const unscoped = stripBelowLgBlocks(mobileLayer);
    expect(unscoped).not.toMatch(/body\.has-mobile-tabbar\s*\{/);
    expect(mobileLayer).toMatch(/body\.has-mobile-tabbar\s*\{/);
  });
});
