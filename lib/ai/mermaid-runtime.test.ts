// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

// The runtime lazy-imports mermaid; stub it so we can assert on how many
// render attempts happen and with which config, without needing browser
// layout (jsdom can't measure SVG text).
vi.mock("mermaid", () => {
  const render = vi.fn();
  const initialize = vi.fn();
  return {
    default: { initialize, render },
  };
});

type MockedMermaid = {
  initialize: ReturnType<typeof vi.fn>;
  render: ReturnType<typeof vi.fn>;
};

async function loadMockedMermaid(): Promise<{ renderMermaid: typeof import("@/lib/ai/mermaid-runtime")["renderMermaid"]; mocked: MockedMermaid }> {
  const { renderMermaid } = await import("@/lib/ai/mermaid-runtime");
  const mod = (await import("mermaid")) as unknown as { default: MockedMermaid };
  return { renderMermaid, mocked: mod.default };
}

describe("renderMermaid htmlLabels fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Fresh module state between tests so the "already initialized" guard
    // doesn't skip our assertions.
    vi.resetModules();
  });

  it("renders with htmlLabels:true on the first attempt and returns the SVG", async () => {
    vi.doMock("mermaid", () => ({ default: { initialize: vi.fn(), render: vi.fn().mockResolvedValue({ svg: '<svg width="100" height="50">ok</svg>' }) } }));

    const { renderMermaid: render, mocked } = await loadMockedMermaid();
    const svg = await render("flowchart TD\n  A --> B", "light");

    expect(svg).toContain("<svg");
    expect(svg).not.toContain('width="100"');
    expect(mocked.render).toHaveBeenCalledTimes(1);
    const initCall = mocked.initialize.mock.calls[0][0] as { flowchart: { htmlLabels: boolean } };
    expect(initCall.flowchart.htmlLabels).toBe(true);
  });

  it("retries once with htmlLabels:false when the first render throws", async () => {
    vi.doMock("mermaid", () => ({
      default: {
        initialize: vi.fn(),
        render: vi
          .fn()
          .mockRejectedValueOnce(new Error("Could not find a suitable point for the given distance"))
          .mockResolvedValueOnce({ svg: "<svg>retried</svg>" }),
      },
    }));

    const { renderMermaid: render, mocked } = await loadMockedMermaid();
    const svg = await render("flowchart TD\n  A -->|label| B", "dark");

    expect(svg).toContain("<svg>retried</svg>");
    expect(mocked.render).toHaveBeenCalledTimes(2);
    const initCalls = mocked.initialize.mock.calls.map((c) => (c[0] as { flowchart: { htmlLabels: boolean } }).flowchart.htmlLabels);
    expect(initCalls).toEqual([true, false]);
  });

  it("rejects when both the htmlLabels:true and the htmlLabels:false attempts fail", async () => {
    vi.doMock("mermaid", () => ({
      default: {
        initialize: vi.fn(),
        render: vi.fn().mockRejectedValue(new Error("nope")),
      },
    }));

    const { renderMermaid: render } = await loadMockedMermaid();
    await expect(render("flowchart TD\n  A --> B", "light")).rejects.toThrow("nope");
  });
});
