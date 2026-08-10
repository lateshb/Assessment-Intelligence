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
    <div className="space-y-8">
      {/* Summary strip */}
      <section className="rounded-2xl border border-[#D5DAEC] bg-white p-5 shadow-sm">
        <SectionTitle kicker="Step 2 · Diagnose" title="What the class actually got wrong" />
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 text-sm font-semibold text-[#141834]">
            {total} responses analysed
            <AIBadge />
          </span>
          {(["correct", "partial", "misconception", "needs_review"] as const).map((k) => (
            <span
              key={k}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${CATEGORY_META[k].chip}`}
            >
              <span className={`h-2 w-2 rounded-full ${CATEGORY_META[k].dot}`} />
              {counts[k] ?? 0} {CATEGORY_META[k].label}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-[#565C82]">
          Responses under 60% classification confidence are routed to “Needs teacher review”
          automatically, whatever the model thought.
        </p>
      </section>

      {/* Gap map */}
      <section className="rounded-2xl border border-[#D5DAEC] bg-white p-5 shadow-sm">
        <SectionTitle kicker="Learning-gap map" title="Class mastery by rubric criterion" />
        <div className="space-y-4">
          {analysis.gapMap.map((g) => {
            // Vibrant fill for the bar; a darker, WCAG-AA variant for the % text.
            const barColor =
              g.level === "critical" ? "#E4572E" : g.level === "warning" ? "#F5A623" : "#17B0A0";
            const textColor =
              g.level === "critical" ? "#B23A1B" : g.level === "warning" ? "#B45309" : "#0E7C71";
            return (
              <div key={g.criterion}>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-[#141834]">
                    {g.criterion}
                    {g.level === "critical" && (
                      <span className="ml-2 rounded bg-[#B23A1B] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Critical gap
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-bold" style={{ color: textColor }}>
                    {g.masteryPct}%
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-[#EDEFF6]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${g.masteryPct}%`, backgroundColor: barColor }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-[#565C82]">
          Percentages are computed deterministically on the server from per-response criterion
          scores; the model’s own arithmetic is never trusted.
          <AIBadge />
        </p>
      </section>

      {/* Misconception clusters */}
      <section>
        <SectionTitle
          kicker="Misconception clusters"
          title="The beliefs behind the wrong answers"
        />
        <div className="grid gap-4 md:grid-cols-2">
          {analysis.clusters.length === 0 && (
            <p className="text-sm text-[#565C82]">
              No recurring misconception detected in this batch.
            </p>
          )}
          {analysis.clusters.map((c) => (
            <article
              key={c.label}
              className="rounded-2xl border border-[#D5DAEC] bg-white p-5 shadow-sm"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <h3 className="text-base font-bold leading-snug text-[#141834]">
                  {c.label}
                  <AIBadge />
                </h3>
                <span className="shrink-0 rounded-full bg-[#26306A] px-2.5 py-1 text-xs font-bold text-white">
                  {c.responseIds.length} student{c.responseIds.length === 1 ? "" : "s"}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[#1D2140]">{c.explanation}</p>
              <div className="mt-3 space-y-2">
                {c.responseIds.slice(0, 3).map((id) => {
                  const p = analysis.perResponse.find((x) => x.id === id);
                  return p?.evidence ? (
                    <blockquote
                      key={id}
                      className="rounded-lg border-l-4 border-[#F5A623] bg-[#F4F6FC] px-3 py-2 text-xs italic text-[#3A4A9F]"
                    >
                      “{p.evidence}” <span className="not-italic text-[#565C82]">— {id}</span>
                    </blockquote>
                  ) : null;
                })}
              </div>
              <div className="mt-3">
                <ConfidenceBadge value={c.avgConfidence} />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Response table */}
      <section className="rounded-2xl border border-[#D5DAEC] bg-white shadow-sm">
        <button
          onClick={() => setTableOpen((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <span className="text-sm font-bold text-[#26306A]">
            Response-level detail ({total}) — draft marks for teacher review
          </span>
          <span className="text-[#565C82]">{tableOpen ? "▲ Hide" : "▼ Show"}</span>
        </button>
        {tableOpen && (
          <div className="overflow-x-auto border-t border-[#D5DAEC]">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="bg-[#F4F6FC] text-xs uppercase tracking-wide text-[#565C82]">
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Response</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Misconception</th>
                  <th className="px-4 py-2">Confidence</th>
                  <th className="px-4 py-2">
                    Mark <span className="normal-case">(DRAFT — teacher confirms)</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {analysis.perResponse.map((p) => (
                  <tr key={p.id} className="border-t border-[#EDEFF6] align-top">
                    <td className="px-4 py-2 font-mono text-xs">{p.id}</td>
                    <td className="max-w-[280px] px-4 py-2 text-xs text-[#1D2140]">
                      {p.evidence || "—"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORY_META[p.category].chip}`}
                      >
                        {CATEGORY_META[p.category].label}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs">{p.misconception ?? "—"}</td>
                    <td className="px-4 py-2">
                      <ConfidenceBadge value={p.confidence} />
                    </td>
                    <td className="px-4 py-2 text-xs font-semibold">
                      {p.draftMark}
                      <span className="ml-1 rounded bg-[#EDEFF6] px-1 py-0.5 text-[10px] font-bold uppercase text-[#565C82]">
                        draft
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
