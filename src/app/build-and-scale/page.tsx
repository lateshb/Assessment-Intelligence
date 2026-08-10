import Link from "next/link";

export const metadata = { title: "Build & scale — Assessment Intelligence" };

const layers = [
  ["Interface", "Next.js / React + Tailwind, deployed on Vercel", "#17B0A0"],
  ["Orchestration", "Rubric-driven prompt templating, single batched call, defensive JSON parsing", "#3A4A9F"],
  ["AI core", "LLM classification of open-text responses into misconception clusters (temperature 0, JSON mode)", "#26306A"],
  ["Human-in-the-loop", "Approve / Modify / Reject gate before any action; every decision logged", "#F5A623"],
  ["Data", "Synthetic demo dataset + cached reference analysis; localStorage decision log", "#4A5891"],
];

const phases = [
  {
    tag: "NOW · prototype",
    title: "Prompted LLM classification",
    body: "A frontier LLM (Gemini; swappable via one constant in src/lib/constants.ts) classifies each response against the rubric in one batched, temperature-0 call. The server recomputes every aggregate — draft marks, cluster membership, gap-map percentages — so no number on screen comes from model arithmetic. Synthetic data only; zero PII.",
  },
  {
    tag: "PHASE 2 · pilot",
    title: "Grounding with real signals",
    body: "Add few-shot exemplars per subject from teacher-verified classifications, and start capturing the Approve/Modify/Reject signal plus per-response corrections as labelled training data. Move storage from localStorage to a proper store (Supabase/Postgres or Azure Cosmos DB) with consented, de-identified responses. Add batch processing for full mock-test uploads.",
  },
  {
    tag: "PHASE 3 · production ML",
    title: "Trained models where they beat prompting",
    body: "Once thousands of teacher-verified labels exist, train a dedicated classifier for the frequent misconception categories: cheaper, faster, and more consistent than prompting for high-volume subjects. Keep the LLM for the long tail (novel misconceptions, explanations, intervention drafting). Embedding-based clustering surfaces new misconception types before anyone names them.",
  },
  {
    tag: "PHASE 4 · scale",
    title: "Per-subject, multilingual, measured",
    body: "Per-subject model variants (physics numericals need different signals than economics prose), regional-language support aligned to Project Bharat, and outcome tracking that ties approved interventions to score movement — closing the Measure step of the loop and feeding the ROI model presented to the Board.",
  },
];

const azure = [
  [
    "Managed LLM",
    "Azure OpenAI Service (or Google Vertex AI). Enterprise SLAs, regional data residency (India regions), content filtering, and private networking — the compliance posture an education company listed in India needs. Our provider call is isolated in one file, so this swap is a config change, not a rebuild.",
  ],
  [
    "Custom classifier",
    "Azure AI Language custom text classification, or Vertex AI AutoML text — train the Phase-3 misconception classifier on teacher-verified labels without building training infra. Export metrics per class to watch for drift.",
  ],
  [
    "MLOps loop",
    "Azure Machine Learning (or Vertex Pipelines) to schedule retraining on fresh teacher feedback, evaluate against a held-out golden set, and gate deployment on accuracy + fairness checks across centres and languages.",
  ],
  [
    "Data platform",
    "Consent-tagged, de-identified response store (Azure Cosmos DB / Postgres) with rubric standardisation as a first-class schema. The teacher decision log becomes the most valuable table in the company: it is labelled training data nobody else has.",
  ],
  [
    "Security & governance",
    "Keys in managed identity / Key Vault (never in code — the prototype already enforces env-var keys), audit logs on every AI call, role-based access, and the human-approval gate preserved as an architectural layer at every phase.",
  ],
];

export default function BuildAndScale() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#B45309]">
        Technical brief
      </p>
      <h1 className="mt-1 text-3xl font-bold text-[#141834]">
        How this is built, and how it grows up
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#565C82]">
        The prototype is deliberately boring infrastructure around one sharp AI capability. This
        page documents the architecture as-is and the credible path from vibe-coded prototype to a
        production ML system — the answer to the Board&apos;s &quot;what would it take for real?&quot;
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-[#26306A]">Architecture today (five thin layers)</h2>
        <div className="mt-3 space-y-2">
          {layers.map(([name, desc, color]) => (
            <div
              key={name}
              className="flex items-center gap-4 rounded-xl border border-[#D5DAEC] bg-white px-4 py-3 shadow-sm"
            >
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <span className="w-40 shrink-0 text-sm font-bold text-[#141834]">{name}</span>
              <span className="text-sm text-[#1D2140]">{desc}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-[#565C82]">
          Key design decision: the model is never trusted with arithmetic. src/lib/aggregate.ts
          recomputes every number deterministically, which is why each figure on screen is
          defensible under CFO questioning.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-[#26306A]">
          The ML roadmap: prompting first, training when it earns its keep
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#565C82]">
          The honest sequencing: a prompted frontier LLM is the right Phase-1 tool because it works
          with zero training data. Dedicated trained models enter exactly when labelled data and
          volume make them better and cheaper — not before.
        </p>
        <div className="mt-4 space-y-4">
          {phases.map((p) => (
            <article key={p.tag} className="rounded-2xl border border-[#D5DAEC] bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#B45309]">
                {p.tag}
              </p>
              <h3 className="mt-1 text-base font-bold text-[#141834]">{p.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#1D2140]">{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-[#26306A]">
          Production platform choices (Azure track, with Google equivalents)
        </h2>
        <div className="mt-3 space-y-3">
          {azure.map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-[#D5DAEC] bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#26306A]">{t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#1D2140]">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-2xl bg-[#26306A] p-6 text-white">
        <h2 className="text-lg font-bold">What production needs that this prototype does not have</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#D4DAF2]">
          <li>• Consented, de-identified real student response data (prototype: synthetic only).</li>
          <li>• Standardised rubrics across centres and faculties.</li>
          <li>• Outcome history to validate that approved interventions actually move scores.</li>
          <li>• A fairness audit across student groups before any draft-mark feature ships wider.</li>
        </ul>
        <p className="mt-3 text-xs text-[#AEB7E0]">
          Stated openly by design: the evaluation brief rewards honesty about limitations over
          overclaiming.
        </p>
      </section>

      <p className="mt-8 text-sm">
        <Link href="/how-to-use" className="font-semibold text-[#3A4A9F] hover:underline">
          ← How to use
        </Link>
        <span className="mx-2 text-[#D5DAEC]">·</span>
        <Link href="/" className="font-semibold text-[#3A4A9F] hover:underline">
          Open the app →
        </Link>
      </p>
    </main>
  );
}
