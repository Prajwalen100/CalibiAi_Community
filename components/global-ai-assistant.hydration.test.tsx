/**
 * Hydration-parity regression test for GlobalAiAssistant.
 *
 * The assistant previously read localStorage inside a useState initializer,
 * so the first client render (saved chat thread restored) never matched the
 * server-rendered HTML (empty "Hi, I'm Calibi AI" greeting). Because the
 * assistant mounts in the ROOT layout, React discarded and regenerated the
 * entire page tree on every load for signed-in users with a saved thread.
 *
 * This test renders the component the way SSR does (no `window`) and the way
 * the first client render must do (localStorage already holds a thread) and
 * asserts the markup is byte-identical. renderToString never runs effects,
 * so any state read during the initial render is exercised exactly like the
 * real hydration pass.
 */
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/community" }));

import { GlobalAiAssistant } from "@/components/global-ai-assistant";

const SAVED_THREAD = JSON.stringify([
  { id: "u1", role: "user", content: "what is python" },
  { id: "a1", role: "assistant", content: "Python is a programming language." },
]);

describe("GlobalAiAssistant hydration parity", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    // Simulate the browser: localStorage already contains a previous chat.
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          getItem: (key: string) =>
            key === "calibiai-chat-thread" ? SAVED_THREAD : null,
          setItem: () => undefined,
        },
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  });

  it("renders byte-identical markup in server and client environments", () => {
    const clientHtml = renderToString(createElement(GlobalAiAssistant));

    delete (globalThis as Record<string, unknown>).window;
    const serverHtml = renderToString(createElement(GlobalAiAssistant));

    expect(clientHtml).toBe(serverHtml);
  });

  it("keeps the empty-state greeting on the first client render even with a saved thread", () => {
    const clientHtml = renderToString(createElement(GlobalAiAssistant));

    expect(clientHtml).toContain("Hi, I&#x27;m Calibi AI.");
    // The saved thread must NOT appear in the initial render — it is
    // restored by an effect after hydration completes.
    expect(clientHtml).not.toContain("what is python");
  });
});
