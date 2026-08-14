import { describe, it, expect } from "vitest";
import { historyReducer, buildHistoryEntry } from "../use-history";
import type { HistoryEntry } from "../history-types";
import type { AssessmentState } from "../assessment-types";

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeEntry(overrides?: Partial<HistoryEntry>): HistoryEntry {
  return {
    id: "hist-1",
    assessmentName: "Test Assessment",
    course: "",
    questions: [
      {
        id: "q-1",
        questionText: "Explain price elasticity.",
        rubric: [
          { name: "Definition", description: "Formula", maxMarks: 3 },
          { name: "Example", description: "Real-world", maxMarks: 4 },
        ],
        responses: [
          { id: "R01", text: "Answer 1" },
          { id: "R02", text: "Answer 2" },
        ],
        analysis: {
          perResponse: [],
          clusters: [],
          gapMap: [],
          recommendation: {
            type: "Revision",
            durationMin: 15,
            targetDescription: "All",
            targetIds: [],
            rationale: "Test",
            followUp: "Test",
          },
          meta: { model: "test", latencyMs: 100, disclaimer: "Test", source: "live" as const },
        },
        status: "analyzed",
      },
    ],
    savedAt: "2026-01-01T00:00:00Z",
    trashed: false,
    ...overrides,
  };
}

function makeTwoQuestionEntry(): HistoryEntry {
  return makeEntry({
    questions: [
      {
        id: "q-1",
        questionText: "Q1",
        rubric: [{ name: "C1", description: "", maxMarks: 2 }, { name: "C2", description: "", maxMarks: 3 }],
        responses: [{ id: "R01", text: "A1" }],
        analysis: null,
        status: "draft",
      },
      {
        id: "q-2",
        questionText: "Q2",
        rubric: [{ name: "C1", description: "", maxMarks: 2 }, { name: "C2", description: "", maxMarks: 3 }],
        responses: [{ id: "R01", text: "A2" }],
        analysis: {
          perResponse: [],
          clusters: [],
          gapMap: [],
          recommendation: {
            type: "Revision",
            durationMin: 10,
            targetDescription: "All",
            targetIds: [],
            rationale: "",
            followUp: "",
          },
          meta: { model: "test", latencyMs: 50, disclaimer: "", source: "live" as const },
        },
        status: "analyzed",
      },
    ],
  });
}

// ─── Reducer tests ─────────────────────────────────────────────────────────

describe("historyReducer", () => {
  describe("SAVE_ENTRY", () => {
    it("adds analyzed assessment to history", () => {
      const result = historyReducer([], {
        type: "SAVE_ENTRY",
        entry: {
          assessmentName: "My Test",
          course: "",
          questions: makeEntry().questions,
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0].assessmentName).toBe("My Test");
      expect(result[0].id).toMatch(/^hist-/);
      expect(result[0].savedAt).toBeTruthy();
      expect(result[0].trashed).toBe(false);
    });

    it("preserves multiple questions belonging to one assessment", () => {
      const entry = makeTwoQuestionEntry();
      const result = historyReducer([], {
        type: "SAVE_ENTRY",
        entry: {
          assessmentName: entry.assessmentName,
          course: "",
          questions: entry.questions,
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0].questions).toHaveLength(2);
      expect(result[0].questions[0].id).toBe("q-1");
      expect(result[0].questions[1].id).toBe("q-2");
    });
  });

  describe("DELETE_ENTRY", () => {
    it("moves to trash (does not permanently remove)", () => {
      const state = [makeEntry()];
      const result = historyReducer(state, { type: "DELETE_ENTRY", id: "hist-1" });
      expect(result).toHaveLength(1);
      expect(result[0].trashed).toBe(true);
    });
  });

  describe("RESTORE_ENTRY", () => {
    it("restores from trash to active", () => {
      const state = [makeEntry({ trashed: true })];
      const result = historyReducer(state, { type: "RESTORE_ENTRY", id: "hist-1" });
      expect(result).toHaveLength(1);
      expect(result[0].trashed).toBe(false);
    });
  });

  describe("PERMANENT_DELETE", () => {
    it("permanently removes entry", () => {
      const state = [makeEntry({ trashed: true })];
      const result = historyReducer(state, { type: "PERMANENT_DELETE", id: "hist-1" });
      expect(result).toHaveLength(0);
    });
  });

  describe("CLEAR_TRASH", () => {
    it("removes all trashed entries", () => {
      const state = [
        makeEntry({ id: "h1", trashed: true }),
        makeEntry({ id: "h2", trashed: false }),
        makeEntry({ id: "h3", trashed: true }),
      ];
      const result = historyReducer(state, { type: "CLEAR_TRASH" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("h2");
    });
  });
});

// ─── Assessment-first structure ────────────────────────────────────────────

describe("assessment-first history", () => {
  it("history entries are assessment-level, not question-level", () => {
    const entry = makeTwoQuestionEntry();
    // An entry contains the full assessment with all its questions
    expect(entry.assessmentName).toBe("Test Assessment");
    expect(entry.questions).toHaveLength(2);
    // Each question lives under the assessment, not as a standalone entry
    expect(entry.questions[0].questionText).toBe("Q1");
    expect(entry.questions[1].questionText).toBe("Q2");
  });
});

// ─── buildHistoryEntry ─────────────────────────────────────────────────────

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
            perResponse: [],
            clusters: [],
            gapMap: [],
            recommendation: {
              type: "Revision",
              durationMin: 15,
              targetDescription: "All",
              targetIds: [],
              rationale: "R",
              followUp: "F",
            },
            meta: { model: "test", latencyMs: 100, disclaimer: "", source: "live" as const },
          },
          error: null,
          expanded: true,
          analyzedInputHash: "hash",
        },
      ],
      analyzeAllInProgress: false,
      demoFlag: false,
    };

    const entry = buildHistoryEntry(assessment);
    expect(entry.assessmentName).toBe("Snapshot Test");
    expect(entry.questions).toHaveLength(1);
    expect(entry.questions[0].questionText).toBe("Test question");
    expect(entry.questions[0].rubric).toHaveLength(2);
    expect(entry.questions[0].responses).toHaveLength(5);
    expect(entry.questions[0].analysis).toBeTruthy();
    expect(entry.questions[0].status).toBe("analyzed");
  });

  it("uses 'Untitled Assessment' when name is empty", () => {
    const assessment: AssessmentState = {
      name: "",
      questions: [{
        id: "q-1",
        questionText: "",
        rubric: [{ name: "", description: "", maxMarks: 2 }, { name: "", description: "", maxMarks: 2 }],
        responseTab: "paste",
        pasteText: "",
        csvRows: null,
        csvName: "",
        status: "draft",
        analysis: null,
        error: null,
        expanded: true,
        analyzedInputHash: null,
      }],
      analyzeAllInProgress: false,
      demoFlag: false,
    };
    const entry = buildHistoryEntry(assessment);
    expect(entry.assessmentName).toBe("Untitled Assessment");
  });

  it("snapshot is independent of source assessment state", () => {
    const assessment: AssessmentState = {
      name: "Independence Test",
      questions: [{
        id: "q-1",
        questionText: "Original",
        rubric: [{ name: "C1", description: "", maxMarks: 2 }, { name: "C2", description: "", maxMarks: 3 }],
        responseTab: "paste",
        pasteText: "R1\nR2\nR3\nR4\nR5",
        csvRows: null,
        csvName: "",
        status: "analyzed",
        analysis: null,
        error: null,
        expanded: true,
        analyzedInputHash: null,
      }],
      analyzeAllInProgress: false,
      demoFlag: false,
    };

    const entry = buildHistoryEntry(assessment);

    // Mutate the source
    assessment.questions[0].questionText = "MUTATED";
    assessment.questions[0].rubric[0].name = "MUTATED";

    // Snapshot should be unaffected
    expect(entry.questions[0].questionText).toBe("Original");
    expect(entry.questions[0].rubric[0].name).toBe("C1");
  });
});
