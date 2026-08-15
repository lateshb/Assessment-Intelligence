"use client";

/**
 * AssessmentContext — the SINGLE source of truth for assessment state.
 *
 * All components must use useAssessment() from this module (or the
 * re-export in use-assessment.ts) to access shared assessment state.
 * This prevents the isolated-reducer bug where each component got
 * its own independent state.
 */

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  reducer,
  createInitialState,
  getResponses,
} from "./use-assessment";
import type { AssessmentState, AssessmentAction } from "./assessment-types";
import type { Analysis } from "./types";

type AssessmentContextValue = {
  state: AssessmentState;
  dispatch: React.Dispatch<AssessmentAction>;
  analyzeQuestion: (questionId: string) => Promise<void>;
  analyzeAll: () => Promise<void>;
};

const AssessmentContext = createContext<AssessmentContextValue | null>(null);

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, createInitialState);

  // Check for ?demo=1 on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const flag =
        new URLSearchParams(window.location.search).get("demo") === "1";
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
        dispatch({
          type: "FAIL_ANALYSIS",
          questionId,
          error: "Please enter the question.",
        });
        return;
      }
      if (q.rubric.some((r) => !r.name.trim())) {
        dispatch({
          type: "FAIL_ANALYSIS",
          questionId,
          error: "Every rubric criterion needs a name.",
        });
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
          dispatch({
            type: "COMPLETE_ANALYSIS",
            questionId,
            analysis: cached,
          });
        } catch {
          dispatch({
            type: "FAIL_ANALYSIS",
            questionId,
            error: "Failed to load demo results.",
          });
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
            dispatch({
              type: "COMPLETE_ANALYSIS",
              questionId,
              analysis: cached,
            });
          } else {
            dispatch({
              type: "FAIL_ANALYSIS",
              questionId,
              error: data?.error ?? "Analysis failed.",
            });
          }
          return;
        }
        dispatch({
          type: "COMPLETE_ANALYSIS",
          questionId,
          analysis: data as Analysis,
        });
      } catch {
        // Network error — fall back to cached
        try {
          const fallback = await fetch("/demo-results.json");
          const cached = (await fallback.json()) as Analysis;
          dispatch({
            type: "COMPLETE_ANALYSIS",
            questionId,
            analysis: cached,
          });
        } catch {
          dispatch({
            type: "FAIL_ANALYSIS",
            questionId,
            error: "Analysis failed. Please try again.",
          });
        }
      }
    },
    [state.questions, state.demoFlag]
  );

  const analyzeAll = useCallback(async () => {
    if (state.analyzeAllInProgress) return; // Prevent duplicate

    const readyQuestions = state.questions.filter(
      (q) =>
        q.status === "ready" ||
        q.status === "needs_reanalysis" ||
        q.status === "failed"
    );
    if (readyQuestions.length === 0) return;

    dispatch({ type: "SET_ANALYZE_ALL", inProgress: true });

    // Process each independently — one failure doesn't stop others
    await Promise.allSettled(
      readyQuestions.map((q) => analyzeQuestion(q.id))
    );

    dispatch({ type: "SET_ANALYZE_ALL", inProgress: false });
  }, [state.questions, state.analyzeAllInProgress, analyzeQuestion]);

  return (
    <AssessmentContext.Provider
      value={{ state, dispatch, analyzeQuestion, analyzeAll }}
    >
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment(): AssessmentContextValue {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error("useAssessment must be used within AssessmentProvider");
  }
  return context;
}
