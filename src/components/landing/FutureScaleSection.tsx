"use client";

import Link from "next/link";

const todayCapabilities = [
  "Multi-question diagnostic workspace",
  "Batched Gemini LLM response classification",
  "Deterministic server-side learning-gap math",
  "Misconception clustering with verbatim quotes",
  "AI-drafted 15-minute interventions",
  "Approve / Modify / Reject teacher decision gate",
  "Global Rubrics library & frozen snapshots",
  "Analysis history & versioning with staleness detection",
];

const nextCapabilities = [
  "Direct assessment-pipeline and LMS data ingestion",
  "Longitudinal outcome tracking tying interventions to score deltas",
  "Adaptive student-specific remediation paths",
  "Fine-tuned subject-specific misconception classifiers",
];

export default function FutureScaleSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:py-16" id="future-scale">
      <div className="text-center mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#B45309]">
          Platform Evolution
        </p>
        <h2 className="mt-1 text-2xl font-bold text-[#141834] sm:text-3xl">
          What is built today vs. what is next
        </h2>
        <p className="mt-2 text-sm text-[#565C82] max-w-2xl mx-auto">
          We maintain rigorous honesty about our architecture: what is production-ready today and our disciplined roadmap ahead.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Built Today Card */}
        <div className="rounded-2xl border border-[#0E7C71]/40 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="rounded-full bg-[#E6F7F5] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#0E7C71]">
              Today · Active Platform
            </span>
            <span className="text-xs font-bold text-[#0E7C71]">Live</span>
          </div>
          <h3 className="text-lg font-bold text-[#141834] mb-3">
            Core Learning-Gap &amp; Decision Engine
          </h3>
          <ul className="space-y-2 text-xs text-[#1D2140]">
            {todayCapabilities.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#0E7C71] font-bold shrink-0">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* What is Next Card */}
        <div className="rounded-2xl border border-[#D5DAEC] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="rounded-full bg-[#EDEFF6] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#26306A]">
              Next · Planned Roadmap
            </span>
            <span className="text-xs font-semibold text-[#565C82]">Phase 2 &amp; Beyond</span>
          </div>
          <h3 className="text-lg font-bold text-[#141834] mb-3">
            Longitudinal Learning &amp; Production ML
          </h3>
          <ul className="space-y-2.5 text-xs text-[#565C82]">
            {nextCapabilities.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#3A4A9F] font-bold shrink-0">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 pt-4 border-t border-[#EDEFF6]">
            <Link
              href="/build-and-scale"
              className="text-xs font-bold text-[#3A4A9F] hover:underline inline-flex items-center gap-1"
            >
              <span>Read the full Build &amp; Scale Technical Architecture Brief</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
