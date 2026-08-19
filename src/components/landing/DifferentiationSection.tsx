"use client";

export default function DifferentiationSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:py-16" id="differentiation">
      <div className="text-center mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#B45309]">
          Why This Is Different
        </p>
        <h2 className="mt-1 text-2xl font-bold text-[#141834] sm:text-3xl">
          From simple scores to targeted teaching
        </h2>
        <p className="mt-2 text-sm text-[#565C82] max-w-2xl mx-auto">
          Most grading tools stop after giving a numerical score. Assessment Intelligence uncovers
          why students got it wrong, turning grading into immediate classroom action.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Traditional Workflow Card */}
        <div className="rounded-2xl border border-[#D5DAEC] bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-3">
              Traditional Grading
            </div>
            <h3 className="text-lg font-bold text-[#141834]">
              Grades recorded, reasons lost
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#565C82]">
              Standard tools calculate a score (e.g. 3/6) and close the gradebook. Teachers are left guessing which specific concepts were misunderstood.
            </p>

            {/* Traditional Pipeline Diagram */}
            <div className="mt-6 space-y-3 rounded-xl bg-[#F4F6FC] p-4 border border-[#E4E7F5]">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>1. Collect Student Answers</span>
                <span className="text-slate-400">→</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>2. Calculate Scores (e.g. 3/6)</span>
                <span className="text-slate-400">→</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-rose-700">
                <span>3. Process Ends (No Action Plan)</span>
                <span>🛑</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#EDEFF6] text-xs text-[#6C7396]">
            Outcome: Either you reteach the entire class unnecessarily, or misconceptions go unresolved.
          </div>
        </div>

        {/* Assessment Intelligence Workflow Card */}
        <div className="rounded-2xl border-2 border-[#26306A] bg-gradient-to-br from-white to-[#F4F6FC] p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#E9ECF9] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#26306A] mb-3">
              Assessment Intelligence
            </div>
            <h3 className="text-lg font-bold text-[#26306A]">
              Misconceptions diagnosed, decisions enabled
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#565C82]">
              Every answer is checked for the root misunderstanding. You get a clear map of class gaps and a ready-to-use 15-minute lesson plan to fix it.
            </p>

            {/* AI Pipeline Diagram */}
            <div className="mt-6 space-y-2.5 rounded-xl bg-white p-4 border border-[#D5DAEC] shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-[#141834]">
                <span>1. Read Student Answers</span>
                <span className="text-[#3A4A9F]">→</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#141834]">
                <span>2. Map Learning Gaps</span>
                <span className="text-[#3A4A9F]">→</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#141834]">
                <span>3. Group Similar Mistakes</span>
                <span className="text-[#3A4A9F]">→</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#141834]">
                <span>4. Recommend 15-Min Mini-Lesson</span>
                <span className="text-[#3A4A9F]">→</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-[#0E7C71]">
                <span>5. Teacher Approves &amp; Teaches</span>
                <span>✓</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#D5DAEC] text-xs font-semibold text-[#0E7C71]">
            Outcome: You help the 32 students who need it in a focused 15-minute review.
          </div>
        </div>
      </div>
    </section>
  );
}
