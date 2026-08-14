"use client";

import { useCallback } from "react";
import type { Rubric, StudentResponse } from "@/lib/types";
import { useAssessment } from "@/lib/use-assessment";
import QuestionCard from "./QuestionCard";

/**
 * AssessmentWorkspace — the main assessment view.
 *
 * Replaces the monolithic AppFlow as the assessment orchestrator.
 * Manages a list of QuestionCards with assessment-level controls.
 */
export default function AssessmentWorkspace() {
  const { state, dispatch, analyzeQuestion, analyzeAll } = useAssessment();

  const readyCount = state.questions.filter(
    (q) => q.status === "ready" || q.status === "needs_reanalysis" || q.status === "failed"
  ).length;
  const analyzedCount = state.questions.filter(
    (q) => q.status === "analyzed"
  ).length;
  const totalCount = state.questions.length;

  const loadDemo = useCallback(async () => {
    const res = await fetch("/demo-data.json");
    const d = (await res.json()) as {
      question: string;
      rubric: Rubric[];
      responses: StudentResponse[];
    };
    dispatch({
      type: "LOAD_DEMO",
      question: d.question,
      rubric: d.rubric,
      responses: d.responses,
    });
  }, [dispatch]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Hero */}
      <section className="mb-8 rounded-2xl bg-[#26306A] p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#F5A623]">
          Assess → Diagnose → Recommend → Intervene → Measure
        </p>
        <h1 className="mt-2 max-w-3xl text-2xl font-bold leading-snug md:text-3xl">
          Turn a pile of graded answers into one specific teaching decision.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#C3CAEC] md:text-base">
          Upload a question, its rubric, and student responses. The engine finds the misconception
          behind each answer, maps the class learning gap, and proposes one intervention — which you
          approve, modify, or reject. AI never grades on its own.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={loadDemo}
            className="rounded-xl bg-[#F5A623] px-5 py-2.5 text-sm font-bold text-[#141834] shadow hover:brightness-95"
          >
            ⚡ Load demo data (50 responses)
          </button>
          <a
            href="/how-to-use"
            className="rounded-xl border border-[#5B67A8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3A4A9F]"
          >
            How to use →
          </a>
        </div>
      </section>

      {/* Demo mode notice */}
      {state.demoFlag && (
        <div className="mb-6 rounded-xl border border-[#3A4A9F] bg-[#E9ECF9] px-4 py-3 text-sm font-medium text-[#26306A]">
          Demo mode is on (?demo=1): Analyze will use the cached analysis and skip the live model.
        </div>
      )}

      {/* Assessment header bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D5DAEC] bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <input
            value={state.name}
            onChange={(e) => dispatch({ type: "SET_NAME", name: e.target.value })}
            placeholder="Assessment name (optional)"
            className="w-64 rounded-lg border border-[#D5DAEC] px-3 py-2 text-sm font-medium text-[#141834] placeholder:text-[#B0B5CC] focus:border-[#3A4A9F] focus:outline-none"
            id="assessment-name"
          />
          <span className="text-sm text-[#565C82]">
            {totalCount} question{totalCount !== 1 ? "s" : ""}
            {analyzedCount > 0 && (
              <span className="ml-1 text-[#0E7C71]">
                · {analyzedCount} analyzed
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch({ type: "ADD_QUESTION" })}
            className="rounded-xl border border-[#3A4A9F] px-4 py-2 text-sm font-semibold text-[#3A4A9F] hover:bg-[#E9ECF9]"
            id="add-question-btn"
          >
            + Add Question
          </button>
          <button
            onClick={analyzeAll}
            disabled={readyCount === 0 || state.analyzeAllInProgress}
            className="rounded-xl bg-[#26306A] px-5 py-2 text-sm font-bold text-white shadow hover:bg-[#3A4A9F] disabled:cursor-not-allowed disabled:opacity-50"
            id="analyze-all-btn"
          >
            {state.analyzeAllInProgress
              ? "Analyzing…"
              : `Analyze All${readyCount > 0 ? ` (${readyCount})` : ""}`}
          </button>
        </div>
      </div>

      {/* Question list */}
      <div className="space-y-4">
        {state.questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            questionIndex={i}
            totalQuestions={totalCount}
            dispatch={dispatch}
            onAnalyze={analyzeQuestion}
          />
        ))}
      </div>
    </main>
  );
}
