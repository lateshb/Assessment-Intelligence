"use client";

const trustPrinciples = [
  {
    title: "Visible Confidence Scores",
    description:
      "Every single response displays a clear AI confidence score. You always know when the model is certain and when it recommends a human double-check.",
    icon: "🎯",
  },
  {
    title: "Exact Student Quotes",
    description:
      "No guessing or mysterious labels. Every diagnosis highlights verbatim quotes from the student's actual text as clear evidence.",
    icon: "🔍",
  },
  {
    title: "Draft Marks, Not Final Grades",
    description:
      "Scores are generated purely as draft suggestions for the educator. The AI never finalizes or publishes grades without your approval.",
    icon: "📋",
  },
  {
    title: "Flags Uncertain Answers",
    description:
      "Any response with low confidence (below 60%) is automatically sent to a 'Needs Review' queue so you can quickly review it yourself.",
    icon: "🛡️",
  },
  {
    title: "Teacher Decides Every Action",
    description:
      "The AI suggests helpful 15-minute interventions, but never teaches or changes lessons without you clicking Approve, Modify, or Reject.",
    icon: "✋",
  },
  {
    title: "Clear History & Audit Trail",
    description:
      "Every run is saved with its original rubric and student responses. If you edit questions later, earlier records stay intact.",
    icon: "🔒",
  },
];

export default function TrustSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:py-16" id="trust">
      <div className="rounded-3xl bg-[#26306A] p-6 sm:p-10 lg:p-12 text-white shadow-xl">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#F5A623]">
            Trust &amp; Transparency
          </p>
          <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl lg:text-4xl text-white">
            AI recommends. The teacher decides.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#C3CAEC] sm:text-base">
            We believe in transparent, explainable tools for educators. Every score, quote, and recommendation
            is designed to give teachers total clarity and final authority.
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
      </div>
    </section>
  );
}

