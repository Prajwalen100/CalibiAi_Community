// @vitest-environment jsdom
import { describe, expect, it, beforeAll } from "vitest";
import { renderMermaid } from "@/lib/ai/mermaid-runtime";

function shimSvg() {
  const proto = (globalThis as unknown as { SVGElement?: { prototype: Record<string, unknown> } }).SVGElement?.prototype;
  if (!proto) return;
  const noop = () => ({ x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, toJSON: () => ({}) });
  if (!proto.getBBox) proto.getBBox = noop;
  if (!proto.getBoundingClientRect) proto.getBoundingClientRect = noop;
  if (!proto.getComputedTextLength) proto.getComputedTextLength = () => 0;
  if (!proto.getScreenCTM) proto.getScreenCTM = () => ({ inverse: () => ({}) });
  if (!proto.createSVGPoint) proto.createSVGPoint = () => ({ matrixTransform: () => ({}) });
  if (!proto.getTotalLength) proto.getTotalLength = () => 0;
  if (!proto.getPointAtLength) proto.getPointAtLength = () => ({ x: 0, y: 0 });
  if (!proto.checkEnclosure) proto.checkEnclosure = () => false;
}

describe("real mermaid smoke", () => {
  beforeAll(() => shimSvg());
  it("renders a no-label flowchart with the real mermaid library", async () => {
    const svg = await renderMermaid("flowchart TD\n    A[Start] --> B[Process]\n    B --> C[End]", "light");
    expect(svg).toContain("<svg");
  }, 30000);

  it("rejects for unrenderable content instead of hanging", async () => {
    // In jsdom every labeled flowchart fails (zero-size SVG text layout);
    // the contract is: reject so callers show the retryable source fallback.
    await expect(
      renderMermaid("flowchart TD\n    A[Start] -->|step| B[Process]", "light")
    ).rejects.toThrow();
  }, 30000);
});
