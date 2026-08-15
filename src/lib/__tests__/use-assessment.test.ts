import { describe, it, expect } from "vitest";
import {
  reducer,
  createInitialState,
  createEmptyQuestion,
  computeStatus,
  computeInputHash,
  getResponses,
  parsePasteText,
  generateId,
} from "../use-assessment";
import type { AssessmentState, QuestionState } from "../assessment-types";
import type { Analysis, Rubric } from "../types";

// ─── Fixtures ──────────────────────────────────────────────────────────────

const rubric: Rubric[] = [
  { name: "Definition", description: "d", maxMarks: 3 },
  { name: "Interpretation", description: "i", maxMarks: 4 },
  { name: "Application", description: "a", maxMarks: 3 },
];

function fiveResponses(): string {
  return "Answer one\nAnswer two\nAnswer three\nAnswer four\nAnswer five";
}

function makeReadyQuestion(overrides: Partial<QuestionState> = {}): QuestionState {
  const q: QuestionState = {
    ...createEmptyQuestion(true),
    questionText: "What is elasticity?",
    rubric: rubric.map((r) => ({ ...r })),
    pasteText: fiveResponses(),
    ...overrides,
  };
  q.status = computeStatus(q);
  return q;
}

function stateWith(questions: QuestionState[]): AssessmentState {
  return { name: "", questions, analyzeAllInProgress: false, demoFlag: false };
}

const mockAnalysis: Analysis = {
  perResponse: [
    { id: "R01", category: "correct", misconception: null, evidence: "e", confidence: 0.9, criterionScores: [1, 1, 1], draftMark: 10 },
  ],
  clusters: [],
  gapMap: [{ criterion: "Definition", masteryPct: 100, level: "good" }],
  recommendation: {
    type: "Targeted revision session",
    durationMin: 15,
    targetDescription: "Students",
    targetIds: [],
    rationale: "Rationale",
    followUp: "Follow-up",
  },
  meta: { model: "test", latencyMs: 100, disclaimer: "Test", source: "live" },
};

// ─── generateId ────────────────────────────────────────────────────────────

describe("generateId", () => {
  it("returns unique IDs", () => {
    const a = generateId();
    const b = generateId();
    expect(a).not.toBe(b);
  });
});

// ─── parsePasteText ────────────────────────────────────────────────────────

describe("parsePasteText", () => {
  it("parses newline-separated text", () => {
    const result = parsePasteText("line 1\nline 2\nline 3");
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("R01");
    expect(result[0].text).toBe("line 1");
  });

  it("parses --- separated text", () => {
    const result = parsePasteText("long answer 1\n---\nlong answer 2");
    expect(result).toHaveLength(2);
  });

  it("filters empty lines", () => {
    const result = parsePasteText("line 1\n\n\nline 2\n");
    expect(result).toHaveLength(2);
  });

  it("returns empty array for empty text", () => {
    expect(parsePasteText("")).toHaveLength(0);
  });
});

// ─── computeStatus ─────────────────────────────────────────────────────────

describe("computeStatus", () => {
  it("returns 'draft' for empty question", () => {
    const q = createEmptyQuestion();
    expect(computeStatus(q)).toBe("draft");
  });

  it("returns 'ready' when question + rubric + responses are valid", () => {
    const q = makeReadyQuestion();
    expect(computeStatus(q)).toBe("ready");
  });

  it("returns 'draft' when responses < 5", () => {
    const q = makeReadyQuestion({ pasteText: "one\ntwo\nthree" });
    expect(computeStatus(q)).toBe("draft");
  });

  it("returns 'draft' when rubric criterion has no name", () => {
    const q = makeReadyQuestion({
      rubric: [
        { name: "", description: "", maxMarks: 2 },
        { name: "B", description: "", maxMarks: 2 },
      ],
    });
    expect(computeStatus(q)).toBe("draft");
  });

  it("returns 'analyzing' when status is 'analyzing'", () => {
    const q = makeReadyQuestion({ status: "analyzing" });
    expect(computeStatus(q)).toBe("analyzing");
  });

  it("returns 'analyzed' when analysis exists and inputs match", () => {
    const q = makeReadyQuestion({ analysis: mockAnalysis });
    q.analyzedInputHash = computeInputHash(q);
    expect(computeStatus(q)).toBe("analyzed");
  });

  it("returns 'needs_reanalysis' when inputs changed after analysis", () => {
    const q = makeReadyQuestion({ analysis: mockAnalysis });
    q.analyzedInputHash = "old-hash";
    expect(computeStatus(q)).toBe("needs_reanalysis");
  });

  it("returns 'failed' when error exists and no analysis", () => {
    const q = makeReadyQuestion({ error: "API failed" });
    expect(computeStatus(q)).toBe("failed");
  });
});

// ─── getResponses ──────────────────────────────────────────────────────────

describe("getResponses", () => {
  it("returns parsed paste text when tab is paste", () => {
    const q = makeReadyQuestion({ responseTab: "paste", pasteText: "a\nb\nc\nd\ne" });
    expect(getResponses(q)).toHaveLength(5);
  });

  it("returns CSV rows when tab is csv", () => {
    const csvRows = [{ id: "R01", text: "a" }, { id: "R02", text: "b" }];
    const q = makeReadyQuestion({ responseTab: "csv", csvRows });
    expect(getResponses(q)).toEqual(csvRows);
  });
});

// ─── Reducer: ADD_QUESTION ─────────────────────────────────────────────────

describe("reducer — ADD_QUESTION", () => {
  it("adds a new question at the end", () => {
    const state = createInitialState();
    const next = reducer(state, { type: "ADD_QUESTION" });
    expect(next.questions).toHaveLength(2);
  });

  it("expands the new question and collapses others", () => {
    const state = createInitialState();
    const next = reducer(state, { type: "ADD_QUESTION" });
    expect(next.questions[0].expanded).toBe(false);
    expect(next.questions[1].expanded).toBe(true);
  });

  it("can add multiple questions", () => {
    let state = createInitialState();
    state = reducer(state, { type: "ADD_QUESTION" });
    state = reducer(state, { type: "ADD_QUESTION" });
    state = reducer(state, { type: "ADD_QUESTION" });
    expect(state.questions).toHaveLength(4);
  });
});

// ─── Reducer: DELETE_QUESTION ──────────────────────────────────────────────

describe("reducer — DELETE_QUESTION", () => {
  it("removes the specified question", () => {
    const q1 = makeReadyQuestion();
    const q2 = makeReadyQuestion();
    const state = stateWith([q1, q2]);
    const next = reducer(state, { type: "DELETE_QUESTION", questionId: q1.id });
    expect(next.questions).toHaveLength(1);
    expect(next.questions[0].id).toBe(q2.id);
  });

  it("cannot delete the last question", () => {
    const state = createInitialState();
    expect(state.questions).toHaveLength(1);
    const next = reducer(state, {
      type: "DELETE_QUESTION",
      questionId: state.questions[0].id,
    });
    expect(next.questions).toHaveLength(1);
  });

  it("ignores non-existent question ID", () => {
    const state = createInitialState();
    const next = reducer(state, { type: "DELETE_QUESTION", questionId: "nonexistent" });
    expect(next.questions).toHaveLength(1);
  });
});

// ─── Reducer: DUPLICATE_QUESTION ───────────────────────────────────────────

describe("reducer — DUPLICATE_QUESTION", () => {
  it("duplicates question text and rubric", () => {
    const q = makeReadyQuestion();
    const state = stateWith([q]);
    const next = reducer(state, { type: "DUPLICATE_QUESTION", questionId: q.id });
    expect(next.questions).toHaveLength(2);
    expect(next.questions[1].questionText).toBe(q.questionText);
    expect(next.questions[1].rubric).toEqual(q.rubric);
  });

  it("duplicates responses", () => {
    const q = makeReadyQuestion();
    const state = stateWith([q]);
    const next = reducer(state, { type: "DUPLICATE_QUESTION", questionId: q.id });
    expect(next.questions[1].pasteText).toBe(q.pasteText);
  });

  it("does NOT duplicate analysis", () => {
    const q = makeReadyQuestion({ analysis: mockAnalysis });
    q.analyzedInputHash = computeInputHash(q);
    const state = stateWith([q]);
    const next = reducer(state, { type: "DUPLICATE_QUESTION", questionId: q.id });
    expect(next.questions[1].analysis).toBeNull();
  });

  it("assigns a new unique ID", () => {
    const q = makeReadyQuestion();
    const state = stateWith([q]);
    const next = reducer(state, { type: "DUPLICATE_QUESTION", questionId: q.id });
    expect(next.questions[1].id).not.toBe(q.id);
  });

  it("inserts duplicate right after the source", () => {
    const q1 = makeReadyQuestion();
    const q2 = makeReadyQuestion();
    const state = stateWith([q1, q2]);
    const next = reducer(state, { type: "DUPLICATE_QUESTION", questionId: q1.id });
    expect(next.questions).toHaveLength(3);
    expect(next.questions[0].id).toBe(q1.id);
    expect(next.questions[1].questionText).toBe(q1.questionText);
    expect(next.questions[2].id).toBe(q2.id);
  });
});

// ─── Reducer: RESET_QUESTION ───────────────────────────────────────────────

describe("reducer — RESET_QUESTION", () => {
  it("clears question text, rubric, responses, and analysis", () => {
    const q = makeReadyQuestion({ analysis: mockAnalysis });
    const state = stateWith([q]);
    const next = reducer(state, { type: "RESET_QUESTION", questionId: q.id });
    const reset = next.questions[0];
    expect(reset.questionText).toBe("");
    expect(reset.rubric.every((r) => r.name === "")).toBe(true);
    expect(reset.pasteText).toBe("");
    expect(reset.analysis).toBeNull();
  });

  it("preserves the question ID", () => {
    const q = makeReadyQuestion();
    const state = stateWith([q]);
    const next = reducer(state, { type: "RESET_QUESTION", questionId: q.id });
    expect(next.questions[0].id).toBe(q.id);
  });
});

// ─── Reducer: CLEAR_RUBRIC ─────────────────────────────────────────────────

describe("reducer — CLEAR_RUBRIC", () => {
  it("resets rubric to defaults", () => {
    const q = makeReadyQuestion();
    const state = stateWith([q]);
    const next = reducer(state, { type: "CLEAR_RUBRIC", questionId: q.id });
    expect(next.questions[0].rubric.every((r) => r.name === "")).toBe(true);
  });

  it("preserves responses when clearing rubric", () => {
    const q = makeReadyQuestion();
    const state = stateWith([q]);
    const next = reducer(state, { type: "CLEAR_RUBRIC", questionId: q.id });
    expect(next.questions[0].pasteText).toBe(q.pasteText);
  });

  it("preserves question text when clearing rubric", () => {
    const q = makeReadyQuestion();
    const state = stateWith([q]);
    const next = reducer(state, { type: "CLEAR_RUBRIC", questionId: q.id });
    expect(next.questions[0].questionText).toBe(q.questionText);
  });
});

// ─── Reducer: CLEAR_RESPONSES ──────────────────────────────────────────────

describe("reducer — CLEAR_RESPONSES", () => {
  it("clears paste text and csv data", () => {
    const q = makeReadyQuestion();
    const state = stateWith([q]);
    const next = reducer(state, { type: "CLEAR_RESPONSES", questionId: q.id });
    expect(next.questions[0].pasteText).toBe("");
    expect(next.questions[0].csvRows).toBeNull();
    expect(next.questions[0].csvName).toBe("");
  });

  it("preserves rubric when clearing responses", () => {
    const q = makeReadyQuestion();
    const state = stateWith([q]);
    const next = reducer(state, { type: "CLEAR_RESPONSES", questionId: q.id });
    expect(next.questions[0].rubric).toEqual(q.rubric);
  });

  it("preserves question text when clearing responses", () => {
    const q = makeReadyQuestion();
    const state = stateWith([q]);
    const next = reducer(state, { type: "CLEAR_RESPONSES", questionId: q.id });
    expect(next.questions[0].questionText).toBe(q.questionText);
  });
});

// ─── Reducer: editing after analysis → needs_reanalysis ────────────────────

describe("reducer — staleness detection", () => {
  function analyzedState(): { state: AssessmentState; qId: string } {
    const q = makeReadyQuestion({ analysis: mockAnalysis });
    q.analyzedInputHash = computeInputHash(q);
    q.status = computeStatus(q);
    expect(q.status).toBe("analyzed"); // precondition
    return { state: stateWith([q]), qId: q.id };
  }

  it("editing question text marks for re-analysis", () => {
    const { state, qId } = analyzedState();
    const next = reducer(state, {
      type: "SET_QUESTION_TEXT",
      questionId: qId,
      text: "Changed question",
    });
    expect(next.questions[0].status).toBe("needs_reanalysis");
  });

  it("editing rubric marks for re-analysis", () => {
    const { state, qId } = analyzedState();
    const newRubric = [
      { name: "Changed", description: "d", maxMarks: 5 },
      { name: "Also changed", description: "i", maxMarks: 2 },
    ];
    const next = reducer(state, {
      type: "SET_RUBRIC",
      questionId: qId,
      rubric: newRubric,
    });
    expect(next.questions[0].status).toBe("needs_reanalysis");
  });

  it("editing responses marks for re-analysis", () => {
    const { state, qId } = analyzedState();
    const next = reducer(state, {
      type: "SET_PASTE_TEXT",
      questionId: qId,
      text: "new response 1\nnew 2\nnew 3\nnew 4\nnew 5",
    });
    expect(next.questions[0].status).toBe("needs_reanalysis");
  });

  it("analysis preserved in state for history even when stale (hidden from UI)", () => {
    const { state, qId } = analyzedState();
    const next = reducer(state, {
      type: "SET_QUESTION_TEXT",
      questionId: qId,
      text: "Changed",
    });
    // Analysis object kept in state for History page, but UI hides it
    expect(next.questions[0].analysis).not.toBeNull();
    expect(next.questions[0].status).toBe("needs_reanalysis");
  });
});

// ─── Reducer: TOGGLE_EXPANDED / EXPAND_QUESTION ───────────────────────────

describe("reducer — accordion behaviour", () => {
  it("TOGGLE_EXPANDED toggles the expanded state", () => {
    const state = createInitialState();
    const qId = state.questions[0].id;
    expect(state.questions[0].expanded).toBe(true);
    const next = reducer(state, { type: "TOGGLE_EXPANDED", questionId: qId });
    expect(next.questions[0].expanded).toBe(false);
  });

  it("EXPAND_QUESTION expands one and collapses others", () => {
    const q1 = makeReadyQuestion({ expanded: false });
    const q2 = makeReadyQuestion({ expanded: true });
    const state = stateWith([q1, q2]);
    const next = reducer(state, { type: "EXPAND_QUESTION", questionId: q1.id });
    expect(next.questions[0].expanded).toBe(true);
    expect(next.questions[1].expanded).toBe(false);
  });

  it("COLLAPSE_ALL collapses all questions", () => {
    const q1 = makeReadyQuestion({ expanded: true });
    const q2 = makeReadyQuestion({ expanded: true });
    const state = stateWith([q1, q2]);
    const next = reducer(state, { type: "COLLAPSE_ALL" });
    expect(next.questions.every((q) => !q.expanded)).toBe(true);
  });
});

// ─── Reducer: START/COMPLETE/FAIL_ANALYSIS ─────────────────────────────────

describe("reducer — analysis lifecycle", () => {
  it("START_ANALYSIS sets status to analyzing", () => {
    const q = makeReadyQuestion();
    const state = stateWith([q]);
    const next = reducer(state, { type: "START_ANALYSIS", questionId: q.id });
    expect(next.questions[0].status).toBe("analyzing");
  });

  it("START_ANALYSIS clears previous error", () => {
    const q = makeReadyQuestion({ error: "old error" });
    const state = stateWith([q]);
    const next = reducer(state, { type: "START_ANALYSIS", questionId: q.id });
    expect(next.questions[0].error).toBeNull();
  });

  it("COMPLETE_ANALYSIS stores analysis and sets analyzed status", () => {
    const q = makeReadyQuestion({ status: "analyzing" });
    const state = stateWith([q]);
    const next = reducer(state, {
      type: "COMPLETE_ANALYSIS",
      questionId: q.id,
      analysis: mockAnalysis,
    });
    expect(next.questions[0].analysis).toBe(mockAnalysis);
    expect(next.questions[0].status).toBe("analyzed");
    expect(next.questions[0].analyzedInputHash).not.toBeNull();
  });

  it("FAIL_ANALYSIS stores error and sets failed status", () => {
    const q = makeReadyQuestion({ status: "analyzing" });
    const state = stateWith([q]);
    const next = reducer(state, {
      type: "FAIL_ANALYSIS",
      questionId: q.id,
      error: "API error",
    });
    expect(next.questions[0].error).toBe("API error");
    expect(next.questions[0].status).toBe("failed");
  });

  it("one question's analysis does not affect another", () => {
    const q1 = makeReadyQuestion();
    const q2 = makeReadyQuestion();
    const state = stateWith([q1, q2]);

    const next = reducer(state, {
      type: "COMPLETE_ANALYSIS",
      questionId: q1.id,
      analysis: mockAnalysis,
    });
    expect(next.questions[0].analysis).toBe(mockAnalysis);
    expect(next.questions[1].analysis).toBeNull();
  });
});

// ─── Reducer: SET_ANALYZE_ALL ──────────────────────────────────────────────

describe("reducer — Analyze All", () => {
  it("SET_ANALYZE_ALL toggles the flag", () => {
    const state = createInitialState();
    expect(state.analyzeAllInProgress).toBe(false);
    const next = reducer(state, { type: "SET_ANALYZE_ALL", inProgress: true });
    expect(next.analyzeAllInProgress).toBe(true);
  });
});

// ─── Reducer: LOAD_DEMO ───────────────────────────────────────────────────

describe("reducer — LOAD_DEMO", () => {
  it("loads demo data into the first question", () => {
    const state = createInitialState();
    const next = reducer(state, {
      type: "LOAD_DEMO",
      question: "Demo question",
      rubric,
      responses: [
        { id: "R01", text: "a" },
        { id: "R02", text: "b" },
      ],
    });
    expect(next.questions[0].questionText).toBe("Demo question");
    expect(next.questions[0].rubric).toEqual(rubric);
    expect(next.questions[0].pasteText).toBe("a\nb");
  });
});

// ─── Reducer: SET_NAME ─────────────────────────────────────────────────────

describe("reducer — SET_NAME", () => {
  it("sets the assessment name", () => {
    const state = createInitialState();
    const next = reducer(state, { type: "SET_NAME", name: "My Assessment" });
    expect(next.name).toBe("My Assessment");
  });
});

// ─── computeInputHash ──────────────────────────────────────────────────────

describe("computeInputHash", () => {
  it("produces same hash for same inputs", () => {
    const q1 = makeReadyQuestion();
    const q2 = makeReadyQuestion();
    q2.questionText = q1.questionText;
    q2.rubric = q1.rubric.map((r) => ({ ...r }));
    q2.pasteText = q1.pasteText;
    expect(computeInputHash(q1)).toBe(computeInputHash(q2));
  });

  it("produces different hash when question text changes", () => {
    const q1 = makeReadyQuestion();
    const q2 = makeReadyQuestion();
    q2.questionText = "Different question";
    expect(computeInputHash(q1)).not.toBe(computeInputHash(q2));
  });
});

// ─── Integration: question lifecycle ───────────────────────────────────────

describe("integration — full question lifecycle", () => {
  it("add → fill → analyze → edit → needs_reanalysis", () => {
    let state = createInitialState();
    const qId = state.questions[0].id;

    // Fill question
    state = reducer(state, {
      type: "SET_QUESTION_TEXT",
      questionId: qId,
      text: "What is GDP?",
    });
    state = reducer(state, {
      type: "SET_RUBRIC",
      questionId: qId,
      rubric,
    });
    state = reducer(state, {
      type: "SET_PASTE_TEXT",
      questionId: qId,
      text: fiveResponses(),
    });
    expect(state.questions[0].status).toBe("ready");

    // Analyze
    state = reducer(state, { type: "START_ANALYSIS", questionId: qId });
    expect(state.questions[0].status).toBe("analyzing");

    state = reducer(state, {
      type: "COMPLETE_ANALYSIS",
      questionId: qId,
      analysis: mockAnalysis,
    });
    expect(state.questions[0].status).toBe("analyzed");

    // Edit → stale
    state = reducer(state, {
      type: "SET_QUESTION_TEXT",
      questionId: qId,
      text: "What is GNP?",
    });
    expect(state.questions[0].status).toBe("needs_reanalysis");
    expect(state.questions[0].analysis).not.toBeNull(); // preserved
  });
});
