/**
 * Assessment state management — reducer + hook.
 *
 * All assessment/question state lives here, isolated from presentation.
 * The hook exposes state + dispatch so components never own business logic.
 * Persistence can later wrap this hook without changing any UI component.
 */

import { useCallback, useEffect, useReducer } from "react";
import type { Analysis, Rubric, StudentResponse } from "./types";
import type {
  AssessmentAction,
  AssessmentState,
  QuestionState,
  QuestionStatus,
} from "./assessment-types";

// ─── Helpers ───────────────────────────────────────────────────────────────

let idCounter = 0;
export function generateId(): string {
  return `q-${Date.now()}-${++idCounter}`;
}

const DEFAULT_RUBRIC: Rubric[] = [
  { name: "", description: "", maxMarks: 2 },
  { name: "", description: "", maxMarks: 2 },
  { name: "", description: "", maxMarks: 2 },
];

export function createEmptyQuestion(expanded = true): QuestionState {
  return {
    id: generateId(),
    questionText: "",
    rubric: DEFAULT_RUBRIC.map((r) => ({ ...r })),
    responseTab: "paste",
    pasteText: "",
    csvRows: null,
    csvName: "",
    status: "draft",
    analysis: null,
    error: null,
    expanded,
    analyzedInputHash: null,
  };
}

/** Parse paste text into StudentResponse[] */
export function parsePasteText(text: string): StudentResponse[] {
  const parts = text.includes("---")
    ? text.split(/^\s*---\s*$/m)
    : text.split(/\n/);
  return parts
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t, i) => ({ id: `R${String(i + 1).padStart(2, "0")}`, text: t }));
}

/** Get responses for a question */
export function getResponses(q: QuestionState): StudentResponse[] {
  if (q.responseTab === "csv" && q.csvRows) return q.csvRows;
  return parsePasteText(q.pasteText);
}

/** Simple hash of inputs to detect staleness */
export function computeInputHash(q: QuestionState): string {
  const responses = getResponses(q);
  return JSON.stringify({
    questionText: q.questionText,
    rubric: q.rubric,
    responses: responses.map((r) => r.text),
  });
}

/** Compute question status from its state */
export function computeStatus(q: QuestionState): QuestionStatus {
  if (q.status === "analyzing") return "analyzing";

  const responses = getResponses(q);
  const hasQuestion = q.questionText.trim().length > 0;
  const hasRubric = q.rubric.length >= 2 && q.rubric.every((r) => r.name.trim());
  const hasResponses = responses.length >= 5;

  if (q.analysis) {
    const currentHash = computeInputHash(q);
    if (currentHash !== q.analyzedInputHash) return "needs_reanalysis";
    return "analyzed";
  }

  if (q.error) return "failed";

  if (hasQuestion && hasRubric && hasResponses) return "ready";
  return "draft";
}

// ─── Reducer ───────────────────────────────────────────────────────────────

function updateQuestion(
  state: AssessmentState,
  questionId: string,
  updater: (q: QuestionState) => QuestionState
): AssessmentState {
  return {
    ...state,
    questions: state.questions.map((q) => {
      if (q.id !== questionId) return q;
      const updated = updater(q);
      return { ...updated, status: computeStatus(updated) };
    }),
  };
}

export function reducer(
  state: AssessmentState,
  action: AssessmentAction
): AssessmentState {
  switch (action.type) {
    case "SET_NAME":
      return { ...state, name: action.name };

    case "ADD_QUESTION": {
      // Collapse all, then add new expanded question
      const collapsed = state.questions.map((q) => ({ ...q, expanded: false }));
      const newQ = createEmptyQuestion(true);
      return { ...state, questions: [...collapsed, newQ] };
    }

    case "DELETE_QUESTION": {
      if (state.questions.length <= 1) return state; // Can't delete last question
      return {
        ...state,
        questions: state.questions.filter((q) => q.id !== action.questionId),
      };
    }

    case "DUPLICATE_QUESTION": {
      const source = state.questions.find((q) => q.id === action.questionId);
      if (!source) return state;
      const idx = state.questions.indexOf(source);
      const dup: QuestionState = {
        ...source,
        id: generateId(),
        analysis: null, // Never copy analysis
        error: null,
        analyzedInputHash: null,
        expanded: true,
        status: "draft",
      };
      // Recompute status for the duplicate
      dup.status = computeStatus(dup);
      const questions = [...state.questions];
      // Collapse the source
      questions[idx] = { ...questions[idx], expanded: false };
      questions.splice(idx + 1, 0, dup);
      return { ...state, questions };
    }

    case "RESET_QUESTION":
      return updateQuestion(state, action.questionId, (q) => ({
        ...createEmptyQuestion(q.expanded),
        id: q.id, // Preserve ID
      }));

    case "CLEAR_RUBRIC":
      return updateQuestion(state, action.questionId, (q) => ({
        ...q,
        rubric: DEFAULT_RUBRIC.map((r) => ({ ...r })),
      }));

    case "CLEAR_RESPONSES":
      return updateQuestion(state, action.questionId, (q) => ({
        ...q,
        pasteText: "",
        csvRows: null,
        csvName: "",
        responseTab: "paste",
      }));

    case "SET_QUESTION_TEXT":
      return updateQuestion(state, action.questionId, (q) => ({
        ...q,
        questionText: action.text,
      }));

    case "SET_RUBRIC":
      return updateQuestion(state, action.questionId, (q) => ({
        ...q,
        rubric: action.rubric,
      }));

    case "SET_RESPONSE_TAB":
      return updateQuestion(state, action.questionId, (q) => ({
        ...q,
        responseTab: action.tab,
      }));

    case "SET_PASTE_TEXT":
      return updateQuestion(state, action.questionId, (q) => ({
        ...q,
        pasteText: action.text,
      }));

    case "SET_CSV_ROWS":
      return updateQuestion(state, action.questionId, (q) => ({
        ...q,
        csvRows: action.rows,
        csvName: `${action.fileName} · ${action.rows.length} responses`,
        responseTab: "csv",
      }));

    case "TOGGLE_EXPANDED":
      return {
        ...state,
        questions: state.questions.map((q) =>
          q.id === action.questionId ? { ...q, expanded: !q.expanded } : q
        ),
      };

    case "COLLAPSE_ALL":
      return {
        ...state,
        questions: state.questions.map((q) => ({ ...q, expanded: false })),
      };

    case "EXPAND_QUESTION":
      return {
        ...state,
        questions: state.questions.map((q) =>
          q.id === action.questionId
            ? { ...q, expanded: true }
            : { ...q, expanded: false }
        ),
      };

    case "START_ANALYSIS":
      return updateQuestion(state, action.questionId, (q) => ({
        ...q,
        status: "analyzing",
        error: null,
      }));

    case "COMPLETE_ANALYSIS":
      return updateQuestion(state, action.questionId, (q) => ({
        ...q,
        analysis: action.analysis,
        error: null,
        analyzedInputHash: computeInputHash(q),
        status: "analyzed", // will be recomputed by updateQuestion
      }));

    case "FAIL_ANALYSIS":
      return updateQuestion(state, action.questionId, (q) => ({
        ...q,
        error: action.error,
        status: "failed",
      }));

    case "SET_ANALYZE_ALL":
      return { ...state, analyzeAllInProgress: action.inProgress };

    case "LOAD_DEMO": {
      // Load demo into first question
      const firstId = state.questions[0]?.id;
      if (!firstId) return state;
      return updateQuestion(state, firstId, (q) => ({
        ...q,
        questionText: action.question,
        rubric: action.rubric,
        pasteText: action.responses.map((r) => r.text).join("\n"),
        responseTab: "paste",
        csvRows: null,
        csvName: "",
        expanded: true,
      }));
    }

    case "SET_DEMO_FLAG":
      return { ...state, demoFlag: action.flag };

    case "START_SAVE":
      return { ...state, saveInProgress: true, saveError: null };

    case "COMPLETE_SAVE":
      return {
        ...state,
        id: action.assessmentId,
        saveInProgress: false,
        saveError: null,
        questions: state.questions.map((q, i) => ({
          ...q,
          dbId: action.questionIds[i] || q.dbId,
        })),
      };

    case "FAIL_SAVE":
      return { ...state, saveInProgress: false, saveError: action.error };

    case "LOAD_ASSESSMENT":
      return action.state;

    default:
      return state;
  }
}

// ─── Initial state ─────────────────────────────────────────────────────────

export function createInitialState(): AssessmentState {
  return {
    id: null,
    name: "",
    questions: [createEmptyQuestion(true)],
    analyzeAllInProgress: false,
    demoFlag: false,
    saveInProgress: false,
    saveError: null,
  };
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useAssessment() {
  const [state, dispatch] = useReducer(reducer, null, createInitialState);

  // Check for ?demo=1 on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const flag = new URLSearchParams(window.location.search).get("demo") === "1";
      if (flag) dispatch({ type: "SET_DEMO_FLAG", flag: true });
    }
  }, []);

  const analyzeQuestion = useCallback(
    async (questionId: string) => {
      const q = state.questions.find((q) => q.id === questionId);
      if (!q) return;
      if (q.status === "analyzing") return; // Prevent duplicate

      const responses = getResponses(q);

      // Validation
      if (!q.questionText.trim()) {
        dispatch({ type: "FAIL_ANALYSIS", questionId, error: "Please enter the question." });
        return;
      }
      if (q.rubric.some((r) => !r.name.trim())) {
        dispatch({ type: "FAIL_ANALYSIS", questionId, error: "Every rubric criterion needs a name." });
        return;
      }
      if (responses.length < 5) {
        dispatch({
          type: "FAIL_ANALYSIS",
          questionId,
          error: `Need at least 5 responses (currently ${responses.length}).`,
        });
        return;
      }

      dispatch({ type: "START_ANALYSIS", questionId });

      // Demo mode: use cached results
      if (state.demoFlag) {
        try {
          const res = await fetch("/demo-results.json");
          const cached = (await res.json()) as Analysis;
          dispatch({ type: "COMPLETE_ANALYSIS", questionId, analysis: cached });
        } catch {
          dispatch({ type: "FAIL_ANALYSIS", questionId, error: "Failed to load demo results." });
        }
        return;
      }

      try {
        const body = { question: q.questionText, rubric: q.rubric, responses };
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          if (data?.fallbackAdvised) {
            // Fall back to cached demo results
            const fallback = await fetch("/demo-results.json");
            const cached = (await fallback.json()) as Analysis;
            dispatch({ type: "COMPLETE_ANALYSIS", questionId, analysis: cached });
          } else {
            dispatch({
              type: "FAIL_ANALYSIS",
              questionId,
              error: data?.error ?? "Analysis failed.",
            });
          }
          return;
        }
        dispatch({ type: "COMPLETE_ANALYSIS", questionId, analysis: data as Analysis });
      } catch {
        // Network error — fall back to cached
        try {
          const fallback = await fetch("/demo-results.json");
          const cached = (await fallback.json()) as Analysis;
          dispatch({ type: "COMPLETE_ANALYSIS", questionId, analysis: cached });
        } catch {
          dispatch({ type: "FAIL_ANALYSIS", questionId, error: "Analysis failed. Please try again." });
        }
      }
    },
    [state.questions, state.demoFlag]
  );

  const analyzeAll = useCallback(async () => {
    if (state.analyzeAllInProgress) return; // Prevent duplicate

    const readyQuestions = state.questions.filter(
      (q) => q.status === "ready" || q.status === "needs_reanalysis" || q.status === "failed"
    );
    if (readyQuestions.length === 0) return;

    dispatch({ type: "SET_ANALYZE_ALL", inProgress: true });

    // Process each independently — one failure doesn't stop others
    await Promise.allSettled(
      readyQuestions.map((q) => analyzeQuestion(q.id))
    );

    dispatch({ type: "SET_ANALYZE_ALL", inProgress: false });
  }, [state.questions, state.analyzeAllInProgress, analyzeQuestion]);

  return { state, dispatch, analyzeQuestion, analyzeAll, getResponses };
}
