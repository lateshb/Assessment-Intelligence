"use client";

export default function ProductVisualSection() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-8 md:py-12" id="product-preview">
      {/* Header framing */}
      <div className="text-center mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#B45309]">
          Product Preview
        </p>
        <h2 className="mt-1 text-2xl font-bold text-[#141834] sm:text-3xl">
          From a batch of student responses to an actionable teaching decision.
        </h2>
        <p className="mt-2 text-sm text-[#565C82] max-w-2xl mx-auto">
          See how raw open-text answers transform into precise learning gaps, misconception clusters,
          and a concrete 15-minute intervention plan.
        </p>
      </div>

      {/* Realistic Product UI Container */}
      <div className="overflow-hidden rounded-2xl border border-[#C3CAEC] bg-white shadow-xl">
        {/* Mock App Window Top Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#D5DAEC] bg-[#1E2656] px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-400 opacity-80" />
              <div className="h-3 w-3 rounded-full bg-amber-400 opacity-80" />
              <div className="h-3 w-3 rounded-full bg-green-400 opacity-80" />
            </div>
            <div className="h-4 w-px bg-white/20" />
            <span className="text-xs font-semibold text-white">
              Assessment: Economics 101 — Price Elasticity of Demand
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-md bg-white/10 px-2.5 py-0.5 text-xs font-medium text-[#F5A623]">
              50 Student Responses
            </span>
            <span className="rounded-md bg-[#0E7C71]/80 px-2.5 py-0.5 text-xs font-semibold text-white">
              ✓ Analysis Complete
            </span>
          </div>
        </div>

        {/* Product Visual Inner Layout */}
        <div className="p-4 sm:p-6 lg:p-8 bg-[#F4F6FC]/60 space-y-6">
          {/* Top Row: Input Snippet & Class Diagnosis Summary */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left: Input context */}
            <div className="lg:col-span-5 rounded-xl border border-[#D5DAEC] bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#EDEFF6] pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#26306A]">
                  Question &amp; Sample Inputs
                </span>
                <span className="text-[11px] font-medium text-[#565C82]">Batch: 50 Responses</span>
              </div>
              <p className="mt-2.5 text-xs font-medium text-[#141834] bg-[#F4F6FC] p-2.5 rounded-lg border border-[#E4E7F5]">
                &quot;Explain price elasticity of demand. Illustrate your answer with an example.&quot;
              </p>

              {/* Sample Response Cards */}
              <div className="mt-3 space-y-2">
                <div className="rounded-lg border border-[#EDEFF6] bg-white p-2.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-[#6C7396] mb-1">
                    <span className="font-mono font-bold text-[#26306A]">R03</span>
                    <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                      Misconception
                    </span>
                  </div>
                  <p className="text-[#1D2140] line-clamp-2">
                    &quot;If price increases by Rs 10 and demand falls by 50 units, then elasticity is 50 units.&quot;
                  </p>
                </div>

                <div className="rounded-lg border border-[#EDEFF6] bg-white p-2.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-[#6C7396] mb-1">
                    <span className="font-mono font-bold text-[#26306A]">R15</span>
                    <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                      Misconception
                    </span>
                  </div>
                  <p className="text-[#1D2140] line-clamp-2">
                    &quot;Elasticity is the slope of the demand curve; a steeper demand curve always means more elastic demand.&quot;
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Diagnosis Category Split & Learning Gap Map */}
            <div className="lg:col-span-7 space-y-4">
              {/* Category Split Chips */}
              <div className="rounded-xl border border-[#D5DAEC] bg-white p-4 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-[#26306A] block mb-3">
                  AI Diagnosis Split (50 Submissions)
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-[#E6F7F5] border border-[#0E7C71]/30 p-2.5">
                    <div className="text-xl font-extrabold text-[#0E7C71]">18</div>
                    <div className="text-[11px] font-bold text-[#0E7C71]">Correct (36%)</div>
                  </div>
                  <div className="rounded-lg bg-[#FEF7EA] border border-[#F5A623]/40 p-2.5">
                    <div className="text-xl font-extrabold text-[#B45309]">21</div>
                    <div className="text-[11px] font-bold text-[#B45309]">Partial (42%)</div>
                  </div>
                  <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5">
                    <div className="text-xl font-extrabold text-rose-700">11</div>
                    <div className="text-[11px] font-bold text-rose-700">Misconception (22%)</div>
                  </div>
                </div>
              </div>

              {/* Learning Gap Map */}
              <div className="rounded-xl border border-[#D5DAEC] bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#26306A]">
                    Learning-Gap Map (% Criterion Mastery)
                  </span>
                  <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-rose-800">
                    1 Critical Gap Flagged
                  </span>
                </div>
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-[#141834]">Definition</span>
                      <span className="font-bold text-[#26306A]">66% mastery</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#EDEFF6]">
                      <div className="h-2 rounded-full bg-[#3A4A9F]" style={{ width: "66%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-[#141834]">Application</span>
                      <span className="font-bold text-[#26306A]">52% mastery</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#EDEFF6]">
                      <div className="h-2 rounded-full bg-[#F5A623]" style={{ width: "52%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-rose-900 font-bold">Interpretation (Critical Gap)</span>
                      <span className="font-bold text-rose-700">43% mastery</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#EDEFF6]">
                      <div className="h-2 rounded-full bg-rose-600" style={{ width: "43%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Dominant Misconception Cluster & Actionable Recommendation */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Misconception Cluster Card */}
            <div className="lg:col-span-6 rounded-xl border border-rose-200 bg-white p-4 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-block rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800">
                    Dominant Misconception Cluster (5 Students)
                  </span>
                  <h3 className="mt-1 text-sm font-bold text-[#141834]">
                    Confuses elasticity with absolute change in quantity
                  </h3>
                </div>
                <span className="rounded-full bg-[#E9ECF9] px-2 py-0.5 text-[11px] font-bold text-[#26306A]">
                  86% conf
                </span>
              </div>
              <p className="mt-2 text-xs text-[#565C82] leading-relaxed">
                Students compute elasticity using raw units or currency instead of percentage changes.
              </p>
              <div className="mt-2.5 rounded-lg bg-rose-50/70 p-2 text-xs text-rose-900 border border-rose-100">
                <span className="font-bold">Verbatim Evidence (R19):</span> &quot;PED = fall in demand divided by rise in price = 40 units / Rs 5 = 8.&quot;
              </div>
            </div>

            {/* AI Recommendation & Teacher Decision Card */}
            <div className="lg:col-span-6 rounded-xl border-2 border-[#0E7C71]/40 bg-gradient-to-br from-white to-[#E6F7F5]/30 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0E7C71]">
                  AI Recommended Intervention
                </span>
                <span className="rounded-full bg-[#0E7C71] px-2.5 py-0.5 text-[11px] font-bold text-white">
                  15 min session
                </span>
              </div>
              <h3 className="mt-1 text-sm font-bold text-[#141834]">
                Targeted revision session: interpreting percentage-based elasticity
              </h3>
              <p className="mt-1.5 text-xs text-[#565C82]">
                Targeting <strong className="text-[#141834]">32 students</strong> with partial understanding or active misconception.
              </p>

              {/* Teacher Decision Status */}
              <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#D5DAEC] pt-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0E7C71]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0E7C71] text-white text-[10px]">
                    ✓
                  </span>
                  <span>Decision: Approved by Teacher</span>
                </div>
                <div className="flex gap-1.5 text-xs">
                  <span className="rounded-md border border-[#D5DAEC] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#565C82]">
                    Modify
                  </span>
                  <span className="rounded-md border border-[#D5DAEC] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#565C82]">
                    Reject
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
