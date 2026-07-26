import { describe, expect, it } from "vitest";
import { filterStudents, STUDENT_CSV_COLUMNS, type StudentRecord } from "./students";
import { toCsv } from "./csv";

function student(overrides: Partial<StudentRecord> = {}): StudentRecord {
  return {
    userId: "user-1",
    fullName: "Asha Rao",
    username: "asha",
    email: "asha@example.com",
    phone: "9876543210",
    college: "COEP",
    country: "IN",
    branch: "CSE",
    gradYear: 2026,
    location: "Pune",
    targetRole: "ai_engineer",
    learningRole: "ai_engineer",
    role: "student",
    onboardingCompleted: true,
    onboardingStep: 5,
    githubUrl: null,
    linkedinUrl: null,
    portfolioUrl: null,
    scoreTotal: 620,
    scoreTier: "gold",
    projectsPts: 180,
    skillsPts: 140,
    communityPts: 40,
    completionPts: 120,
    lastActiveAt: "2026-07-20T00:00:00.000Z",
    createdAt: "2026-01-10T00:00:00.000Z",
    updatedAt: "2026-07-20T00:00:00.000Z",
    activity: "active",
    ...overrides,
  };
}

const roster: StudentRecord[] = [
  student(),
  student({
    userId: "user-2",
    fullName: "Vikram Singh",
    username: "vikram",
    email: "vikram@example.com",
    phone: null,
    college: "VIT",
    country: "US",
    learningRole: "genai_engineer",
    targetRole: "genai_engineer",
    scoreTotal: 310,
    activity: "inactive",
    lastActiveAt: "2025-11-01T00:00:00.000Z",
  }),
  student({
    userId: "user-3",
    fullName: "Meera Nair",
    username: "meera",
    email: "meera@college.edu",
    phone: "9000000000",
    college: "COEP",
    country: "IN",
    learningRole: "data_science_engineer",
    targetRole: "data_science_engineer",
    scoreTotal: 880,
    activity: "active",
  }),
];

describe("filterStudents", () => {
  it("returns everyone when no filters are applied", () => {
    expect(filterStudents(roster, {})).toHaveLength(3);
  });

  it("filters by active and inactive status", () => {
    expect(filterStudents(roster, { activity: "active" }).map((s) => s.userId)).toEqual(["user-1", "user-3"]);
    expect(filterStudents(roster, { activity: "inactive" }).map((s) => s.userId)).toEqual(["user-2"]);
  });

  it("filters by college", () => {
    expect(filterStudents(roster, { college: "COEP" })).toHaveLength(2);
    expect(filterStudents(roster, { college: "VIT" })).toHaveLength(1);
    expect(filterStudents(roster, { college: "all" })).toHaveLength(3);
  });

  it("filters by country", () => {
    expect(filterStudents(roster, { country: "IN" }).map((s) => s.userId)).toEqual(["user-1", "user-3"]);
    expect(filterStudents(roster, { country: "US" }).map((s) => s.userId)).toEqual(["user-2"]);
    expect(filterStudents(roster, { country: "all" })).toHaveLength(3);
  });

  it("filters by learning role", () => {
    expect(filterStudents(roster, { role: "genai_engineer" }).map((s) => s.userId)).toEqual(["user-2"]);
  });

  it("filters by score range", () => {
    expect(filterStudents(roster, { minScore: 600 }).map((s) => s.userId)).toEqual(["user-1", "user-3"]);
    expect(filterStudents(roster, { maxScore: 400 }).map((s) => s.userId)).toEqual(["user-2"]);
    expect(filterStudents(roster, { minScore: 300, maxScore: 700 }).map((s) => s.userId)).toEqual([
      "user-1",
      "user-2",
    ]);
  });

  it("searches across name, email, phone, college and country", () => {
    expect(filterStudents(roster, { search: "meera" }).map((s) => s.userId)).toEqual(["user-3"]);
    expect(filterStudents(roster, { search: "9876543210" }).map((s) => s.userId)).toEqual(["user-1"]);
    expect(filterStudents(roster, { search: "college.edu" }).map((s) => s.userId)).toEqual(["user-3"]);
    expect(filterStudents(roster, { search: "coep" })).toHaveLength(2);
    expect(filterStudents(roster, { search: "us" }).map((s) => s.userId)).toEqual(["user-2"]);
  });

  it("combines filters", () => {
    const result = filterStudents(roster, { college: "COEP", activity: "active", minScore: 700 });
    expect(result.map((s) => s.userId)).toEqual(["user-3"]);
  });
});

describe("student CSV export", () => {
  it("includes the fields an admin needs on every row", () => {
    const headers = STUDENT_CSV_COLUMNS.map((column) => column.header);
    expect(headers).toEqual(expect.arrayContaining(["Name", "Email", "Phone Number", "College", "Country", "CalibiAI Score", "Status"]));
  });

  it("serialises filtered students to CSV", () => {
    const rows = filterStudents(roster, { activity: "active" });
    const csv = toCsv(rows, STUDENT_CSV_COLUMNS);
    const lines = csv.replace("\uFEFF", "").trim().split("\r\n");

    expect(lines).toHaveLength(3); // header + 2 active students
    expect(lines[0].startsWith("Name,Email,Phone Number")).toBe(true);
    expect(lines[1]).toContain("Asha Rao");
    expect(lines[1]).toContain("asha@example.com");
    expect(lines[1]).toContain("9876543210");
    expect(lines[1]).toContain("Active");
    expect(csv).not.toContain("Vikram Singh");
  });

  it("writes an empty cell when a student has no phone number", () => {
    const csv = toCsv(filterStudents(roster, { search: "vikram" }), STUDENT_CSV_COLUMNS);
    const row = csv.replace("\uFEFF", "").trim().split("\r\n")[1];
    expect(row.split(",")[2]).toBe("");
  });
});
