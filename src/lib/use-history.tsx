"use client";

/**
 * Analysis History state management — Supabase-backed.
 *
 * Loads history from assessments/questions/analyses tables on mount.
 * Trash/restore uses the `trashed` column on assessments.
 * Context API stays identical so consumers don't change.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { HistoryEntry, HistoryAction, HistoryQuestion } from "./history-types";
import type { AssessmentState } from "./assessment-types";
import { getResponses } from "./use-assessment";
import { createClient } from "@/lib/supabase/client";

// ─── Snapshot builder (for saving from workspace) ──────────────────────────

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

// ─── DB row → HistoryEntry mapper ──────────────────────────────────────────

async function loadHistoryFromDb(): Promise<HistoryEntry[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Load assessments that have at least one analyzed question
  const { data: assessments, error: aErr } = await supabase
    .from("assessments")
    .select("*")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  if (aErr || !assessments) return [];

  const entries: HistoryEntry[] = [];

  for (const a of assessments) {
    // Load questions
    const { data: questions } = await supabase
      .from("questions")
      .select("*")
      .eq("assessment_id", a.id)
      .order("position", { ascending: true });

    if (!questions || questions.length === 0) continue;

    // Load analyses for each question (current + previous)
    const historyQuestions: HistoryQuestion[] = [];
    let hasAnyAnalysis = false;

    for (const q of questions) {
      const { data: analyses } = await supabase
        .from("analyses")
        .select("*")
        .eq("question_id", q.id)
        .order("created_at", { ascending: false });

      if (!analyses || analyses.length === 0) {
        historyQuestions.push({
          id: q.id,
          questionText: q.question_text || "",
          rubric: (q.rubric_snapshot as Array<{ name: string; description: string; maxMarks: number }>) || [],
          responses: (q.responses as Array<{ id: string; text: string }>) || [],
          analysis: null,
          status: "draft",
        });
        continue;
      }

      hasAnyAnalysis = true;

      // First analysis is the current one (most recent)
      const currentAnalysis = analyses[0];
      const currentAnalysisData = {
        id: currentAnalysis.id,
        perResponse: currentAnalysis.per_response as unknown[],
        clusters: currentAnalysis.clusters as unknown[],
        gapMap: currentAnalysis.gap_map as unknown[],
        recommendation: currentAnalysis.recommendation as Record<string, unknown>,
        meta: {
          model: currentAnalysis.model,
          latencyMs: currentAnalysis.latency_ms || 0,
          disclaimer: "",
          source: currentAnalysis.source as "live" | "cached",
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      // Previous analyses (if any)
      const previousAnalyses = analyses.slice(1).map(a => ({
        id: a.id,
        createdAt: a.created_at,
        questionText: a.question_text_snapshot,
        rubric: (a.rubric_snapshot as Array<{ name: string; description: string; maxMarks: number }>) || [],
        responses: (a.responses_snapshot as Array<{ id: string; text: string }>) || [],
        analysis: {
          id: a.id,
          perResponse: a.per_response as unknown[],
          clusters: a.clusters as unknown[],
          gapMap: a.gap_map as unknown[],
          recommendation: a.recommendation as Record<string, unknown>,
          meta: {
            model: a.model,
            latencyMs: a.latency_ms || 0,
            disclaimer: "",
            source: a.source as "live" | "cached",
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      }));

      historyQuestions.push({
        id: q.id,
        questionText: currentAnalysis.question_text_snapshot || q.question_text || "",
        rubric: (currentAnalysis.rubric_snapshot as Array<{ name: string; description: string; maxMarks: number }>) || [],
        responses: (currentAnalysis.responses_snapshot as Array<{ id: string; text: string }>) || [],
        analysis: currentAnalysisData,
        status: "analyzed",
        previousAnalyses: previousAnalyses.length > 0 ? previousAnalyses : undefined,
      });
    }

    // Only show assessments that have been analyzed at least once
    if (!hasAnyAnalysis) continue;

    entries.push({
      id: a.id,
      assessmentName: a.name || "Untitled Assessment",
      course: "",
      questions: historyQuestions,
      savedAt: a.updated_at || a.created_at,
      trashed: a.trashed ?? false,
    });
  }

  return entries;
}

// ─── Context ───────────────────────────────────────────────────────────────

type HistoryContextType = {
  entries: HistoryEntry[];
  loading: boolean;
  dispatch: (action: HistoryAction) => void;
  saveAssessment: (assessment: AssessmentState) => void;
  reload: () => Promise<void>;
};

const HistoryContext = createContext<HistoryContextType | null>(null);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const data = await loadHistoryFromDb();
    setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // saveAssessment is called after analysis completes — triggers a reload
  const saveAssessment = useCallback(
    (assessment: AssessmentState) => {
      const hasAnalysis = assessment.questions.some((q) => q.analysis !== null);
      if (!hasAnalysis) return;
      // The workspace already saves to DB via saveAssessmentToDb.
      // We just need to reload the history to pick up the new data.
      reload();
    },
    [reload]
  );

  // Async dispatch for trash/restore/permanent delete
  const dispatch = useCallback(
    async (action: HistoryAction) => {
      const supabase = createClient();

      switch (action.type) {
        case "DELETE_ENTRY": {
          // Soft delete — set trashed = true
          const { error } = await supabase
            .from("assessments")
            .update({ trashed: true })
            .eq("id", action.id);
          if (!error) {
            setEntries((prev) =>
              prev.map((e) => (e.id === action.id ? { ...e, trashed: true } : e))
            );
          }
          break;
        }

        case "RESTORE_ENTRY": {
          const { error } = await supabase
            .from("assessments")
            .update({ trashed: false })
            .eq("id", action.id);
          if (!error) {
            setEntries((prev) =>
              prev.map((e) => (e.id === action.id ? { ...e, trashed: false } : e))
            );
          }
          break;
        }

        case "PERMANENT_DELETE": {
          // CASCADE will delete questions → analyses → decisions
          const { error } = await supabase
            .from("assessments")
            .delete()
            .eq("id", action.id);
          if (!error) {
            setEntries((prev) => prev.filter((e) => e.id !== action.id));
          }
          break;
        }

        case "CLEAR_TRASH": {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) break;
          const { error } = await supabase
            .from("assessments")
            .delete()
            .eq("owner_id", user.id)
            .eq("trashed", true);
          if (!error) {
            setEntries((prev) => prev.filter((e) => !e.trashed));
          }
          break;
        }

        case "SAVE_ENTRY": {
          // This is handled by saveAssessment + reload
          await reload();
          break;
        }
      }
    },
    [reload]
  );

  return (
    <HistoryContext.Provider value={{ entries, loading, dispatch, saveAssessment, reload }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("useHistory must be used within a HistoryProvider");
  return ctx;
}

// Export context for test access
export { HistoryContext };
export type { HistoryContextType };
