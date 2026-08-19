"use client";

const workflowSteps = [
  {
    step: "01",
    title: "Assess",
    tagline: "Questions & Responses",
    description:
      "Enter your question, set your rubric criteria, and paste or upload student answers in seconds.",
    badgeColor: "bg-[#26306A] text-white",
  },
  {
    step: "02",
    title: "Diagnose",
    tagline: "Instant AI Analysis",
    description:
      "AI reads every student answer, highlights exact phrases as evidence, and scores confidence for each diagnostic.",
    badgeColor: "bg-[#3A4A9F] text-white",
  },
  {
    step: "03",
    title: "Identify Gaps",
    tagline: "Class-Wide Learning Map",
    description:
      "Instantly summarizes class scores, highlights the biggest learning gaps, and groups students who made similar mistakes.",
    badgeColor: "bg-[#0E7C71] text-white",
  },
  {
    step: "04",
    title: "Recommend",
    tagline: "15-Minute Action Plan",
    description:
      "Suggests a focused 15-minute review session tailored directly to the main misconception.",
    badgeColor: "bg-[#F5A623] text-[#141834]",
  },
  {
    step: "05",
    title: "Decide",
    tagline: "Teacher in Control",
    description:
      "You review the findings and choose to Approve, Modify, or Reject. Nothing is taught without your say-so.",
    badgeColor: "bg-[#B45309] text-white",
  },
  {
    step: "06",
    title: "Revisit",
    tagline: "History & Saved Work",
    description:
      "Save assessments securely, compare student batches over time, and reuse your best rubrics.",
    badgeColor: "bg-[#1E2656] text-white",
  },
];

export default function WorkflowSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:py-16" id="workflow">
      <div className="text-center mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#B45309]">
          The Product Workflow
        </p>
        <h2 className="mt-1 text-2xl font-bold text-[#141834] sm:text-3xl">
          Six steps from raw student answers to closed learning gaps
        </h2>
        <p className="mt-2 text-sm text-[#565C82] max-w-2xl mx-auto">
          An end-to-end pedagogical loop designed specifically around the teacher&apos;s instructional decision-making workflow.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {workflowSteps.map((step) => (
          <div
            key={step.step}
            className="group relative flex flex-col justify-between rounded-2xl border border-[#D5DAEC] bg-white p-6 shadow-xs hover:border-[#3A4A9F] hover:shadow-md transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-extrabold ${step.badgeColor}`}
                >
                  {step.step}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6C7396]">
                  {step.tagline}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#141834] group-hover:text-[#26306A] transition-colors">
                {step.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#565C82]">
                {step.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#EDEFF6] flex items-center justify-between text-[11px] font-semibold text-[#3A4A9F]">
              <span>Step {step.step} in loop</span>
              <span className="text-[#98A2C8]">→</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
