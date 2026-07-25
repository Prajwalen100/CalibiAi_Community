import { describe, expect, it } from "vitest";
import { resolveStudentAccess, type StudentProfileState } from "./student-access";

const profile = (overrides: Partial<StudentProfileState> = {}): StudentProfileState => ({
  role: "student",
  onboarding_step: 1,
  onboarding_completed: false,
  learning_role: null,
  ...overrides,
});

describe("resolveStudentAccess", () => {
  it("keeps a new authenticated student in onboarding", () => {
    const access = resolveStudentAccess(profile(), false);
    expect(access.canAccessStudentArea).toBe(false);
    expect(access.nextPath).toBe("/onboarding");
  });

  it("sends a fully onboarded profile to the assessment without unlocking tabs", () => {
    const access = resolveStudentAccess(
      profile({ onboarding_step: 5, learning_role: "ai_engineer" }),
      false
    );
    expect(access.isReadyForAssessment).toBe(true);
    expect(access.canAccessStudentArea).toBe(false);
    expect(access.nextPath).toBe("/assessment");
  });

  it("requires roadmap assignment after assessment before unlocking tabs", () => {
    const access = resolveStudentAccess(
      profile({ onboarding_step: 5, learning_role: "ai_engineer" }),
      true
    );
    expect(access.canAccessStudentArea).toBe(false);
    expect(access.nextPath).toBe("/roadmap/assign");
  });

  it("unlocks student areas only after assessment and assignment", () => {
    const access = resolveStudentAccess(
      profile({
        onboarding_step: 5,
        onboarding_completed: true,
        learning_role: "ai_engineer",
      }),
      true
    );
    expect(access.canAccessStudentArea).toBe(true);
    expect(access.nextPath).toBe("/dashboard");
  });

  it("does not treat an onboarding flag without an assessment as access", () => {
    const access = resolveStudentAccess(
      profile({ onboarding_completed: true, learning_role: "ai_engineer", onboarding_step: 5 }),
      false
    );
    expect(access.canAccessStudentArea).toBe(false);
    expect(access.nextPath).toBe("/assessment");
  });

  it("identifies employer accounts separately", () => {
    const access = resolveStudentAccess(profile({ role: "employer" }), true);
    expect(access.isEmployer).toBe(true);
    expect(access.canAccessStudentArea).toBe(false);
  });
});
