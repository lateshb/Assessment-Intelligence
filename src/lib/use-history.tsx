"use client";

/**
 * Analysis History state management — reducer + context.
 *
 * Stores history entries in local React state.
 * Persistence can later be swapped to Supabase without changing consumers.
 */

import { createContext, useContext, useReducer, useCallback, type ReactNode } from "react";
import type { HistoryEntry, HistoryAction, HistoryQuestion } from "./history-types";
import type { AssessmentState } from "./assessment-types";
import { getResponses } from "./use-assessment";

// ─── Helpers ───────────────────────────────────────────────────────────────

let idCounter = 0;
function generateHistoryId(): string {
  return `hist-${Date.now()}-${++idCounter}`;
}

function now(): string {
  return new Date().toISOString();
}

// ─── Reducer ───────────────────────────────────────────────────────────────

export function historyReducer(
  state: HistoryEntry[],
  action: HistoryAction
): HistoryEntry[] {
  switch (action.type) {
    case "SAVE_ENTRY": {
      const existing = state.find(
        (e) => !e.trashed && e.assessmentName === action.entry.assessmentName
          && action.entry.assessmentName !== ""
      );
      if (existing) {
        // Update existing entry for the same named assessment
        return state.map((e) =>
          e.id === existing.id
            ? { ...e, ...action.entry, savedAt: now() }
            : e
        );
      }
      const newEntry: HistoryEntry = {
        ...action.entry,
        id: generateHistoryId(),
        savedAt: now(),
        trashed: false,
      };
      return [newEntry, ...state];
    }

    case "DELETE_ENTRY":
      return state.map((e) =>
        e.id === action.id ? { ...e, trashed: true } : e
      );

    case "RESTORE_ENTRY":
      return state.map((e) =>
        e.id === action.id ? { ...e, trashed: false } : e
      );

    case "PERMANENT_DELETE":
      return state.filter((e) => e.id !== action.id);

    case "CLEAR_TRASH":
      return state.filter((e) => !e.trashed);

    default:
      return state;
  }
}

// ─── Snapshot builder ──────────────────────────────────────────────────────

export function buildHistoryEntry(assessment: AssessmentState): Omit<HistoryEntry, "id" | "savedAt" | "trashed"> {
  const questions: HistoryQuestion[] = assessment.questions.map((q) => {
    const responses = getResponses(q);
    return {
      id: q.id,
      questionText: q.questionText,
      rubric: q.rubric.map((r) => ({ ...r })),
      responses: responses.map((r) => ({ ...r })),
      analysis: q.analysis ? { ...q.analysis } : null,
      status: q.analysis ? "analyzed" as const
        : q.status === "failed" ? "failed" as const
        : "draft" as const,
    };
  });

  return {
    assessmentName: assessment.name || "Untitled Assessment",
    course: "",
    questions,
  };
}

// ─── Context ───────────────────────────────────────────────────────────────

type HistoryContextType = {
  entries: HistoryEntry[];
  dispatch: React.Dispatch<HistoryAction>;
  saveAssessment: (assessment: AssessmentState) => void;
};

const HistoryContext = createContext<HistoryContextType | null>(null);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [entries, dispatch] = useReducer(historyReducer, []);

  const saveAssessment = useCallback(
    (assessment: AssessmentState) => {
      const hasAnalysis = assessment.questions.some((q) => q.analysis !== null);
      if (!hasAnalysis) return; // Don't save if nothing was analyzed
      dispatch({ type: "SAVE_ENTRY", entry: buildHistoryEntry(assessment) });
    },
    [dispatch]
  );

  return (
    <HistoryContext.Provider value={{ entries, dispatch, saveAssessment }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("useHistory must be used within a HistoryProvider");
  return ctx;
}
