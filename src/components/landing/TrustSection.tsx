"use client";

const trustPrinciples = [
  {
    title: "Probabilistic AI & Visible Confidence",
    description:
      "All LLM classifications are probabilistic estimates. Exact numerical confidence scores are displayed on every single response, so teachers always know where the model is confident and where it is uncertain.",
    icon: "🎯",
  },
  {
    title: "Verbatim Student Evidence",
    description:
      "No diagnosis is made without cited proof. The system extracts and highlights verbatim quotes from actual student answers to justify every assigned misconception and classification.",
    icon: "🔍",
  },
  {
    title: "Draft Marks, Never Final Grades",
    description:
      "Scores computed during analysis are strictly draft marks. AI never finalizes or submits a grade without explicit review, override, and confirmation by the teacher.",
    icon: "📋",
  },
  {
    title: "Automatic Human-Review Routing",
    description:
      "Any student response classified with confidence below 60% is automatically routed to a dedicated 'Needs Teacher Review' queue, preventing false-positive categorization from affecting class remediation.",
    icon: "🛡️",
  },
  {
    title: "Strict Teacher Approval Gate",
    description:
      "The engine recommends interventions, but can never trigger one on its own. Every teaching action requires faculty to explicitly Approve, Modify, or Reject the recommendation.",
    icon: "✋",
  },
  {
    title: "Immutable Snapshots & Audit Trail",
    description:
      "Analysis history preserves exact snapshots of rubrics, responses, and AI outputs. When you edit inputs, stale analyses are clearly flagged rather than silently overwriting historical evidence.",
    icon: "🔒",
  },
];

export default function TrustSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:py-16" id="trust">
      <div className="rounded-3xl bg-[#26306A] p-6 sm:p-10 lg:p-12 text-white shadow-xl">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#F5A623]">
            Trust, Ethics &amp; Explainability
          </p>
          <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl lg:text-4xl text-white">
            AI assists the decision. The teacher owns it.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#C3CAEC] sm:text-base">
            We reject black-box automation in education. Every number, classification, and recommended action
            is designed to empower the educator with transparent evidence and total final authority.
          </p>
        </div>

        {/* 6 Trust Grid Cards */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trustPrinciples.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xs hover:bg-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className="text-xl">{item.icon}</span>
                <h3 className="text-sm font-bold text-white">{item.title}</h3>
              </div>
              <p className="text-xs leading-relaxed text-[#C3CAEC]">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Prototype Transparency Disclosure Banner */}
        <div className="mt-10 rounded-2xl border border-white/15 bg-white/10 p-4 sm:p-5 text-center max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-[#F5A623]">
            Prototype Transparency Disclosure
          </p>
          <p className="mt-1 text-xs text-[#D4DAF2] leading-relaxed">
            Assessment Intelligence currently operates on carefully curated synthetic student datasets and benchmark exam questions.
            All AI outputs are probabilistic and require educator validation before instructional use.
          </p>
        </div>
      </div>
    </section>
  );
}
