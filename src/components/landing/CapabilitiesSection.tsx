"use client";

const capabilityGroups = [
  {
    pillar: "A",
    title: "Build Assessments",
    icon: "📝",
    tagline: "Flexible Multi-Question Authoring",
    points: [
      "Create multi-question assessments with custom names and instructions",
      "Add, edit, delete, and duplicate questions seamlessly",
      "Define question-specific rubrics with criteria names and max marks",
      "Add student responses through flexible Paste text or CSV uploads",
      "One-click loading of curated 50-response demo datasets",
    ],
  },
  {
    pillar: "B",
    title: "Save & Continue",
    icon: "💾",
    tagline: "Persistent Cloud Workspace",
    points: [
      "Save Draft at any stage of authoring or analysis",
      "Return to Saved Assessments anytime across devices",
      "Reopen existing assessments and continue editing cleanly",
      "Prevent accidental duplicates through persistent entity IDs",
    ],
  },
  {
    pillar: "C",
    title: "Reusable Rubrics",
    icon: "📚",
    tagline: "Standardized Global Rubrics Library",
    points: [
      "Create and maintain a shared library of reusable Global Rubrics",
      "Apply library rubrics to any assessment question with one click",
      "Choose to merge with or replace existing question criteria",
      "Applied rubrics remain frozen snapshots, immune to later library edits",
    ],
  },
  {
    pillar: "D",
    title: "Analyze & Classify",
    icon: "⚡",
    tagline: "Prompted Batched LLM Engine",
    points: [
      "Analyze single questions or use 'Analyze All' for parallel processing",
      "Response-level categorization (Correct, Partial, Misconception, Needs Review)",
      "Exact verbatim evidence quotes extracted for each classification",
      "Visible probabilistic confidence scores on every student response",
      "Draft marks calculated automatically without human-in-the-loop bypass",
    ],
  },
  {
    pillar: "E",
    title: "Diagnose the Class",
    icon: "📊",
    tagline: "Deterministic Learning-Gap Mapping",
    points: [
      "Visual learning-gap map with % mastery per rubric criterion",
      "Automated flagging of critical class-wide skill gaps",
      "Misconception clusters identifying underlying conceptual flaws",
      "Precise student counts, rosters, and evidence for every cluster",
    ],
  },
  {
    pillar: "F",
    title: "Recommend & Decide",
    icon: "🎯",
    tagline: "Actionable Interventions Under Teacher Control",
    points: [
      "AI generates one targeted intervention (e.g. 15-min focused session)",
      "Pinpoints the exact subset of affected students needing remediation",
      "Provides clear pedagogical rationale and follow-up guidance",
      "Teacher decision gate: Approve, Modify, or Reject with recorded rationale",
    ],
  },
  {
    pillar: "G",
    title: "History & Re-analysis",
    icon: "⏳",
    tagline: "Complete Versioning & Audit Trail",
    points: [
      "Central Analysis History preserving all assessment runs",
      "Switch between current and previous analysis versions effortlessly",
      "Immutable snapshots of responses, rubrics, and model results",
      "Automatic staleness detection when question inputs or responses change",
    ],
  },
];

export default function CapabilitiesSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:py-16" id="capabilities">
      <div className="text-center mb-12">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#B45309]">
          Platform Capabilities
        </p>
        <h2 className="mt-1 text-2xl font-bold text-[#141834] sm:text-3xl">
          Everything the teacher can do — in one integrated workflow
        </h2>
        <p className="mt-2 text-sm text-[#565C82] max-w-2xl mx-auto">
          Every tool is purpose-built to reduce manual grading overhead and empower educators
          with actionable diagnostic clarity.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {capabilityGroups.map((group, idx) => {
          const isWide = idx === 6; // Span across on wide screens if desired
          return (
            <div
              key={group.pillar}
              className={`rounded-2xl border border-[#D5DAEC] bg-white p-6 shadow-xs hover:border-[#3A4A9F] hover:shadow-md transition-all ${
                isWide ? "md:col-span-2 lg:col-span-3 bg-gradient-to-r from-white via-white to-[#F4F6FC]" : ""
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E9ECF9] text-xl">
                  {group.icon}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#3A4A9F]">
                      Pillar {group.pillar}
                    </span>
                    <span className="text-xs text-[#98A2C8]">·</span>
                    <span className="text-xs font-semibold text-[#565C82]">
                      {group.tagline}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#141834]">
                    {group.title}
                  </h3>
                </div>
              </div>

              <ul className={`mt-4 space-y-2 text-xs text-[#1D2140] ${isWide ? "grid sm:grid-cols-2 gap-x-6 gap-y-2 space-y-0" : ""}`}>
                {group.points.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#0E7C71] font-bold shrink-0 mt-0.5">✓</span>
                    <span className="leading-relaxed">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
