"use client";

import { useState, useEffect } from "react";
import type { QuestionState, QuestionStatus, AssessmentAction } from "@/lib/assessment-types";
import type { Rubric, StudentResponse } from "@/lib/types";
import { getResponses } from "@/lib/use-assessment";
import { useRubricLibrary } from "@/lib/use-rubric-library";
import Results from "./Results";
import Recommendation from "./Recommendation";
import RubricPicker from "./RubricPicker";
import RubricEditor from "./RubricEditor";
import { SectionTitle } from "./ui";

// ─── Status badge ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<QuestionStatus, { label: string; classes: string }> = {
  draft: { label: "Draft", classes: "bg-[#EDEFF6] text-[#565C82]" },
  ready: { label: "Ready to Analyze", classes: "bg-[#E4F5F3] text-[#0E7C71]" },
  analyzing: { label: "Analyzing…", classes: "bg-[#E9ECF9] text-[#3A4A9F] animate-pulse" },
  analyzed: { label: "Analyzed", classes: "bg-[#E4F5F3] text-[#0E7C71]" },
  needs_reanalysis: { label: "Needs re-analysis", classes: "bg-[#FDF3E1] text-[#B45309]" },
  failed: { label: "Failed", classes: "bg-[#FBE9E3] text-[#B23A1B]" },
};

function StatusBadge({ status }: { status: QuestionStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${config.classes}`}>
      {config.label}
    </span>
  );
}

// ─── Action menu ───────────────────────────────────────────────────────────

function ActionMenu({
  question,
  questionIndex,
  totalQuestions,
  dispatch,
}: {
  question: QuestionState;
  questionIndex: number;
  totalQuestions: number;
  dispatch: React.Dispatch<AssessmentAction>;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  const actions = [
    {
      key: "duplicate",
      label: "Duplicate",
      destructive: false,
      disabled: false,
      action: () => {
        dispatch({ type: "DUPLICATE_QUESTION", questionId: question.id });
        setOpen(false);
      },
    },
    {
      key: "reset",
      label: "Reset question",
      destructive: true,
      disabled: false,
      confirmMsg: "This will clear the question text, rubric, responses, and analysis. Continue?",
      action: () => dispatch({ type: "RESET_QUESTION", questionId: question.id }),
    },
    {
      key: "clear-rubric",
      label: "Clear rubric",
      destructive: !!question.analysis,
      disabled: false,
      confirmMsg: question.analysis
        ? "This will clear the rubric and mark the analysis for re-analysis. Continue?"
        : undefined,
      action: () => dispatch({ type: "CLEAR_RUBRIC", questionId: question.id }),
    },
    {
      key: "clear-responses",
      label: "Clear responses",
      destructive: !!question.analysis,
      disabled: false,
      confirmMsg: question.analysis
        ? "This will clear all responses and mark the analysis for re-analysis. Continue?"
        : undefined,
      action: () => dispatch({ type: "CLEAR_RESPONSES", questionId: question.id }),
    },
    {
      key: "delete",
      label: "Delete",
      destructive: true,
      disabled: totalQuestions <= 1,
      confirmMsg: "Delete this question and its analysis? This cannot be undone.",
      action: () => dispatch({ type: "DELETE_QUESTION", questionId: question.id }),
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="rounded-lg p-1.5 text-[#565C82] hover:bg-[#EDEFF6] transition-colors"
        aria-label={`Actions for question ${questionIndex + 1}`}
        id={`question-actions-${question.id}`}
      >
        <span className="text-base leading-none font-bold">⋯</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setConfirm(null); }} />
          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-[#D5DAEC] bg-white py-1 shadow-lg">
            {actions.map((a) => (
              <button
                key={a.key}
                disabled={a.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  if (a.confirmMsg) {
                    setConfirm(a.key);
                  } else {
                    a.action();
                    setOpen(false);
                  }
                }}
                className={`w-full px-3 py-2 text-left text-sm ${
                  a.disabled
                    ? "cursor-not-allowed text-[#B0B5CC]"
                    : a.destructive
                      ? "text-[#B23A1B] hover:bg-[#FBE9E3]"
                      : "text-[#1D2140] hover:bg-[#F4F6FC]"
                }`}
              >
                {a.label}
                {a.key === "delete" && totalQuestions <= 1 && (
                  <span className="ml-1 text-[10px] text-[#B0B5CC]">(last question)</span>
                )}
              </button>
            ))}
            {confirm && (
              <div className="border-t border-[#EDEFF6] p-2">
                <p className="mb-2 text-xs text-[#B23A1B]">
                  {actions.find((a) => a.key === confirm)?.confirmMsg}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      actions.find((a) => a.key === confirm)?.action();
                      setOpen(false);
                      setConfirm(null);
                    }}
                    className="rounded-lg bg-[#B23A1B] px-2.5 py-1 text-[11px] font-bold text-white"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirm(null); }}
                    className="rounded-lg px-2.5 py-1 text-[11px] text-[#565C82] hover:bg-[#EDEFF6]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── CSV handler ───────────────────────────────────────────────────────────

function parseCsvFile(file: File, onParsed: (rows: StudentResponse[], fileName: string) => void) {
  const reader = new FileReader();
  reader.onload = () => {
    const text = String(reader.result ?? "");
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const start = /^id\s*,/i.test(lines[0] ?? "") ? 1 : 0;
    const rows: StudentResponse[] = [];
    for (let i = start; i < lines.length; i++) {
      const line = lines[i];
      const comma = line.indexOf(",");
      if (comma === -1) continue;
      const id = line.slice(0, comma).trim() || `R${String(rows.length + 1).padStart(2, "0")}`;
      let resp = line.slice(comma + 1).trim();
      if (resp.startsWith('"') && resp.endsWith('"')) resp = resp.slice(1, -1).replace(/""/g, '"');
      if (resp) rows.push({ id, text: resp });
    }
    onParsed(rows, file.name);
  };
  reader.readAsText(file);
}

// ─── Animated loading text ─────────────────────────────────────────────────

const LOADING_STAGES = [
  "Reading the rubric…",
  "Classifying responses…",
  "Clustering misconceptions…",
  "Building the learning-gap map…",
  "Drafting an intervention…",
];

function AnalyzingText() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setStage((s) => Math.min(s + 1, LOADING_STAGES.length - 1)),
      2500
    );
    return () => clearInterval(t);
  }, []);
  return (
    <span className="text-sm font-medium text-[#26306A]">
      {LOADING_STAGES[stage]}
    </span>
  );
}

// ─── Apply Rubric button ───────────────────────────────────────────────────

function ApplyRubricButton({
  questionId,
  currentCriteria,
  dispatch,
}: {
  questionId: string;
  currentCriteria: Rubric[];
  dispatch: React.Dispatch<AssessmentAction>;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const { rubrics, institutionRubrics } = useRubricLibrary();
  const allRubrics = [...rubrics, ...institutionRubrics];

  return (
    <>
      <button
        onClick={() => setShowPicker(true)}
        className="rounded-lg border border-[#D5DAEC] bg-white px-2.5 py-1 text-xs font-semibold text-[#3A4A9F] hover:border-[#3A4A9F] hover:bg-[#E9ECF9] transition-all"
        id={`apply-rubric-${questionId}`}
      >
        📚 Apply Global Rubric
      </button>
      {showPicker && (
        <RubricPicker
          rubrics={allRubrics}
          currentCriteria={currentCriteria}
          onSelect={(criteria) => {
            dispatch({ type: "SET_RUBRIC", questionId, rubric: criteria });
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}

// ─── QuestionCard component ────────────────────────────────────────────────

export default function QuestionCard({
  question,
  questionIndex,
  totalQuestions,
  dispatch,
  onAnalyze,
}: {
  question: QuestionState;
  questionIndex: number;
  totalQuestions: number;
  dispatch: React.Dispatch<AssessmentAction>;
  onAnalyze: (questionId: string) => void;
}) {
  const responses = getResponses(question);
  const questionNumber = questionIndex + 1;
  const preview = question.questionText.trim().slice(0, 80) || "Empty question";
  const totalRubricMarks = question.rubric.reduce((sum, c) => sum + (Number(c.maxMarks) || 0), 0);

  // ─── Collapsed view ────────────────────────────────────────────────

  if (!question.expanded) {
    return (
      <div
        id={`question-card-${question.id}`}
        className="rounded-2xl border border-[#D5DAEC] bg-white shadow-sm transition-all hover:border-[#3A4A9F]"
      >
        <div className="flex w-full items-center gap-3 px-5 py-4">
          <button
            onClick={() => dispatch({ type: "EXPAND_QUESTION", questionId: question.id })}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
            id={`question-toggle-${question.id}`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#26306A] text-xs font-bold text-white shadow-sm">
              Q{questionNumber}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#141834]">
                {preview}{question.questionText.length > 80 ? "…" : ""}
              </p>
              <p className="mt-0.5 text-xs text-[#565C82]">
                {question.rubric.filter((r) => r.name.trim()).length} criteria ({totalRubricMarks} marks) · {responses.length} responses
              </p>
            </div>
            <StatusBadge status={question.status} />
          </button>
          <ActionMenu
            question={question}
            questionIndex={questionIndex}
            totalQuestions={totalQuestions}
            dispatch={dispatch}
          />
          <button
            onClick={() => dispatch({ type: "EXPAND_QUESTION", questionId: question.id })}
            className="text-xs text-[#565C82] hover:text-[#26306A] px-2 py-1"
            aria-label="Expand question"
          >
            ▼
          </button>
        </div>
      </div>
    );
  }

  // ─── Expanded view ─────────────────────────────────────────────────

  return (
    <div
      id={`question-card-${question.id}`}
      className="rounded-2xl border border-[#D5DAEC] bg-white shadow-md transition-all overflow-hidden"
    >
      {/* Header Bar */}
      <div className="flex items-center gap-3 border-b border-[#EDEFF6] bg-[#FAFBFE] px-5 py-3.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#26306A] text-xs font-bold text-white shadow-sm">
          Q{questionNumber}
        </span>
        <span className="flex-1 text-sm font-bold text-[#141834]">
          Question {questionNumber}
        </span>
        <StatusBadge status={question.status} />
        <ActionMenu
          question={question}
          questionIndex={questionIndex}
          totalQuestions={totalQuestions}
          dispatch={dispatch}
        />
        <button
          onClick={() => dispatch({ type: "TOGGLE_EXPANDED", questionId: question.id })}
          className="rounded-lg px-2 py-1 text-xs text-[#565C82] hover:bg-[#EDEFF6] transition-colors"
          id={`question-collapse-${question.id}`}
          aria-label="Collapse question"
        >
          ▲
        </button>
      </div>

      {/* Staleness warning */}
      {question.status === "needs_reanalysis" && (
        <div className="mx-5 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#F5A623] bg-[#FDF3E1] px-4 py-3">
          <p className="text-xs sm:text-sm font-medium text-[#8A5A00]">
            ⚠ Inputs changed since last analysis. Re-analyze to update diagnostic results.
          </p>
          <button
            onClick={() => onAnalyze(question.id)}
            className="rounded-lg bg-[#F5A623] px-3 py-1.5 text-xs font-bold text-[#141834] shadow hover:brightness-95 transition-all"
          >
            Re-analyze →
          </button>
        </div>
      )}

      {/* Error */}
      {question.error && (
        <div className="mx-5 mt-4 rounded-xl border border-[#E4572E] bg-[#FBE9E3] px-4 py-3">
          <p className="text-sm font-medium text-[#B23A1B]">{question.error}</p>
          {question.status === "failed" && (
            <button
              onClick={() => onAnalyze(question.id)}
              className="mt-2 rounded-lg bg-[#B23A1B] px-3.5 py-1.5 text-xs font-bold text-white shadow hover:brightness-95 transition-all"
            >
              Retry →
            </button>
          )}
        </div>
      )}

      {/* Analyzing spinner */}
      {question.status === "analyzing" && (
        <div className="mx-5 mt-4 flex items-center gap-3 rounded-xl border border-[#D5DAEC] bg-[#E9ECF9] px-4 py-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#D5DAEC] border-t-[#26306A]" />
          <AnalyzingText />
        </div>
      )}

      {/* Step 1: Input Form (Two Columns with responsive stacking) */}
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
        {/* Column 1: Question Text & Rubric */}
        <div className="min-w-0 flex flex-col space-y-4">
          <div>
            <label
              htmlFor={`question-text-${question.id}`}
              className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#565C82]"
            >
              Exam question
            </label>
            <textarea
              id={`question-text-${question.id}`}
              value={question.questionText}
              onChange={(e) =>
                dispatch({ type: "SET_QUESTION_TEXT", questionId: question.id, text: e.target.value })
              }
              rows={3}
              placeholder="e.g. Explain price elasticity of demand. Illustrate with an example."
              className="w-full rounded-xl border border-[#D5DAEC] p-3 text-sm text-[#141834] placeholder:text-[#8B92B5] focus:border-[#3A4A9F] focus:outline-none transition-colors"
            />
          </div>

          <div className="pt-1">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-[#565C82]">
                Rubric criteria ({question.rubric.length}) · {totalRubricMarks} marks
              </span>
              <ApplyRubricButton
                questionId={question.id}
                currentCriteria={question.rubric}
                dispatch={dispatch}
              />
            </div>
            <RubricEditor
              criteria={question.rubric}
              showHeader={false}
              onChange={(newRubric) =>
                dispatch({ type: "SET_RUBRIC", questionId: question.id, rubric: newRubric })
              }
            />
          </div>
        </div>

        {/* Column 2: Student Responses */}
        <div className="min-w-0 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <SectionTitle kicker="Student work" title="Responses" />
          </div>

          <div className="flex gap-1 rounded-xl bg-[#EDEFF6] p-1 text-xs sm:text-sm font-semibold">
            <button
              onClick={() => dispatch({ type: "SET_RESPONSE_TAB", questionId: question.id, tab: "paste" })}
              className={`flex-1 rounded-lg px-3 py-1.5 transition-colors ${
                question.responseTab === "paste"
                  ? "bg-white text-[#26306A] shadow-sm"
                  : "text-[#565C82] hover:text-[#26306A]"
              }`}
            >
              Paste text
            </button>
            <button
              onClick={() => dispatch({ type: "SET_RESPONSE_TAB", questionId: question.id, tab: "csv" })}
              className={`flex-1 rounded-lg px-3 py-1.5 transition-colors ${
                question.responseTab === "csv"
                  ? "bg-white text-[#26306A] shadow-sm"
                  : "text-[#565C82] hover:text-[#26306A]"
              }`}
            >
              Upload CSV
            </button>
          </div>

          {question.responseTab === "paste" ? (
            <div className="flex-1 flex flex-col">
              <textarea
                id={`paste-text-${question.id}`}
                value={question.pasteText}
                onChange={(e) =>
                  dispatch({ type: "SET_PASTE_TEXT", questionId: question.id, text: e.target.value })
                }
                rows={9}
                placeholder="One student response per line, or separate longer answers with a line containing ---"
                className="w-full flex-1 min-h-[200px] rounded-xl border border-[#D5DAEC] p-3 text-sm text-[#141834] placeholder:text-[#8B92B5] focus:border-[#3A4A9F] focus:outline-none transition-colors"
              />
            </div>
          ) : (
            <label className="flex min-h-[200px] flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#D5DAEC] bg-[#F4F6FC] p-6 text-center hover:border-[#3A4A9F] transition-all">
              <span className="text-3xl">📄</span>
              <span className="mt-2 text-sm font-semibold text-[#26306A]">
                {question.csvName || "Click to choose a CSV file (columns: id, response)"}
              </span>
              <span className="mt-1 text-xs text-[#8B92B5]">
                Accepts .csv format with student answers
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    parseCsvFile(file, (rows, fileName) => {
                      dispatch({
                        type: "SET_CSV_ROWS",
                        questionId: question.id,
                        rows,
                        fileName,
                      });
                    });
                  }
                }}
              />
            </label>
          )}

          {/* Response Count & Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span className="text-xs sm:text-sm font-medium text-[#565C82]">
              {responses.length} response{responses.length === 1 ? "" : "s"} ready
              {responses.length > 0 && responses.length < 5 ? (
                <span className="ml-1 text-[#B45309] font-semibold">(min 5 for analysis)</span>
              ) : null}
            </span>
            <button
              onClick={() => onAnalyze(question.id)}
              disabled={question.status === "analyzing" || responses.length < 5}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#26306A] px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-[#3A4A9F] disabled:cursor-not-allowed disabled:opacity-50 transition-all"
              id={`analyze-btn-${question.id}`}
            >
              {question.status === "analyzing" ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Analyzing…</span>
                </>
              ) : (
                <span>Analyze Question →</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Steps 2 & 3: Analysis Results & Recommendation (only shown when analyzed & fresh) */}
      {question.analysis && question.status === "analyzed" && (
        <div className="border-t border-[#EDEFF6] bg-[#FAFBFE] p-5 sm:p-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="min-w-0">
              <Results analysis={question.analysis} />
            </div>
            <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
              <Recommendation analysis={question.analysis} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
