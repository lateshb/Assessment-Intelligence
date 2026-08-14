import { describe, it, expect } from "vitest";
import { buildPrompt } from "../prompt";
import type { Rubric, StudentResponse } from "../types";

const question = "Explain price elasticity of demand.";

const rubric: Rubric[] = [
  { name: "Definition", description: "Correct formula", maxMarks: 3 },
  { name: "Interpretation", description: "Explains what the value means", maxMarks: 4 },
];

const responses: StudentResponse[] = [
  { id: "R01", text: "PED is the percentage change in quantity demanded divided by percentage change in price." },
  { id: "R02", text: "Elasticity means demand falls when price goes up." },
  { id: "R03", text: "It is the slope of the demand curve." },
];

describe("buildPrompt", () => {
  const prompt = buildPrompt(question, rubric, responses);

  it("includes the question text", () => {
    expect(prompt).toContain(question);
  });

  it("includes rubric criteria names", () => {
    for (const r of rubric) {
      expect(prompt).toContain(r.name);
    }
  });

  it("includes rubric maxMarks values", () => {
    for (const r of rubric) {
      expect(prompt).toContain(String(r.maxMarks));
    }
  });

  it("includes all student response IDs", () => {
    for (const r of responses) {
      expect(prompt).toContain(r.id);
    }
  });

  it("includes all student response texts", () => {
    for (const r of responses) {
      expect(prompt).toContain(r.text);
    }
  });

  it("includes all required classification categories", () => {
    expect(prompt).toContain('"correct"');
    expect(prompt).toContain('"partial"');
    expect(prompt).toContain('"misconception"');
  });

  it("includes the low-confidence instruction", () => {
    expect(prompt).toMatch(/confidence/i);
    expect(prompt).toMatch(/below 0\.6/i);
  });

  it("requires JSON output", () => {
    expect(prompt).toMatch(/JSON/i);
    expect(prompt).toContain("perResponse");
  });

  it("includes misconception clustering instruction", () => {
    expect(prompt).toContain("clusters");
    expect(prompt).toContain("explanation");
  });

  it("includes recommendation instruction", () => {
    expect(prompt).toContain("recommendation");
    expect(prompt).toContain("targetIds");
    expect(prompt).toContain("rationale");
  });

  it("includes the evidence quoting instruction", () => {
    expect(prompt).toMatch(/evidence/i);
    expect(prompt).toMatch(/verbatim/i);
  });

  it("includes the criterion scores instruction", () => {
    expect(prompt).toContain("criterionScores");
  });

  it("includes the draft mark instruction", () => {
    expect(prompt).toContain("draftMark");
    expect(prompt).toMatch(/draft/i);
  });

  it("instructs against identity inference", () => {
    expect(prompt).toMatch(/never.*identity|never.*gender|never.*background/i);
  });

  it("returns a non-empty string", () => {
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(100);
  });
});
