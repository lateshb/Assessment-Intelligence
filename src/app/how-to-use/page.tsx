import Link from "next/link";

export const metadata = { title: "How to use — Assessment Intelligence" };

const steps = [
  {
    n: "1",
    t: "Enter the assessment",
    d: "Type the exam question and define 2–5 rubric criteria — each with a name, what full marks looks like, and max marks. The rubric is what the AI classifies against, so sharper criteria give sharper diagnosis.",
  },
  {
    n: "2",
    t: "Add student responses",
    d: "Paste responses (one per line, or separate long answers with a line containing ---), or upload a CSV with columns id,response. Minimum 5, tested up to 50. Or click Load demo data for a curated 50-response economics batch.",
  },
  {
    n: "3",
    t: "Analyze",
    d: "One batched model call classifies every response by the belief behind it: Correct, Partially correct, Misconception, or Needs teacher review (anything under 60% confidence goes there automatically).",
  },
  {
    n: "4",
    t: "Read the diagnosis",
    d: "The summary chips show the class split. Misconception clusters name each wrong belief with verbatim evidence quotes and a confidence score. The learning-gap map shows % mastery per rubric criterion, flagging the critical gap.",
  },
  {
    n: "5",
    t: "Decide",
    d: "The AI proposes exactly one intervention with its rationale. You Approve, Modify, or Reject (with a reason). Every decision is logged. Draft marks exist in the detail table but are never final without you.",
  },
];

export default function HowToUse() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#B45309]">
        User guide
      </p>
      <h1 className="mt-1 text-3xl font-bold text-[#141834]">How to use this app</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#565C82]">
        Five steps from a pile of answer scripts to one approved teaching decision. A full run on 50
        responses takes about three minutes.
      </p>

      <ol className="mt-8 space-y-4">
        {steps.map((s) => (
          <li key={s.n} className="flex gap-4 rounded-2xl border border-[#D5DAEC] bg-white p-5 shadow-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5A623] text-lg font-bold text-[#141834]">
              {s.n}
            </span>
            <div>
              <h2 className="text-base font-bold text-[#141834]">{s.t}</h2>
              <p className="mt-1 text-sm leading-relaxed text-[#1D2140]">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-10 rounded-2xl border border-[#D5DAEC] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#26306A]">Input formats</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-[#F4F6FC] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#565C82]">Paste</p>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-[#1D2140]">{`PED is %ΔQd / %ΔP...
Elasticity means demand falls when...
---
A longer multi-line answer can sit
between --- separators like this.
---`}</pre>
          </div>
          <div className="rounded-xl bg-[#F4F6FC] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#565C82]">CSV</p>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-[#1D2140]">{`id,response
R01,"PED is the percentage change in..."
R02,"Elasticity is the slope of..."`}</pre>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-[#D5DAEC] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#26306A]">The 3-minute demo path</h2>
        <table className="mt-3 w-full text-left text-sm">
          <tbody>
            {[
              ["0:00", "Load demo data → Analyze. 50 real-looking answers on price elasticity."],
              ["0:30", "Summary chips: 18 correct, 21 partial, 11 misconception."],
              ["1:00", "Open the top cluster: 5 students confuse elasticity with absolute change — their own words as evidence, with a confidence score."],
              ["1:30", "Gap map: Interpretation is the critical gap at 43% mastery."],
              ["2:00", "Read the AI's single proposed intervention and its rationale."],
              ["2:30", "Click Approve: 32 of 50 students targeted instead of reteaching all 50. Decision logged. That decision is the product."],
            ].map(([t, d]) => (
              <tr key={t} className="border-t border-[#EDEFF6]">
                <td className="w-16 py-2 pr-3 font-mono text-xs font-bold text-[#B45309]">{t}</td>
                <td className="py-2 text-[#1D2140]">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-[#565C82]">
          Tip for presenters: add <code className="rounded bg-[#EDEFF6] px-1">?demo=1</code> to the
          URL to use the cached analysis and remove any dependency on live connectivity.
        </p>
      </section>

      <section className="mt-6 rounded-2xl bg-[#26306A] p-6 text-white">
        <h2 className="text-lg font-bold">What this app will never do</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#D4DAF2]">
          <li>• Finalise a mark. Every mark on screen is a draft until a teacher confirms it.</li>
          <li>• Act on a student. Interventions run only after explicit teacher approval.</li>
          <li>• Use demographic data. Only the response text is ever analysed.</li>
          <li>• Hide uncertainty. Confidence is shown everywhere; low confidence goes to human review.</li>
        </ul>
      </section>

      <p className="mt-8 text-sm">
        <Link href="/" className="font-semibold text-[#3A4A9F] hover:underline">
          ← Back to the app
        </Link>
        <span className="mx-2 text-[#D5DAEC]">·</span>
        <Link href="/build-and-scale" className="font-semibold text-[#3A4A9F] hover:underline">
          How it's built, and the path to production →
        </Link>
      </p>
    </main>
  );
}
