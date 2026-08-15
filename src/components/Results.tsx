"use client";

import { useState } from "react";
import type { Analysis } from "@/lib/types";
import { AIBadge, CATEGORY_META, ConfidenceBadge, SectionTitle } from "./ui";

export default function Results({ analysis }: { analysis: Analysis }) {
  const counts = analysis.perResponse.reduce(
    (a, p) => ((a[p.category] = (a[p.category] ?? 0) + 1), a),
    {} as Record<string, number>
  );
  const total = analysis.perResponse.length;
  const [tableOpen, setTableOpen] = useState(false);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Step 2: Summary strip */}
      <section className="rounded-2xl border border-[#D5DAEC] bg-white p-5 sm:p-6 shadow-sm">
        <SectionTitle kicker="Step 2 · Diagnose" title="What the class actually got wrong" />
        
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <span className="mr-1 inline-flex items-center gap-1.5 text-sm font-bold text-[#141834]">
            <span>{total} responses analysed</span>
            <AIBadge />
          </span>
          {(["correct", "partial", "misconception", "needs_review"] as const).map((k) => (
            <span
              key={k}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs sm:text-sm font-semibold shadow-xs ${CATEGORY_META[k].chip}`}
            >
              <span className={`h-2 w-2 rounded-full ${CATEGORY_META[k].dot}`} />
              <span>
                {counts[k] ?? 0} {CATEGORY_META[k].label}
              </span>
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-[#565C82] leading-relaxed">
          Responses under 60% classification confidence are automatically routed to “Needs teacher review”, ensuring human verification.
        </p>
      </section>

      {/* Learning-gap map */}
      <section className="rounded-2xl border border-[#D5DAEC] bg-white p-5 sm:p-6 shadow-sm">
        <SectionTitle kicker="Learning-gap map" title="Class mastery by rubric criterion" />
        <div className="mt-4 space-y-4">
          {analysis.gapMap.map((g) => {
            const barColor =
              g.level === "critical" ? "#E4572E" : g.level === "warning" ? "#F5A623" : "#0E7C71";
            const textColor =
              g.level === "critical" ? "#B23A1B" : g.level === "warning" ? "#B45309" : "#0E7C71";
            return (
              <div key={g.criterion} className="space-y-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-[#141834] flex items-center gap-2">
                    <span>{g.criterion}</span>
                    {g.level === "critical" && (
                      <span className="rounded-md bg-[#FBE9E3] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#B23A1B] border border-[#E4572E]/30">
                        Critical gap
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-bold tracking-tight" style={{ color: textColor }}>
                    <span>{g.masteryPct}%</span>{" "}
                    <span className="text-xs font-normal text-[#565C82]">mastery</span>
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-[#EDEFF6]">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.max(g.masteryPct, 2)}%`, backgroundColor: barColor }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-[#565C82] flex items-center gap-1.5">
          <span>Percentages are computed deterministically from rubric criterion scores.</span>
          <AIBadge />
        </p>
      </section>

      {/* Misconception clusters */}
      <section>
        <SectionTitle
          kicker="Misconception clusters"
          title="The beliefs behind the wrong answers"
        />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {analysis.clusters.length === 0 && (
            <div className="col-span-2 rounded-2xl border border-[#D5DAEC] bg-white p-8 text-center">
              <p className="text-sm text-[#565C82]">
                No recurring misconceptions detected in this response batch.
              </p>
            </div>
          )}
          {analysis.clusters.map((c) => (
            <article
              key={c.label}
              className="flex flex-col justify-between rounded-2xl border border-[#D5DAEC] bg-white p-5 shadow-sm transition-all hover:border-[#3A4A9F]"
            >
              <div>
                <div className="mb-2.5 flex items-start justify-between gap-3">
                  <h3 className="text-sm sm:text-base font-bold leading-snug text-[#141834]">
                    {c.label}
                    <AIBadge />
                  </h3>
                  <span className="shrink-0 rounded-full bg-[#26306A] px-2.5 py-0.5 text-xs font-bold text-white shadow-xs">
                    {c.responseIds.length} {c.responseIds.length === 1 ? "student" : "students"}
                  </span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-[#1D2140]">{c.explanation}</p>
                <div className="mt-3 space-y-2">
                  {c.responseIds.slice(0, 3).map((id) => {
                    const p = analysis.perResponse.find((x) => x.id === id);
                    return p?.evidence ? (
                      <blockquote
                        key={id}
                        className="rounded-lg border-l-3 border-[#F5A623] bg-[#F4F6FC] px-3 py-2 text-xs italic text-[#3A4A9F]"
                      >
                        “{p.evidence}” <span className="not-italic font-medium text-[#565C82]">— {id}</span>
                      </blockquote>
                    ) : null;
                  })}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#EDEFF6]">
                <ConfidenceBadge value={c.avgConfidence} />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Response-level detail button */}
      <section className="rounded-2xl border border-[#D5DAEC] bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => setTableOpen(true)}
          className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-[#F8FAFD] transition-colors"
          id="view-response-detail-btn"
        >
          <span className="text-sm font-bold text-[#26306A]">
            Response-level detail ({total}) — draft marks for teacher review
          </span>
          <span className="text-xs font-semibold text-[#3A4A9F] bg-[#E9ECF9] px-2.5 py-1 rounded-lg">
            View Table ↗
          </span>
        </button>
      </section>

      {/* Centered Modal Overlay for Response Detail */}
      {tableOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6 backdrop-blur-xs"
          onClick={(e) => { if (e.target === e.currentTarget) setTableOpen(false); }}
        >
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl border border-[#D5DAEC] overflow-hidden">
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-[#D5DAEC] bg-[#FAFBFE] px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-[#26306A]">
                  Response-Level Diagnostic Detail
                </h2>
                <p className="text-xs text-[#565C82]">
                  {total} responses analysed · Draft marks require teacher confirmation
                </p>
              </div>
              <button
                onClick={() => setTableOpen(false)}
                className="rounded-lg border border-[#D5DAEC] px-3 py-1.5 text-xs font-bold text-[#565C82] hover:bg-[#EDEFF6] transition-colors"
                aria-label="Close response detail"
              >
                ✕ Close
              </button>
            </div>

            {/* Scrollable Table Area */}
            <div className="flex-1 overflow-auto p-2 sm:p-4">
              <table className="w-full min-w-[700px] text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#F4F6FC] text-xs font-bold uppercase tracking-wider text-[#565C82] border-b border-[#D5DAEC]">
                    <th className="px-3.5 py-2.5">ID</th>
                    <th className="px-3.5 py-2.5">Response / Evidence</th>
                    <th className="px-3.5 py-2.5">Category</th>
                    <th className="px-3.5 py-2.5">Misconception</th>
                    <th className="px-3.5 py-2.5">Confidence</th>
                    <th className="px-3.5 py-2.5">
                      Mark <span className="text-[10px] normal-case text-[#565C82]">(Teacher Confirms)</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEFF6]">
                  {analysis.perResponse.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FAFBFE] transition-colors">
                      <td className="px-3.5 py-3 font-mono text-xs font-semibold text-[#26306A]">{p.id}</td>
                      <td className="max-w-[280px] px-3.5 py-3 text-xs text-[#1D2140] leading-relaxed">
                        {p.evidence || "—"}
                      </td>
                      <td className="px-3.5 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_META[p.category].chip}`}
                        >
                          {CATEGORY_META[p.category].label}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-xs text-[#141834] font-medium">{p.misconception ?? "—"}</td>
                      <td className="px-3.5 py-3">
                        <ConfidenceBadge value={p.confidence} />
                      </td>
                      <td className="px-3.5 py-3 text-xs font-bold text-[#141834]">
                        <span>{p.draftMark}</span>
                        <span className="ml-1.5 rounded bg-[#EDEFF6] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#565C82]">
                          draft
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
