import { describe, expect, it } from "vitest";
import { mapSkillNamesToCatalog, type CatalogSkill } from "@/lib/learning/verified-skills";

const catalog: CatalogSkill[] = [
  { id: "py", name: "Python", category: "Programming Languages" },
  { id: "sq", name: "SQL", category: "Programming Languages" },
  { id: "rs", name: "REST APIs", category: "Backend & APIs" },
  { id: "dk", name: "Docker", category: "Cloud & DevOps" },
  { id: "vd", name: "Vector Databases", category: "Vector & Retrieval" },
  { id: "llm", name: "Large Language Models (LLMs)", category: "LLMs & GenAI" },
];

describe("mapSkillNamesToCatalog", () => {
  it("returns an empty array for empty input", () => {
    expect(mapSkillNamesToCatalog([], catalog)).toEqual([]);
    expect(mapSkillNamesToCatalog(undefined as unknown as string[], catalog)).toEqual([]);
    expect(mapSkillNamesToCatalog(null as unknown as string[], catalog)).toEqual([]);
  });

  it("returns an empty array for an empty catalog", () => {
    expect(mapSkillNamesToCatalog(["Python"], [])).toEqual([]);
  });

  it("matches exact names case-insensitively", () => {
    const result = mapSkillNamesToCatalog(["python", "SQL", "rest apis"], catalog);
    expect(result).toEqual([
      { skillId: "py", name: "Python" },
      { skillId: "sq", name: "SQL" },
      { skillId: "rs", name: "REST APIs" },
    ]);
  });

  it("returns the canonical casing when given a non-canonical form", () => {
    const result = mapSkillNamesToCatalog(["Python"], catalog);
    expect(result[0]?.name).toBe("Python");
  });

  it("uses substring matching in either direction", () => {
    const result = mapSkillNamesToCatalog(["Python Lists"], catalog);
    expect(result).toEqual([{ skillId: "py", name: "Python" }]);

    const result2 = mapSkillNamesToCatalog(["vector database"], catalog);
    expect(result2).toEqual([{ skillId: "vd", name: "Vector Databases" }]);
  });

  it("drops names that have no catalog match", () => {
    const result = mapSkillNamesToCatalog(["COBOL", "Fortran", "Docker"], catalog);
    expect(result).toEqual([{ skillId: "dk", name: "Docker" }]);
  });

  it("ignores null and undefined entries without throwing", () => {
    const result = mapSkillNamesToCatalog(
      [null, undefined, "Python", "", "  ", "SQL"] as unknown as string[],
      catalog,
    );
    expect(result).toEqual([
      { skillId: "py", name: "Python" },
      { skillId: "sq", name: "SQL" },
    ]);
  });

  it("deduplicates matched skills", () => {
    const result = mapSkillNamesToCatalog(["Python", "python", "PYTHON"], catalog);
    expect(result).toEqual([{ skillId: "py", name: "Python" }]);
  });

  it("follows input order (caller controls order)", () => {
    // Each unique exact match is appended in the order the caller supplies,
    // so the assessment service can choose the display order if needed.
    const result = mapSkillNamesToCatalog(["Vector Databases", "Python", "Docker"], catalog);
    expect(result.map((skill) => skill.skillId)).toEqual(["vd", "py", "dk"]);
  });
});
