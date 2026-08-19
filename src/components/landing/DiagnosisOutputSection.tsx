"use client";

export default function DiagnosisOutputSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:py-16" id="diagnosis">
      <div className="text-center mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#B45309]">
          The Core Value
        </p>
        <h2 className="mt-1 text-2xl font-bold text-[#141834] sm:text-3xl">
          What the teacher gets after clicking Analyze
        </h2>
        <p className="mt-2 text-sm text-[#565C82] max-w-2xl mx-auto">
          Clear, structured diagnostic outputs based on real demo metrics — zero black-box numbers.
        </p>
      </div>

      {/* Output Breakdown Stack */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Class Diagnosis */}
        <div className="rounded-2xl border border-[#D5DAEC] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#3A4A9F]">
            <span>01 · Class Diagnosis</span>
            <span className="rounded bg-[#E9ECF9] px-2 py-0.5 text-[#26306A]">Full Batch</span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-[#141834]">50</div>
            <p className="text-xs font-semibold text-[#565C82]">Responses Analyzed</p>
          </div>
          <div className="mt-4 space-y-2 border-t border-[#EDEFF6] pt-3 text-xs text-[#1D2140]">
            <div className="flex justify-between">
              <span>Correct responses:</span>
              <strong className="text-[#0E7C71]">18 (36%)</strong>
            </div>
            <div className="flex justify-between">
              <span>Partial understanding:</span>
              <strong className="text-[#B45309]">21 (42%)</strong>
            </div>
            <div className="flex justify-between">
              <span>Active misconceptions:</span>
              <strong className="text-rose-700">11 (22%)</strong>
            </div>
          </div>
        </div>

        {/* Card 2: Primary Learning Gap */}
        <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-rose-800">
            <span>02 · Primary Gap</span>
            <span className="rounded bg-rose-100 px-2 py-0.5 text-rose-800 font-bold">Critical</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-rose-900">Interpretation</div>
            <p className="text-xs font-bold text-rose-700 mt-0.5">43% Class Mastery</p>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[#565C82] border-t border-[#EDEFF6] pt-3">
            Students struggle to explain what elasticity implies in real terms (responsiveness, determinants, pricing power) compared to rote formula definition (66% mastery).
          </p>
        </div>

        {/* Card 3: Misconception Cluster */}
        <div className="rounded-2xl border border-[#D5DAEC] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#3A4A9F]">
            <span>03 · Misconception Cluster</span>
            <span className="rounded bg-[#EDEFF6] px-2 py-0.5 text-[#26306A]">Top Pattern</span>
          </div>
          <div className="mt-4">
            <h3 className="text-base font-bold text-[#141834]">
              Confuses elasticity with absolute change
            </h3>
            <p className="text-xs text-[#565C82] mt-1">
              Computes raw units or currency instead of percentage changes.
            </p>
          </div>
          <div className="mt-3 rounded-lg bg-[#F4F6FC] p-2.5 text-xs text-[#1D2140] border border-[#E4E7F5]">
            <span className="font-semibold text-[#26306A]">Verbatim Evidence (R03):</span>
            <p className="italic text-[#565C82] mt-0.5">
              &quot;If price increases by Rs 10 and demand falls by 50 units, then elasticity is 50 units.&quot;
            </p>
          </div>
        </div>

        {/* Card 4: Affected Students */}
        <div className="rounded-2xl border border-[#D5DAEC] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#3A4A9F]">
            <span>04 · Affected Students</span>
            <span className="rounded bg-[#E9ECF9] px-2 py-0.5 text-[#26306A]">Target Group</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-[#141834]">5 Students in Core Cluster</div>
            <p className="text-xs text-[#565C82] mt-0.5">+ 27 partial-mastery students</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#EDEFF6] pt-3">
            {["R03", "R10", "R19", "R27", "R36"].map((id) => (
              <span
                key={id}
                className="rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 font-mono text-xs font-bold text-rose-800"
              >
                {id}
              </span>
            ))}
            <span className="rounded-md bg-[#EDEFF6] px-2 py-0.5 text-xs font-medium text-[#565C82]">
              + 27 others for revision
            </span>
          </div>
        </div>

        {/* Card 5: Recommended Action */}
        <div className="rounded-2xl border border-[#0E7C71]/40 bg-[#E6F7F5]/30 p-6 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#0E7C71]">
            <span>05 · Recommended Action</span>
            <span className="rounded bg-[#0E7C71] px-2 py-0.5 text-white font-bold">15 min</span>
          </div>
          <div className="mt-4">
            <h3 className="text-base font-bold text-[#141834]">
              Targeted revision session on percentage interpretation
            </h3>
            <p className="mt-1 text-xs text-[#565C82]">
              One worked contrast (units vs. percentages) directly addresses the dominant misconception.
            </p>
          </div>
          <div className="mt-3 border-t border-[#0E7C71]/20 pt-3 text-xs text-[#0E7C71] font-semibold">
            ✓ 32 students targeted instead of reteaching entire class of 50
          </div>
        </div>

        {/* Card 6: Teacher Decision */}
        <div className="rounded-2xl border border-[#26306A] bg-[#26306A] p-6 text-white shadow-md">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#F5A623]">
            <span>06 · Teacher Decision</span>
            <span className="rounded bg-white/20 px-2 py-0.5 text-white">Logged</span>
          </div>
          <div className="mt-4">
            <div className="inline-flex items-center gap-2 rounded-lg bg-[#0E7C71] px-3 py-1.5 text-xs font-bold text-white">
              <span>✓ Approved by Faculty</span>
            </div>
            <p className="mt-2 text-xs text-[#C3CAEC] leading-relaxed">
              Intervention scheduled for next lecture. Decision timestamped and saved into Analysis History.
            </p>
          </div>
          <div className="mt-4 flex gap-2 border-t border-white/10 pt-3 text-[11px] text-[#C3CAEC]">
            <span>Options:</span>
            <span className="font-semibold text-white">Approve</span>
            <span>·</span>
            <span className="font-semibold text-white">Modify</span>
            <span>·</span>
            <span className="font-semibold text-white">Reject</span>
          </div>
        </div>
      </div>
    </section>
  );
}
