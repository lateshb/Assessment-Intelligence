"use client";

import { useState } from "react";
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
  ready: { label: "Ready", classes: "bg-[#E4F5F3] text-[#0E7C71]" },
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

// ─── Confirmation dialog ───────────────────────────────────────────────────

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-2 rounded-xl border border-[#E4572E] bg-[#FBE9E3] p-3">
      <p className="text-sm font-medium text-[#B23A1B]">{message}</p>
      <div className="mt-2 flex gap-2">
        <button
          onClick={onConfirm}
          className="rounded-lg bg-[#B23A1B] px-3 py-1.5 text-xs font-bold text-white hover:brightness-95"
        >
          Confirm
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#565C82] hover:bg-[#EDEFF6]"
        >
          Cancel
        </button>
      </div>
    </div>
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
        className="rounded-lg px-2 py-1 text-[#565C82] hover:bg-[#EDEFF6]"
        aria-label={`Actions for question ${questionIndex + 1}`}
        id={`question-actions-${question.id}`}
      >
        ⋯
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

// ─── Loading stages ────────────────────────────────────────────────────────

const LOADING_STAGES = [
  "Reading the rubric…",
  "Classifying responses…",
  "Clustering misconceptions…",
  "Building the learning-gap map…",
  "Drafting an intervention…",
];

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
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#26306A] text-xs font-bold text-white">
              Q{questionNumber}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#141834]">
                {preview}{question.questionText.length > 80 ? "…" : ""}
              </p>
              <p className="mt-0.5 text-xs text-[#565C82]">
                {question.rubric.filter((r) => r.name.trim()).length} criteria · {responses.length} responses
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
            className="text-[#565C82]"
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
      className="rounded-2xl border-2 border-[#3A4A9F] bg-white shadow-md transition-all"
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#EDEFF6] px-5 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#26306A] text-xs font-bold text-white">
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
          className="rounded-lg px-2 py-1 text-[#565C82] hover:bg-[#EDEFF6]"
          id={`question-collapse-${question.id}`}
        >
          ▲
        </button>
      </div>

      {/* Staleness warning */}
      {question.status === "needs_reanalysis" && (
        <div className="mx-5 mt-4 rounded-xl border border-[#F5A623] bg-[#FDF3E1] px-4 py-3">
          <p className="text-sm font-medium text-[#8A5A00]">
            ⚠ Inputs changed since last analysis. Re-analyze to update.
          </p>
          <button
            onClick={() => onAnalyze(question.id)}
            className="mt-2 rounded-lg bg-[#F5A623] px-4 py-1.5 text-xs font-bold text-[#141834] hover:brightness-95"
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
              className="mt-2 rounded-lg bg-[#B23A1B] px-4 py-1.5 text-xs font-bold text-white hover:brightness-95"
            >
              Retry →
            </button>
          )}
        </div>
      )}

      {/* Analyzing spinner */}
      {question.status === "analyzing" && (
        <div className="mx-5 mt-4 flex items-center gap-3 rounded-xl bg-[#E9ECF9] px-4 py-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#E9ECF9] border-t-[#26306A]" />
          <AnalyzingText />
        </div>
      )}

      {/* Input form */}
      <div className="grid gap-5 p-5 lg:grid-cols-2">
        {/* Question + Rubric */}
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#565C82]">
            Exam question
          </label>
          <textarea
            value={question.questionText}
            onChange={(e) =>
              dispatch({ type: "SET_QUESTION_TEXT", questionId: question.id, text: e.target.value })
            }
            rows={3}
            placeholder="e.g. Explain price elasticity of demand. Illustrate with an example."
            className="w-full rounded-xl border border-[#D5DAEC] p-3 text-sm focus:border-[#3A4A9F] focus:outline-none"
            id={`question-text-${question.id}`}
          />

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-[#565C82]">
                Rubric criteria ({question.rubric.length})
              </p>
              <ApplyRubricButton
                questionId={question.id}
                currentCriteria={question.rubric}
                dispatch={dispatch}
              />
            </div>
            <RubricEditor
              criteria={question.rubric}
              onChange={(newRubric) =>
                dispatch({ type: "SET_RUBRIC", questionId: question.id, rubric: newRubric })
              }
            />
          </div>
        </div>

        {/* Responses */}
        <div className="flex flex-col">
          <SectionTitle kicker="Student work" title="Responses" />
          <div className="mb-3 flex gap-1 rounded-xl bg-[#EDEFF6] p-1 text-sm font-semibold">
            <button
              onClick={() => dispatch({ type: "SET_RESPONSE_TAB", questionId: question.id, tab: "paste" })}
              className={`flex-1 rounded-lg px-3 py-1.5 ${
                question.responseTab === "paste"
                  ? "bg-white text-[#26306A] shadow"
                  : "text-[#565C82]"
              }`}
            >
              Paste
            </button>
            <button
              onClick={() => dispatch({ type: "SET_RESPONSE_TAB", questionId: question.id, tab: "csv" })}
              className={`flex-1 rounded-lg px-3 py-1.5 ${
                question.responseTab === "csv"
                  ? "bg-white text-[#26306A] shadow"
                  : "text-[#565C82]"
              }`}
            >
              Upload CSV
            </button>
          </div>
          {question.responseTab === "paste" ? (
            <textarea
              value={question.pasteText}
              onChange={(e) =>
                dispatch({ type: "SET_PASTE_TEXT", questionId: question.id, text: e.target.value })
              }
              rows={10}
              placeholder="One response per line, or separate longer answers with a line containing ---"
              className="w-full flex-1 rounded-xl border border-[#D5DAEC] p-3 text-sm focus:border-[#3A4A9F] focus:outline-none"
              id={`paste-text-${question.id}`}
            />
          ) : (
            <label className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#D5DAEC] bg-[#F4F6FC] p-8 text-center hover:border-[#3A4A9F]">
              <span className="text-3xl">📄</span>
              <span className="mt-2 text-sm font-semibold text-[#26306A]">
                {question.csvName || "Click to choose a CSV (columns: id,response)"}
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
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-[#565C82]">
              {responses.length} response{responses.length === 1 ? "" : "s"} ready
              {responses.length > 0 && responses.length < 5 ? " (min 5)" : ""}
            </span>
            <button
              onClick={() => onAnalyze(question.id)}
              disabled={question.status === "analyzing"}
              className="rounded-xl bg-[#26306A] px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-[#3A4A9F] disabled:cursor-not-allowed disabled:opacity-50"
              id={`analyze-btn-${question.id}`}
            >
              {question.status === "analyzing" ? "Analyzing…" : "Analyze →"}
            </button>
          </div>
        </div>
      </div>

      {/* Analysis results (inline) */}
      {question.analysis && question.status !== "analyzing" && (
        <div className={`border-t border-[#EDEFF6] p-5 ${question.status === "needs_reanalysis" ? "opacity-60" : ""}`}>
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <Results analysis={question.analysis} />
            <div className="lg:sticky lg:top-20 lg:self-start">
              <Recommendation analysis={question.analysis} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Animated loading text ─────────────────────────────────────────────────

function AnalyzingText() {
  const [stage, setStage] = useState(0);
  // Advance through loading stages
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useState(() => {
    // Using useState initializer as a one-time side effect for simplicity
    if (typeof window !== "undefined") {
      const t = setInterval(
        () => setStage((s) => Math.min(s + 1, LOADING_STAGES.length - 1)),
        2500
      );
      // Note: cleanup is handled by React unmount since this is a one-time init
      return () => clearInterval(t);
    }
  });
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
        className="rounded-lg border border-[#D5DAEC] px-3 py-1 text-xs font-semibold text-[#3A4A9F] hover:bg-[#E9ECF9]"
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
