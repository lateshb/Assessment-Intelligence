"use client";

import { useState } from "react";

interface Capability {
  id: string;
  tabLabel: string;
  pillar: string;
  title: string;
  icon: string;
  tagline: string;
  summary: string;
  bullets: string[];
  preview: {
    badge: string;
    badgeColor: string;
    headline: string;
    detail: string;
    metaLeft: string;
    metaRight: string;
  };
}

const capabilities: Capability[] = [
  {
    id: "build",
    tabLabel: "Multi-Question Setup",
    pillar: "01",
    title: "Flexible Multi-Question Authoring",
    icon: "📝",
    tagline: "Build & Organize",
    summary:
      "Create full exam assessments with custom questions, detailed rubric criteria, and instant response imports.",
    bullets: [
      "Add, edit, duplicate, or reorder questions with one click",
      "Set custom rubric criteria and max marks per question",
      "Paste student answers directly or upload batches via CSV",
      "Load the curated 50-student Economics demo in one click",
    ],
    preview: {
      badge: "Question 1 of 3 · Active",
      badgeColor: "bg-[#26306A] text-white",
      headline: "Explain price elasticity of demand with an example.",
      detail: "3 rubric criteria defined · 50 student answers imported via CSV.",
      metaLeft: "Status: Ready for Analysis",
      metaRight: "Batch: 50 Responses",
    },
  },
  {
    id: "rubrics",
    tabLabel: "Reusable Rubrics",
    pillar: "02",
    title: "Standardized Global Rubrics Library",
    icon: "📚",
    tagline: "Consistency & Speed",
    summary:
      "Maintain a centralized library of reusable grading rubrics across courses and apply them instantly to any question.",
    bullets: [
      "Create and store standardized rubrics by course and topic",
      "Apply library rubrics to questions with a single click",
      "Choose whether to merge with or replace question criteria",
      "Applied rubrics remain protected snapshots for future audit",
    ],
    preview: {
      badge: "Global Rubrics Library",
      badgeColor: "bg-[#3A4A9F] text-white",
      headline: "Economics Core: 3-Tier PED Diagnostic Rubric",
      detail: "Definition (2 pts) · Application (2 pts) · Real-world Interpretation (2 pts).",
      metaLeft: "Used in 12 Assessments",
      metaRight: "Snapshot Protected",
    },
  },
  {
    id: "analyze",
    tabLabel: "AI Misconception Engine",
    pillar: "03",
    title: "Deep Open-Text Diagnostic Analysis",
    icon: "⚡",
    tagline: "Beyond Right or Wrong",
    summary:
      "Analyzes open-text responses in a single batched run, pinpointing exact conceptual flaws and citing verbatim quotes.",
    bullets: [
      "Classifies answers into Correct, Partial, or Misconception",
      "Extracts exact sentences from student text as evidence",
      "Displays transparent AI confidence scores on every answer",
      "Generates draft marks without removing teacher supervision",
    ],
    preview: {
      badge: "Response R19 · Misconception",
      badgeColor: "bg-rose-100 text-rose-800",
      headline: "Confuses elasticity with raw price change",
      detail: 'Evidence quote: "PED = fall in demand / rise in price = 40 units / Rs 5 = 8."',
      metaLeft: "AI Confidence: 86%",
      metaRight: "Draft Mark: 1/6 pts",
    },
  },
  {
    id: "gaps",
    tabLabel: "Class Learning Gap Map",
    pillar: "04",
    title: "Visual Class-Wide Learning Gap Map",
    icon: "📊",
    tagline: "Instant Overview",
    summary:
      "Calculates class mastery per rubric criterion and clusters students who share the exact same conceptual mistake.",
    bullets: [
      "Visual bar charts showing class mastery percentage per criterion",
      "Automatic high-visibility flagging of critical learning gaps",
      "Misconception clusters with student counts and student IDs",
      "Know exactly which topic to review before your next lecture",
    ],
    preview: {
      badge: "Critical Gap Flagged",
      badgeColor: "bg-rose-100 text-rose-800",
      headline: "Interpretation Criterion: 43% Class Mastery",
      detail: "Definition: 66% · Application: 52% · Interpretation: 43% (Needs review).",
      metaLeft: "5 Students in Top Cluster",
      metaRight: "32 Total Needing Review",
    },
  },
  {
    id: "recommend",
    tabLabel: "15-Min Action Plans",
    pillar: "05",
    title: "Targeted Teaching Interventions",
    icon: "🎯",
    tagline: "Actionable Pedagogy",
    summary:
      "Recommends one concrete 15-minute classroom intervention focused precisely on the students who need it most.",
    bullets: [
      "Delivers a specific mini-lesson plan addressing the core gap",
      "Lists the exact subset of affected students needing support",
      "Saves hours of lesson planning with ready-to-use examples",
      "Reteach the struggling group without slowing down the rest",
    ],
    preview: {
      badge: "AI Recommendation · 15 Min",
      badgeColor: "bg-[#0E7C71] text-white",
      headline: "15-Min Focused Contrast: Units vs. Percentage Changes",
      detail: "Target: 32 students with active misconception or partial mastery.",
      metaLeft: "Intervention Type: Worked Example",
      metaRight: "Time: 15 Minutes",
    },
  },
  {
    id: "decide",
    tabLabel: "Teacher Decision Gate",
    pillar: "06",
    title: "Total Educator Control & Final Say",
    icon: "🔒",
    tagline: "Human in Control",
    summary:
      "Every grade and teaching intervention requires explicit teacher approval. Nothing acts on students automatically.",
    bullets: [
      "Choose to Approve, Modify, or Reject any recommendation",
      "Record custom teacher notes and instructional rationale",
      "Override draft scores or classifications whenever needed",
      "Full transparency with zero automated grading surprises",
    ],
    preview: {
      badge: "Decision Status · Logged",
      badgeColor: "bg-[#0E7C71] text-white",
      headline: "Decision: Approved by Teacher",
      detail: 'Teacher note: "Will execute 15-min percentage contrast during Wednesday tutorial."',
      metaLeft: "Logged to Cloud",
      metaRight: "Timestamp: 10:42 AM",
    },
  },
  {
    id: "history",
    tabLabel: "History & Re-Analysis",
    pillar: "07",
    title: "Complete Versioning & Audit Trail",
    icon: "⏳",
    tagline: "Traceable Progress",
    summary:
      "Access all past assessment runs, switch between analysis versions, and see how teaching interventions improve results.",
    bullets: [
      "Central history view of all active and archived assessments",
      "Switch between current and previous analysis runs seamlessly",
      "Staleness detection flags when questions or rubrics are edited",
      "Measure student learning growth across multiple assessments",
    ],
    preview: {
      badge: "Version 2 of 2 · Saved",
      badgeColor: "bg-[#26306A] text-white",
      headline: "Economics 101 Midterm — Re-analysis Run",
      detail: "Mastery increased from 43% to 78% after 15-minute remediation session.",
      metaLeft: "2 Analysis Versions",
      metaRight: "Saved in Cloud",
    },
  },
];

export default function CapabilitiesSection() {
  const [activeTab, setActiveTab] = useState<string>("build");

  const currentCap = capabilities.find((c) => c.id === activeTab) || capabilities[0];

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:py-16" id="capabilities">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#B45309]">
          Platform Capabilities
        </p>
        <h2 className="mt-1 text-2xl font-extrabold text-[#141834] sm:text-3xl lg:text-4xl">
          Everything you need to turn answers into teaching action
        </h2>
        <p className="mt-2 text-sm text-[#565C82] max-w-2xl mx-auto">
          Explore the core tools built to reduce manual grading effort and give you instant diagnostic clarity.
        </p>
      </div>

      {/* Modern Segmented Tab Bar */}
      <div className="mb-6 overflow-x-auto no-scrollbar pb-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-max mx-auto justify-start sm:justify-center p-1.5 bg-[#E9ECF9]/70 rounded-2xl border border-[#D5DAEC]">
          {capabilities.map((cap) => {
            const isActive = cap.id === activeTab;
            return (
              <button
                key={cap.id}
                type="button"
                onClick={() => setActiveTab(cap.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer touch-manipulation select-none ${
                  isActive
                    ? "bg-[#26306A] text-white shadow-md shadow-[#26306A]/20 scale-[1.02]"
                    : "text-[#26306A] hover:bg-white/80 hover:text-[#141834]"
                }`}
              >
                <span className="text-sm">{cap.icon}</span>
                <span>{cap.tabLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Display Card */}
      <div className="rounded-3xl border border-[#D5DAEC] bg-white p-6 sm:p-8 lg:p-10 shadow-sm transition-all">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Capability Overview */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E9ECF9] text-base">
                {currentCap.icon}
              </span>
              <span className="rounded-full bg-[#EDEFF6] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#3A4A9F]">
                Pillar {currentCap.pillar} · {currentCap.tagline}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-[#141834] tracking-tight">
              {currentCap.title}
            </h3>

            <p className="text-sm leading-relaxed text-[#565C82]">
              {currentCap.summary}
            </p>

            <div className="mt-4 pt-4 border-t border-[#EDEFF6]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#26306A] mb-3">
                Key Features &amp; Workflow:
              </h4>
              <ul className="grid sm:grid-cols-2 gap-2.5 text-xs text-[#1D2140]">
                {currentCap.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#E6F7F5] text-[10px] font-bold text-[#0E7C71] mt-0.5">
                      ✓
                    </span>
                    <span className="leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Live-Feel Product Preview Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-[#D5DAEC] bg-gradient-to-br from-[#F4F6FC] to-white p-5 sm:p-6 shadow-inner">
              <div className="flex items-center justify-between gap-2 border-b border-[#D5DAEC]/70 pb-3">
                <span
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${currentCap.preview.badgeColor}`}
                >
                  {currentCap.preview.badge}
                </span>
                <span className="text-[10px] font-semibold text-[#6C7396] uppercase tracking-wider">
                  Live Preview
                </span>
              </div>

              <div className="mt-4">
                <h5 className="text-sm font-bold text-[#141834] leading-snug">
                  {currentCap.preview.headline}
                </h5>
                <p className="mt-2 text-xs leading-relaxed text-[#565C82] bg-white rounded-xl p-3 border border-[#E4E7F5]">
                  {currentCap.preview.detail}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#D5DAEC]/70 pt-3 text-[11px] font-semibold text-[#3A4A9F]">
                <span>{currentCap.preview.metaLeft}</span>
                <span className="text-[#565C82] font-medium">{currentCap.preview.metaRight}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
