import { describe, expect, it } from "vitest";
import { escapeCsvValue, toCsv, csvFileName } from "./csv";

describe("escapeCsvValue", () => {
  it("returns an empty string for null and undefined", () => {
    expect(escapeCsvValue(null)).toBe("");
    expect(escapeCsvValue(undefined)).toBe("");
  });

  it("quotes values containing commas, quotes or newlines", () => {
    expect(escapeCsvValue("Pune, India")).toBe('"Pune, India"');
    expect(escapeCsvValue('He said "hi"')).toBe('"He said ""hi"""');
    expect(escapeCsvValue("line1\nline2")).toBe('"line1\nline2"');
  });

  it("neutralises spreadsheet formula injection", () => {
    expect(escapeCsvValue("=SUM(A1:A2)")).toBe("'=SUM(A1:A2)");
    expect(escapeCsvValue("+1234567890")).toBe("'+1234567890");
    expect(escapeCsvValue("@handle")).toBe("'@handle");
    // A leading "-" is also escaped, so phone-style values stay literal text.
    expect(escapeCsvValue("-91")).toBe("'-91");
  });

  it("passes through plain values untouched", () => {
    expect(escapeCsvValue("Asha Rao")).toBe("Asha Rao");
    expect(escapeCsvValue(420)).toBe("420");
    expect(escapeCsvValue(true)).toBe("true");
  });
});

describe("toCsv", () => {
  const columns = [
    { key: "name", header: "Name", value: (row: { name: string; score: number }) => row.name },
    { key: "score", header: "Score", value: (row: { name: string; score: number }) => row.score },
  ];

  it("writes a BOM, a header row and CRLF-separated records", () => {
    const csv = toCsv([{ name: "Asha", score: 720 }], columns);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toBe("\uFEFFName,Score\r\nAsha,720\r\n");
  });

  it("emits only a header when there are no rows", () => {
    expect(toCsv([], columns)).toBe("\uFEFFName,Score\r\n");
  });
});

describe("csvFileName", () => {
  it("builds a filesystem-safe timestamped name", () => {
    const name = csvFileName("calibiai-students", new Date("2026-07-25T10:20:30.000Z"));
    expect(name).toBe("calibiai-students-2026-07-25-10-20-30.csv");
  });
});
