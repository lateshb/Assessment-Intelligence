"use client";

import { useState } from "react";
import { useHistory } from "@/lib/use-history";
import type { HistoryEntry } from "@/lib/history-types";
import Results from "./Results";
import Recommendation from "./Recommendation";

type Tab = "active" | "trash";

// ─── Main History Page ─────────────────────────────────────────────────────

export default function HistoryPage() {
  const { entries, loading, dispatch } = useHistory();
  const [tab, setTab] = useState<Tab>("active");
  const [viewId, setViewId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const active = entries.filter((e) => !e.trashed);
  const trashed = entries.filter((e) => e.trashed);
  const list = tab === "active" ? active : trashed;

  const viewing = viewId ? entries.find((e) => e.id === viewId) ?? null : null;

  // ─── Detail view ─────────────────────────────────────────────────

  if (viewing) {
    const analyzedCount = viewing.questions.filter((q) => q.analysis).length;
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <button
          onClick={() => setViewId(null)}
          className="mb-4 text-sm font-semibold text-[#3A4A9F] hover:underline"
        >
          ← Back to History
        </button>

        <div className="mb-6 rounded-2xl border border-[#D5DAEC] bg-white p-5 shadow-sm">
          <h1 className="text-xl font-bold text-[#141834]">{viewing.assessmentName}</h1>
          <p className="mt-1 text-sm text-[#565C82]">
            {viewing.questions.length} question{viewing.questions.length !== 1 ? "s" : ""}
            {" · "}
            {analyzedCount} analyzed
            {" · "}
            Saved {new Date(viewing.savedAt).toLocaleString()}
          </p>
          <span className="mt-2 inline-flex items-center rounded-full bg-[#EDEFF6] px-2.5 py-0.5 text-[11px] font-bold text-[#565C82]">
            Read-only
          </span>
        </div>

        <div className="space-y-4">
          {viewing.questions.map((q, i) => (
            <HistoryQuestionCard key={q.id} question={q} index={i} />
          ))}
        </div>
      </main>
    );
  }

  // ─── List view ───────────────────────────────────────────────────

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#EDEFF6] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#26306A] mb-2">
          Assessment Records
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#26306A]">Analysis History</h1>
        <p className="mt-1 text-sm text-[#565C82]">
          Review past diagnostic runs, recommendations, and logged teacher decisions.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex max-w-xs gap-1 rounded-xl bg-[#EDEFF6] p-1 text-sm font-semibold">
        <button
          onClick={() => setTab("active")}
          className={`flex-1 rounded-lg px-3 py-1.5 transition-all ${
            tab === "active" ? "bg-white text-[#26306A] shadow-xs" : "text-[#565C82] hover:text-[#26306A]"
          }`}
        >
          Active ({active.length})
        </button>
        <button
          onClick={() => setTab("trash")}
          className={`flex-1 rounded-lg px-3 py-1.5 transition-all ${
            tab === "trash" ? "bg-white text-[#26306A] shadow-xs" : "text-[#565C82] hover:text-[#26306A]"
          }`}
        >
          Trash ({trashed.length})
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="rounded-2xl border border-[#D5DAEC] bg-white p-12 text-center shadow-sm">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#3A4A9F] border-t-transparent mb-3" />
          <p className="text-sm font-semibold text-[#565C82]">Loading history records…</p>
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-[#D5DAEC] bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDEFF6] text-2xl">
            {tab === "active" ? "📊" : "🗑️"}
          </div>
          <h3 className="text-base font-bold text-[#141834]">
            {tab === "active" ? "No analyses yet" : "Trash is empty"}
          </h3>
          <p className="mt-1 text-sm text-[#565C82] max-w-md mx-auto">
            {tab === "active"
              ? "When you analyze questions in the workspace, completed runs will automatically be recorded here."
              : "Deleted assessments will be stored here until permanently removed."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((entry) => {
            const analyzedCount = entry.questions.filter((q) => q.analysis).length;
            const status =
              analyzedCount === 0 ? "draft"
              : analyzedCount === entry.questions.length ? "complete"
              : "partial";

            return (
              <div
                key={entry.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#D5DAEC] bg-white p-4 sm:p-5 shadow-sm transition-all hover:border-[#3A4A9F] hover:shadow-md"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-base font-bold text-[#26306A]">{entry.assessmentName}</h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        status === "complete"
                          ? "bg-[#E4F5F3] text-[#0E7C71]"
                          : status === "partial"
                            ? "bg-[#FDF3E1] text-[#B45309]"
                            : "bg-[#EDEFF6] text-[#565C82]"
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#565C82]">
                    {entry.questions.length} question{entry.questions.length !== 1 ? "s" : ""}
                    {" · "}
                    {analyzedCount} analyzed
                    {" · "}
                    Saved {new Date(entry.savedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewId(entry.id)}
                    className="rounded-xl bg-[#26306A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3A4A9F] transition-all"
                  >
                    View
                  </button>
                  {tab === "active" ? (
                    <button
                      onClick={() => dispatch({ type: "DELETE_ENTRY", id: entry.id })}
                      className="rounded-xl border border-[#D5DAEC] px-3.5 py-2 text-xs font-semibold text-[#565C82] hover:bg-[#FBE9E3] hover:text-[#B23A1B] hover:border-[#E4572E]/40 transition-all"
                    >
                      Move to trash
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => dispatch({ type: "RESTORE_ENTRY", id: entry.id })}
                        className="rounded-xl border border-[#0E7C71] px-3.5 py-2 text-xs font-semibold text-[#0E7C71] hover:bg-[#E4F5F3] transition-all"
                      >
                        Restore
                      </button>
                      {confirmDelete === entry.id ? (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              dispatch({ type: "PERMANENT_DELETE", id: entry.id });
                              setConfirmDelete(null);
                            }}
                            className="rounded-xl bg-[#B23A1B] px-3 py-2 text-xs font-bold text-white shadow-xs"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="rounded-xl border border-[#D5DAEC] px-2.5 py-2 text-xs font-semibold text-[#565C82] hover:bg-[#EDEFF6]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(entry.id)}
                          className="rounded-xl border border-[#E4572E]/40 px-3.5 py-2 text-xs font-semibold text-[#B23A1B] hover:bg-[#FBE9E3] transition-all"
                        >
                          Permanently Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

// ─── Read-only question card for history detail ────────────────────────────

function HistoryQuestionCard({
  question,
  index,
}: {
  question: HistoryEntry["questions"][number];
  index: number;
}) {
  const [expanded, setExpanded] = useState(index === 0);
  const [showPrevious, setShowPrevious] = useState(false);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState<number | null>(null);
  const [showAllResponses, setShowAllResponses] = useState(false);
  const questionNumber = index + 1;
  const preview = question.questionText.slice(0, 80) || "Empty question";

  // Determine which analysis/data to display
  const displayData = selectedVersionIndex !== null && question.previousAnalyses?.[selectedVersionIndex]
    ? {
        questionText: question.previousAnalyses[selectedVersionIndex].questionText,
        rubric: question.previousAnalyses[selectedVersionIndex].rubric,
        responses: question.previousAnalyses[selectedVersionIndex].responses,
        analysis: question.previousAnalyses[selectedVersionIndex].analysis,
        createdAt: question.previousAnalyses[selectedVersionIndex].createdAt,
      }
    : {
        questionText: question.questionText,
        rubric: question.rubric,
        responses: question.responses,
        analysis: question.analysis,
        createdAt: null,
      };

  if (!expanded) {
    return (
      <div className="rounded-2xl border border-[#D5DAEC] bg-white shadow-sm">
        <button
          onClick={() => setExpanded(true)}
          className="flex w-full items-center gap-3 px-5 py-4 text-left"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#26306A] text-xs font-bold text-white">
            Q{questionNumber}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#141834]">
              {preview}{question.questionText.length > 80 ? "…" : ""}
            </p>
            <p className="mt-0.5 text-xs text-[#565C82]">
              {question.rubric.length} criteria · {question.responses.length} responses
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
              question.status === "analyzed"
                ? "bg-[#E4F5F3] text-[#0E7C71]"
                : question.status === "failed"
                  ? "bg-[#FBE9E3] text-[#B23A1B]"
                  : "bg-[#EDEFF6] text-[#565C82]"
            }`}
          >
            {question.status}
          </span>
          <span className="text-[#565C82]">▼</span>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-[#3A4A9F] bg-white shadow-md">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#EDEFF6] px-5 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#26306A] text-xs font-bold text-white">
          Q{questionNumber}
        </span>
        <span className="flex-1 text-sm font-bold text-[#141834]">
          Question {questionNumber}
        </span>
        <span className="inline-flex items-center rounded-full bg-[#EDEFF6] px-2.5 py-0.5 text-[11px] font-bold text-[#565C82]">
          Read-only
        </span>
        <button
          onClick={() => setExpanded(false)}
          className="rounded-lg px-2 py-1 text-[#565C82] hover:bg-[#EDEFF6]"
        >
          ▲
        </button>
      </div>

      {/* Previous versions toggle */}
      {question.previousAnalyses && question.previousAnalyses.length > 0 && (
        <div className="border-b border-[#EDEFF6] px-5 py-2">
          <button
            onClick={() => {
              setShowPrevious(!showPrevious);
              if (showPrevious) setSelectedVersionIndex(null);
            }}
            className="flex items-center gap-2 text-xs font-semibold text-[#3A4A9F] hover:text-[#26306A]"
          >
            <span>{showPrevious ? "▼" : "▶"}</span>
            <span>Previous analyses ({question.previousAnalyses.length})</span>
          </button>
          {showPrevious && (
            <div className="mt-2 space-y-1 pl-5">
              <button
                onClick={() => setSelectedVersionIndex(null)}
                className={`block w-full rounded px-2 py-1 text-left text-xs ${
                  selectedVersionIndex === null
                    ? "bg-[#3A4A9F] text-white font-semibold"
                    : "text-[#565C82] hover:bg-[#EDEFF6]"
                }`}
              >
                Current (latest)
              </button>
              {question.previousAnalyses.map((prev, idx) => (
                <button
                  key={prev.id}
                  onClick={() => setSelectedVersionIndex(idx)}
                  className={`block w-full rounded px-2 py-1 text-left text-xs ${
                    selectedVersionIndex === idx
                      ? "bg-[#3A4A9F] text-white font-semibold"
                      : "text-[#565C82] hover:bg-[#EDEFF6]"
                  }`}
                >
                  {new Date(prev.createdAt).toLocaleString()}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Version indicator */}
      {selectedVersionIndex !== null && displayData.createdAt && (
        <div className="border-b border-[#EDEFF6] bg-[#FFF9E6] px-5 py-2">
          <p className="text-xs text-[#8B6914]">
            <span className="font-semibold">Viewing previous version:</span>{" "}
            {new Date(displayData.createdAt).toLocaleString()}
          </p>
        </div>
      )}

      {/* Question text + rubric (read-only) */}
      <div className="grid gap-5 p-5 lg:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#565C82]">
            Exam question
          </label>
          <p className="rounded-xl border border-[#EDEFF6] bg-[#F4F6FC] p-3 text-sm text-[#141834]">
            {displayData.questionText || "—"}
          </p>

          <div className="mt-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-[#565C82]">
              Rubric criteria ({displayData.rubric.length})
            </p>
            {displayData.rubric.map((r, i) => (
              <div key={i} className="rounded-lg border border-[#EDEFF6] bg-[#F4F6FC] p-2 text-sm">
                <span className="font-semibold text-[#141834]">{r.name}</span>
                <span className="ml-2 text-xs text-[#565C82]">({r.maxMarks} marks)</span>
                {r.description && (
                  <p className="mt-0.5 text-xs text-[#565C82]">{r.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          {(() => {
            const responsesList = Array.isArray(displayData.responses) ? displayData.responses : [];
            const visibleResponses = showAllResponses ? responsesList : responsesList.slice(0, 5);
            return (
              <>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#565C82]">
                  Responses ({responsesList.length})
                </label>
                <div className="max-h-60 overflow-y-auto rounded-xl border border-[#EDEFF6] bg-[#F4F6FC] p-3">
                  {responsesList.length === 0 ? (
                    <p className="text-sm text-[#565C82]">No responses recorded</p>
                  ) : (
                    visibleResponses.map((r, i) => (
                      <div key={i} className="border-b border-[#EDEFF6] py-1 text-xs text-[#1D2140] last:border-0">
                        <span className="font-medium text-[#3A4A9F]">{r.id}:</span>{" "}
                        {r.text.slice(0, 100)}{r.text.length > 100 ? "…" : ""}
                      </div>
                    ))
                  )}
                  {responsesList.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setShowAllResponses(!showAllResponses)}
                      className="mt-2 block font-semibold text-xs text-[#3A4A9F] hover:underline"
                    >
                      {showAllResponses ? "Show less" : `+ ${responsesList.length - 5} more`}
                    </button>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Analysis results */}
      {displayData.analysis && (
        <div className="border-t border-[#EDEFF6] p-5">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <Results analysis={displayData.analysis} />
            <div className="lg:sticky lg:top-20 lg:self-start">
              <Recommendation analysis={displayData.analysis} />
            </div>
          </div>
        </div>
      )}

      {!displayData.analysis && (
        <div className="border-t border-[#EDEFF6] p-5 text-center">
          <p className="text-sm text-[#565C82]">
            {question.status === "failed" ? "Analysis failed for this question." : "This question was not analyzed."}
          </p>
        </div>
      )}
    </div>
  );
}
