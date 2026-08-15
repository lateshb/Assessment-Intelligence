"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import type { Rubric, StudentResponse } from "@/lib/types";
import { useAssessment } from "@/lib/use-assessment";
import { useHistory } from "@/lib/use-history";
import { createClient } from "@/lib/supabase/client";
import { saveAssessmentToDb } from "@/lib/assessment-db";
import QuestionCard from "./QuestionCard";

/**
 * AssessmentWorkspace — the main assessment view.
 *
 * Replaces the monolithic AppFlow as the assessment orchestrator.
 * Manages a list of QuestionCards with assessment-level controls.
 */
export default function AssessmentWorkspace() {
  const { state, dispatch, analyzeQuestion, analyzeAll } = useAssessment();
  const { saveAssessment } = useHistory();
  const [userId, setUserId] = useState<string | null>(null);
  const [institutionId, setInstitutionId] = useState<string | null>(null);

  // Get user ID and institution ID
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        // Fetch profile to get institution_id
        supabase
          .from('profiles')
          .select('institution_id')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data) setInstitutionId(data.institution_id);
          });
      }
    });
  }, []);

  // Track previous state to detect when analysis completes
  const prevStateRef = useRef(state);

  // Save to history when analysis completes
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;

    // Check if any question just got analysis (reference changed)
    // Compare by dbId if available, otherwise by index
    const newlyAnalyzed = state.questions.some((q) => {
      const prevQ = q.dbId 
        ? prev.questions.find(pq => pq.dbId === q.dbId)
        : prev.questions[state.questions.indexOf(q)];
      return q.analysis && (!prevQ || prevQ.analysis !== q.analysis);
    });

    if (newlyAnalyzed) {
      saveAssessment(state);
    }
  }, [state, saveAssessment]);

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

  const handleSaveDraft = useCallback(async () => {
    if (!userId) {
      alert('Not authenticated');
      return;
    }

    dispatch({ type: "START_SAVE" });

    try {
      const result = await saveAssessmentToDb(state, userId, institutionId);
      dispatch({
        type: "COMPLETE_SAVE",
        assessmentId: result.id,
        questionIds: result.questionIds,
        analysisIds: result.analysisIds,
      });
    } catch (error: any) {
      dispatch({ type: "FAIL_SAVE", error: error.message });
      alert('Save failed: ' + error.message);
    }
  }, [state, userId, institutionId, dispatch]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      {/* Hero */}
      <section className="mb-6 sm:mb-8 rounded-2xl bg-gradient-to-br from-[#1E2656] to-[#26306A] p-6 text-white shadow-md md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#F5A623] backdrop-blur-sm">
          <span>Assess</span>
          <span className="opacity-60">→</span>
          <span>Diagnose</span>
          <span className="opacity-60">→</span>
          <span>Recommend</span>
          <span className="opacity-60">→</span>
          <span>Decide</span>
        </div>
        <h1 className="mt-3 max-w-3xl text-2xl font-bold leading-tight md:text-3xl text-white">
          Turn a pile of graded answers into one specific teaching decision.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#C3CAEC] md:text-base">
          Upload a question, its rubric, and student responses. The engine finds the misconception
          behind each answer, maps the class learning gap, and proposes one intervention — which you
          approve, modify, or reject. AI never grades on its own.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={loadDemo}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#F5A623] px-5 py-2.5 text-sm font-bold text-[#141834] shadow hover:brightness-95 transition-all"
            id="load-demo-btn"
          >
            <span>⚡</span>
            <span>Load demo data (50 responses)</span>
          </button>
          <a
            href="/how-to-use"
            className="inline-flex items-center gap-1 rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15 transition-all"
          >
            <span>How to use</span>
            <span>→</span>
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
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#D5DAEC] bg-white p-4 sm:p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <input
            value={state.name}
            onChange={(e) => dispatch({ type: "SET_NAME", name: e.target.value })}
            placeholder="Assessment name (optional)"
            className="min-w-[200px] flex-1 max-w-md rounded-xl border border-[#D5DAEC] px-3.5 py-2 text-sm font-medium text-[#141834] placeholder:text-[#B0B5CC] focus:border-[#3A4A9F] focus:outline-none transition-colors"
            id="assessment-name"
          />
          <div className="flex items-center gap-2 text-xs font-semibold text-[#565C82]">
            <span className="rounded-md bg-[#EDEFF6] px-2 py-1">
              {totalCount} question{totalCount !== 1 ? "s" : ""}
            </span>
            {analyzedCount > 0 && (
              <span className="rounded-md bg-[#E4F5F3] px-2 py-1 text-[#0E7C71]">
                ✓ {analyzedCount} analyzed
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => dispatch({ type: "ADD_QUESTION" })}
            className="rounded-xl border border-[#3A4A9F] px-4 py-2 text-sm font-semibold text-[#3A4A9F] hover:bg-[#E9ECF9] transition-all"
            id="add-question-btn"
          >
            + Add Question
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={state.saveInProgress || !userId}
            className="rounded-xl border border-[#0E7C71] px-4 py-2 text-sm font-semibold text-[#0E7C71] hover:bg-[#E6F7F5] disabled:cursor-not-allowed disabled:opacity-50 transition-all"
          >
            {state.saveInProgress ? "Saving…" : "Save Draft"}
          </button>
          <button
            onClick={analyzeAll}
            disabled={readyCount === 0 || state.analyzeAllInProgress}
            className="rounded-xl bg-[#26306A] px-5 py-2 text-sm font-bold text-white shadow hover:bg-[#3A4A9F] disabled:cursor-not-allowed disabled:opacity-50 transition-all"
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
