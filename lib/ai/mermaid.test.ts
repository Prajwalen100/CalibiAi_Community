import { describe, expect, it } from "vitest";
import { getDiagramType, isMermaidLang, sanitizeMermaidSource } from "@/lib/ai/mermaid";

describe("isMermaidLang", () => {
  it("accepts the fence languages models emit", () => {
    expect(isMermaidLang("mermaid")).toBe(true);
    expect(isMermaidLang("Mermaid")).toBe(true);
    expect(isMermaidLang(" mmd ")).toBe(true);
  });

  it("rejects everything else", () => {
    expect(isMermaidLang("python")).toBe(false);
    expect(isMermaidLang("")).toBe(false);
    expect(isMermaidLang(undefined)).toBe(false);
  });
});

describe("getDiagramType", () => {
  it("reads the diagram keyword", () => {
    expect(getDiagramType("flowchart TD\n  A --> B")).toBe("flowchart");
    expect(getDiagramType("sequenceDiagram\n  A->>B: hi")).toBe("sequenceDiagram");
    expect(getDiagramType("graph LR\n  A --> B")).toBe("graph");
  });

  it("skips comments and front-matter", () => {
    expect(getDiagramType("%%{init: {'theme':'dark'}}%%\nflowchart LR\n  A --> B")).toBe("flowchart");
    expect(getDiagramType("---\ntitle: Demo\n---\nflowchart LR\n  A --> B")).toBe("flowchart");
  });

  it("returns null for non-diagram text", () => {
    expect(getDiagramType("just a paragraph")).toBeNull();
    expect(getDiagramType("")).toBeNull();
  });
});

describe("sanitizeMermaidSource", () => {
  it("quotes flowchart labels containing parentheses", () => {
    expect(sanitizeMermaidSource("flowchart LR\n    B --> C[Assess missing<br/>isna().mean]")).toBe(
      'flowchart LR\n    B --> C["Assess missing<br/>isna().mean"]'
    );
  });

  it("quotes labels using other risky characters", () => {
    expect(sanitizeMermaidSource("flowchart TD\n    A[cost @ scale] --> B[ok]")).toBe(
      'flowchart TD\n    A["cost @ scale"] --> B[ok]'
    );
    expect(sanitizeMermaidSource("flowchart TD\n    A{Retry (3x)?} --> B[ok]")).toBe(
      'flowchart TD\n    A{"Retry (3x)?"} --> B[ok]'
    );
  });

  it("preserves multi-character node shapes", () => {
    expect(sanitizeMermaidSource("flowchart LR\n    A --> E[(Eval: recall@k)]")).toBe(
      'flowchart LR\n    A --> E[("Eval: recall@k")]'
    );
    expect(sanitizeMermaidSource("flowchart LR\n    A --> S([Start (now)])")).toBe(
      'flowchart LR\n    A --> S(["Start (now)"])'
    );
  });

  it("quotes risky edge labels but leaves arrows alone", () => {
    expect(sanitizeMermaidSource("flowchart LR\n    A -->|retry (2x)| B[ok]")).toBe(
      'flowchart LR\n    A -->|"retry (2x)"| B[ok]'
    );
    expect(sanitizeMermaidSource("flowchart LR\n    A -->|no| B[ok]")).toBe("flowchart LR\n    A -->|no| B[ok]");
  });

  it("leaves already-quoted labels untouched", () => {
    const source = 'flowchart LR\n    A["already (safe)"] --> B["fine"]';
    expect(sanitizeMermaidSource(source)).toBe(source);
  });

  it("does not treat a bracket inside a quoted label as the node end", () => {
    const source = 'flowchart LR\n    QD["[CLS] query [SEP]"] --> E["encoder"]';
    expect(sanitizeMermaidSource(source)).toBe(source);
  });

  it("keeps a closing bracket followed by <br/> inside the label", () => {
    const source = 'flowchart TD\n    H["shape=(3,)<br/>float64"] --> D["[1.0]<br/>24 bytes"]';
    expect(sanitizeMermaidSource(source)).toBe(source);
  });

  it("does not rewrite quoted edge labels or the nodes after them", () => {
    const source = 'graph TD\n    dy["dy/dy = 1"] -->|"relu\'(c)=1 since c>0"| dc["dy/dc = 1"]';
    expect(sanitizeMermaidSource(source)).toBe(source);
  });

  it("ignores brackets that appear inside an earlier quoted label", () => {
    const source = 'graph LR\n    A["Input space (n-dim)"] -->|"V^T (rotate)"| B["Output (m-dim)"]';
    expect(sanitizeMermaidSource(source)).toBe(source);
  });

  it("still quotes a bare node that follows a quoted one", () => {
    expect(sanitizeMermaidSource('graph LR\n    A["safe"] --> B[recall@k]')).toBe(
      'graph LR\n    A["safe"] --> B["recall@k"]'
    );
  });

  it("escapes semicolons in sequence-diagram message text", () => {
    expect(sanitizeMermaidSource('sequenceDiagram\n    A-->>U: "submitted (ref CHG-77); awaiting approval"')).toBe(
      'sequenceDiagram\n    A-->>U: "submitted (ref CHG-77)#59; awaiting approval"'
    );
  });

  it("leaves sequence participant declarations alone", () => {
    const source = "sequenceDiagram\n    participant A as Agent (LLM)\n    A->>T: get_order(id)";
    expect(sanitizeMermaidSource(source)).toBe(source);
  });

  it("skips styling and directive lines", () => {
    const source = "flowchart LR\n    A[ok] --> B[fine]\n    classDef hot fill:#f00,stroke:#900\n    style A fill:#eee";
    expect(sanitizeMermaidSource(source)).toBe(source);
  });

  it("normalises break tags, tabs and invisible characters", () => {
    expect(sanitizeMermaidSource("flowchart TD\n\tA[One<BR>Two] --> B[x]")).toBe(
      "flowchart TD\n    A[One<br/>Two] --> B[x]"
    );
    expect(sanitizeMermaidSource("flowchart TD\u200b\n  A --> B")).toBe("flowchart TD\n  A --> B");
  });

  it("removes a stray fence wrapped around the source", () => {
    expect(sanitizeMermaidSource("```mermaid\nflowchart LR\n  A --> B\n```")).toBe("flowchart LR\n  A --> B");
  });

  it("leaves non-flowchart diagram types structurally intact", () => {
    const pie = 'pie title Spend\n    "LLM" : 60\n    "Infra" : 40';
    expect(sanitizeMermaidSource(pie)).toBe(pie);
  });

  it("handles empty input", () => {
    expect(sanitizeMermaidSource("")).toBe("");
  });
});
