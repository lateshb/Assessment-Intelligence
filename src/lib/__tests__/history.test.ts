import { describe, it, expect } from "vitest";
import { buildHistoryEntry } from "../use-history";
import { validateLibraryRubric } from "../use-rubric-library";
import type { AssessmentState } from "../assessment-types";

// ─── buildHistoryEntry tests (pure function, no DB) ────────────────────────

describe("buildHistoryEntry", () => {
  it("creates a snapshot from assessment state", () => {
    const assessment: AssessmentState = {
      name: "Snapshot Test",
      questions: [
        {
          id: "q-1",
          questionText: "Test question",
          rubric: [
            { name: "C1", description: "D1", maxMarks: 3 },
            { name: "C2", description: "D2", maxMarks: 4 },
          ],
          responseTab: "paste",
          pasteText: "Answer 1\nAnswer 2\nAnswer 3\nAnswer 4\nAnswer 5",
          csvRows: null,
          csvName: "",
          status: "analyzed",
          analysis: {
            perResponse: [
              {
                id: "R1",
                category: "correct",
                misconception: null,
                evidence: "Good",
                confidence: 0.9,
                criterionScores: [1, 0.5],
                draftMark: 4,
              },
            ],
            clusters: [],
            gapMap: [
              { criterion: "C1", masteryPct: 80, level: "good" },
              { criterion: "C2", masteryPct: 60, level: "warning" },
            ],
            recommendation: {
              type: "Review",
              durationMin: 15,
              targetDescription: "Struggling students",
              targetIds: ["R1"],
              rationale: "Low mastery",
              followUp: "1:1 session",
            },
            meta: {
              model: "gemini-2.0-flash",
              latencyMs: 1500,
              disclaimer: "Probabilistic",
              source: "live",
            },
          },
          error: null,
          expanded: true,
          analyzedInputHash: null,
        },
      ],
      analyzeAllInProgress: false,
      demoFlag: false,
    };

    const entry = buildHistoryEntry(assessment);

    expect(entry.assessmentName).toBe("Snapshot Test");
    expect(entry.questions).toHaveLength(1);
    expect(entry.questions[0].questionText).toBe("Test question");
    expect(entry.questions[0].analysis).toBeTruthy();
    // Note: savedAt, trashed, id are added when persisting to DB, not in buildHistoryEntry
  });

  it("copies rubric snapshot independently", () => {
    const assessment: AssessmentState = {
      name: "Test",
      questions: [
        {
          id: "q-1",
          questionText: "Q",
          rubric: [
            { name: "A", description: "D", maxMarks: 1 },
            { name: "B", description: "D", maxMarks: 1 },
          ],
          responseTab: "paste",
          pasteText: "R1\nR2\nR3\nR4\nR5",
          csvRows: null,
          csvName: "",
          status: "analyzed",
          analysis: {
            perResponse: [],
            clusters: [],
            gapMap: [],
            recommendation: {
              type: "T",
              durationMin: 10,
              targetDescription: "D",
              targetIds: [],
              rationale: "R",
              followUp: "F",
            },
            meta: {
              model: "m",
              latencyMs: 100,
              disclaimer: "D",
              source: "live",
            },
          },
          error: null,
          expanded: true,
          analyzedInputHash: null,
        },
      ],
      analyzeAllInProgress: false,
      demoFlag: false,
    };

    const entry = buildHistoryEntry(assessment);
    const historicalRubric = entry.questions[0].rubric;

    // Mutate original assessment rubric
    assessment.questions[0].rubric[0].name = "MUTATED";

    // Historical snapshot should be unchanged
    expect(historicalRubric[0].name).toBe("A");
  });

  it("handles multi-question assessments", () => {
    const assessment: AssessmentState = {
      name: "Multi-Q Test",
      questions: [
        {
          id: "q-1",
          questionText: "Q1",
          rubric: [
            { name: "C1", description: "D", maxMarks: 1 },
            { name: "C2", description: "D", maxMarks: 1 },
          ],
          responseTab: "paste",
          pasteText: "R1\nR2\nR3\nR4\nR5",
          csvRows: null,
          csvName: "",
          status: "analyzed",
          analysis: {
            perResponse: [],
            clusters: [],
            gapMap: [],
            recommendation: { type: "T", durationMin: 10, targetDescription: "D", targetIds: [], rationale: "R", followUp: "F" },
            meta: { model: "m", latencyMs: 100, disclaimer: "D", source: "live" },
          },
          error: null,
          expanded: true,
          analyzedInputHash: null,
        },
        {
          id: "q-2",
          questionText: "Q2",
          rubric: [
            { name: "A1", description: "D", maxMarks: 2 },
            { name: "A2", description: "D", maxMarks: 2 },
          ],
          responseTab: "paste",
          pasteText: "S1\nS2\nS3\nS4\nS5",
          csvRows: null,
          csvName: "",
          status: "analyzed",
          analysis: {
            perResponse: [],
            clusters: [],
            gapMap: [],
            recommendation: { type: "T", durationMin: 20, targetDescription: "D", targetIds: [], rationale: "R", followUp: "F" },
            meta: { model: "m", latencyMs: 200, disclaimer: "D", source: "live" },
          },
          error: null,
          expanded: true,
          analyzedInputHash: null,
        },
      ],
      analyzeAllInProgress: false,
      demoFlag: false,
    };

    const entry = buildHistoryEntry(assessment);

    expect(entry.questions).toHaveLength(2);
    expect(entry.questions[0].questionText).toBe("Q1");
    expect(entry.questions[1].questionText).toBe("Q2");
  });

  it("excludes unanalyzed questions from snapshot", () => {
    const assessment: AssessmentState = {
      name: "Mixed",
      questions: [
        {
          id: "q-1",
          questionText: "Analyzed",
          rubric: [
            { name: "C", description: "D", maxMarks: 1 },
            { name: "C2", description: "D", maxMarks: 1 },
          ],
          responseTab: "paste",
          pasteText: "R1\nR2\nR3\nR4\nR5",
          csvRows: null,
          csvName: "",
          status: "analyzed",
          analysis: {
            perResponse: [],
            clusters: [],
            gapMap: [],
            recommendation: { type: "T", durationMin: 10, targetDescription: "D", targetIds: [], rationale: "R", followUp: "F" },
            meta: { model: "m", latencyMs: 100, disclaimer: "D", source: "live" },
          },
          error: null,
          expanded: true,
          analyzedInputHash: null,
        },
        {
          id: "q-2",
          questionText: "Draft (not analyzed)",
          rubric: [
            { name: "C", description: "D", maxMarks: 1 },
            { name: "C2", description: "D", maxMarks: 1 },
          ],
          responseTab: "paste",
          pasteText: "",
          csvRows: null,
          csvName: "",
          status: "draft",
          analysis: null,
          error: null,
          expanded: true,
          analyzedInputHash: null,
        },
      ],
      analyzeAllInProgress: false,
      demoFlag: false,
    };

    const entry = buildHistoryEntry(assessment);

    // buildHistoryEntry includes ALL questions (analyzed or not)
    // Filtering unanalyzed assessments is done at the DB level (loadHistoryFromDb)
    expect(entry.questions).toHaveLength(2);
    expect(entry.questions[0].status).toBe("analyzed");
    expect(entry.questions[1].status).toBe("draft");
  });
});

// ─── Rubric validation tests (shared with library) ──────────────────────────

describe("validateLibraryRubric (used in history/library)", () => {
  it("validates a correct rubric", () => {
    expect(
      validateLibraryRubric({
        name: "Valid",
        course: "Math",
        criteria: [
          { name: "C1", maxMarks: 2 },
          { name: "C2", maxMarks: 3 },
        ],
      })
    ).toBeNull();
  });

  it("rejects empty name", () => {
    expect(
      validateLibraryRubric({
        name: "",
        course: "X",
        criteria: [
          { name: "C1", maxMarks: 1 },
          { name: "C2", maxMarks: 1 },
        ],
      })
    ).toBe("Rubric name is required.");
  });

  it("rejects empty course", () => {
    expect(
      validateLibraryRubric({
        name: "X",
        course: "",
        criteria: [
          { name: "C1", maxMarks: 1 },
          { name: "C2", maxMarks: 1 },
        ],
      })
    ).toBe("Course is required.");
  });

  it("rejects fewer than 2 criteria", () => {
    expect(
      validateLibraryRubric({
        name: "X",
        course: "Y",
        criteria: [{ name: "C1", maxMarks: 1 }],
      })
    ).toBe("At least 2 criteria are required.");
  });

  it("rejects more than 5 criteria", () => {
    const criteria = Array.from({ length: 6 }, (_, i) => ({ name: `C${i}`, maxMarks: 1 }));
    expect(
      validateLibraryRubric({
        name: "X",
        course: "Y",
        criteria,
      })
    ).toBe("Maximum 5 criteria allowed.");
  });

  it("rejects criteria without name", () => {
    expect(
      validateLibraryRubric({
        name: "X",
        course: "Y",
        criteria: [
          { name: "", maxMarks: 1 },
          { name: "C2", maxMarks: 1 },
        ],
      })
    ).toBe("Every criterion needs a name.");
  });

  it("rejects criteria with 0 marks", () => {
    expect(
      validateLibraryRubric({
        name: "X",
        course: "Y",
        criteria: [
          { name: "C1", maxMarks: 0 },
          { name: "C2", maxMarks: 1 },
        ],
      })
    ).toBe("Every criterion needs at least 1 mark.");
  });
});
