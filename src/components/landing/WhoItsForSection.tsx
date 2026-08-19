"use client";

const targetUsers = [
  {
    title: "University & Higher Ed Faculty",
    role: "Professors & Instructors",
    description:
      "Quickly diagnose conceptual stumbling blocks across large batches of open-ended midterm or quiz answers without spending days reading scripts manually.",
    icon: "🎓",
  },
  {
    title: "K-12 Subject Leads & Educators",
    role: "Secondary & High School Teachers",
    description:
      "Identify exactly which rubric criteria students struggle with before term exams, enabling immediate course-correction during weekly classroom hours.",
    icon: "🏫",
  },
  {
    title: "Coaching & Test-Prep Teams",
    role: "Academic Leads & Curriculum Specialists",
    description:
      "Map recurring misconception clusters across mock tests and generate targeted mini-lessons for specific student cohorts at scale.",
    icon: "📈",
  },
];

export default function WhoItsForSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:py-16" id="audience">
      <div className="text-center mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#B45309]">
          Target Audience
        </p>
        <h2 className="mt-1 text-2xl font-bold text-[#141834] sm:text-3xl">
          Purpose-built for educators and academic teams
        </h2>
        <p className="mt-2 text-sm text-[#565C82] max-w-2xl mx-auto">
          Assessment Intelligence is laser-focused on diagnostic analysis for teachers — not a student portal,
          all-purpose LMS, or administrative database.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {targetUsers.map((u) => (
          <div
            key={u.title}
            className="rounded-2xl border border-[#D5DAEC] bg-white p-6 shadow-xs hover:border-[#3A4A9F] transition-all"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E9ECF9] text-2xl mb-4">
              {u.icon}
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#3A4A9F]">
              {u.role}
            </span>
            <h3 className="mt-1 text-base font-bold text-[#141834]">
              {u.title}
            </h3>
            <p className="mt-2.5 text-xs leading-relaxed text-[#565C82]">
              {u.description}
            </p>
          </div>
        ))}
      </div>

      {/* Clear Scope Disclaimer Box */}
      <div className="mt-8 rounded-xl border border-[#D5DAEC] bg-[#F4F6FC] p-4 text-center text-xs text-[#6C7396]">
        <strong className="text-[#26306A]">Scope Definition:</strong> Built exclusively as a faculty decision-support platform. Does not replace your learning management system (LMS), student gradebook, or institutional SIS.
      </div>
    </section>
  );
}
