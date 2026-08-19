"use client";

import Link from "next/link";

const quickSteps = [
  {
    step: "1",
    title: "Build or load an assessment",
    description:
      "Enter your question prompt or click 'Load demo data' to populate an instant 50-student response set.",
  },
  {
    step: "2",
    title: "Add rubric criteria & responses",
    description:
      "Apply criteria from the Global Rubric Library or write custom benchmarks, then paste or upload student text.",
  },
  {
    step: "3",
    title: "Analyze & inspect learning gaps",
    description:
      "Click Analyze to run batched classification. View criterion mastery percentages and misconception clusters.",
  },
  {
    step: "4",
    title: "Review recommended intervention",
    description:
      "Inspect the AI-generated 15-minute intervention plan, verify evidence quotes, and click Approve, Modify, or Reject.",
  },
];

export default function HowItWorksGuideSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:py-16" id="how-to-start">
      <div className="text-center mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#B45309]">
          Quick Start
        </p>
        <h2 className="mt-1 text-2xl font-bold text-[#141834] sm:text-3xl">
          Get started in under 3 minutes
        </h2>
        <p className="mt-2 text-sm text-[#565C82] max-w-2xl mx-auto">
          A streamlined 4-step process from question setup to logged pedagogical decision.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {quickSteps.map((s) => (
          <div
            key={s.step}
            className="flex flex-col justify-between rounded-2xl border border-[#D5DAEC] bg-white p-6 shadow-xs"
          >
            <div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5A623] text-sm font-extrabold text-[#141834] mb-3">
                {s.step}
              </span>
              <h3 className="text-base font-bold text-[#141834]">
                {s.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#565C82]">
                {s.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/how-to-use"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#3A4A9F] bg-white px-5 py-2.5 text-xs font-bold text-[#3A4A9F] hover:bg-[#E9ECF9] transition-all"
        >
          <span>View Complete User Guide &amp; Input Format Specs</span>
          <span>→</span>
        </Link>
      </div>
    </section>
  );
}
