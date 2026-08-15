"use client";

import { useState, useMemo } from "react";
import type { LibraryRubric } from "@/lib/rubric-library-types";
import type { Rubric } from "@/lib/types";

type ApplyMode = "replace" | "add";

/**
 * RubricPicker — modal/panel for selecting a library rubric to apply to a question.
 *
 * Shows rubrics grouped by course with search, preview, and "Use this rubric" action.
 * The caller receives a COPY of the criteria (snapshot), not a reference.
 * If currentCriteria exist, shows add/replace choice.
 */
export default function RubricPicker({
  rubrics,
  currentCriteria = [],
  onSelect,
  onClose,
}: {
  rubrics: LibraryRubric[];
  currentCriteria?: Rubric[];
  onSelect: (criteria: Rubric[]) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("");
  const [preview, setPreview] = useState<LibraryRubric | null>(null);
  const [applyMode, setApplyMode] = useState<ApplyMode>("replace");

  const courses = useMemo(
    () => [...new Set(rubrics.map((r) => r.course))].sort(),
    [rubrics]
  );

  const filtered = useMemo(() => {
    let list = rubrics;
    if (courseFilter) list = list.filter((r) => r.course === courseFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) => r.name.toLowerCase().includes(q) || r.course.toLowerCase().includes(q)
      );
    }
    return list;
  }, [rubrics, courseFilter, search]);

  const hasExistingCriteria = currentCriteria.length > 0;

  function criteriaMatch(a: Rubric, b: Rubric): boolean {
    return (
      a.name.trim().toLowerCase() === b.name.trim().toLowerCase() &&
      a.description.trim().toLowerCase() === b.description.trim().toLowerCase() &&
      a.maxMarks === b.maxMarks
    );
  }

  function applyRubric(rubric: LibraryRubric) {
    // SNAPSHOT: deep copy of criteria
    const snapshot = rubric.criteria.map((c) => ({ ...c }));

    if (applyMode === "replace" || !hasExistingCriteria) {
      onSelect(snapshot);
    } else {
      // Add mode: merge, avoiding exact duplicates
      const merged = [...currentCriteria];
      for (const newCrit of snapshot) {
        const isDuplicate = merged.some((existing) => criteriaMatch(existing, newCrit));
        if (!isDuplicate) {
          merged.push(newCrit);
        }
      }
      onSelect(merged);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="relative max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-[#D5DAEC] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EDEFF6] px-5 py-4">
          <h2 className="text-lg font-bold text-[#141834]">Rubric Library</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-[#565C82] hover:bg-[#EDEFF6]"
          >
            ✕
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 border-b border-[#EDEFF6] px-5 py-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rubrics…"
            className="flex-1 rounded-lg border border-[#D5DAEC] px-3 py-2 text-sm focus:border-[#3A4A9F] focus:outline-none"
            id="rubric-picker-search"
          />
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="rounded-lg border border-[#D5DAEC] px-3 py-2 text-sm focus:border-[#3A4A9F] focus:outline-none"
            id="rubric-picker-course"
          >
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* List */}
        <div className="max-h-[50vh] overflow-y-auto px-5 py-3">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#565C82]">
              No rubrics found. Create rubrics in the Rubric Library page.
            </p>
          ) : preview ? (
            /* Preview mode */
            <div>
              <button
                onClick={() => setPreview(null)}
                className="mb-3 text-sm font-semibold text-[#3A4A9F] hover:underline"
              >
                ← Back to list
              </button>
              <div className="rounded-xl border border-[#D5DAEC] bg-[#F4F6FC] p-4">
                <h3 className="text-base font-bold text-[#141834]">{preview.name}</h3>
                <p className="text-xs text-[#565C82]">{preview.course}</p>
                {preview.description && (
                  <p className="mt-2 text-sm text-[#565C82]">{preview.description}</p>
                )}
                <div className="mt-3 space-y-2">
                  {preview.criteria.map((c, i) => (
                    <div key={i} className="rounded-lg bg-white p-2 text-sm">
                      <span className="font-semibold text-[#141834]">{c.name}</span>
                      <span className="ml-2 text-xs text-[#565C82]">({c.maxMarks} marks)</span>
                      {c.description && (
                        <p className="mt-0.5 text-xs text-[#565C82]">{c.description}</p>
                      )}
                    </div>
                  ))}
                </div>
                {/* Add/Replace choice */}
                {hasExistingCriteria && (
                  <div className="mt-3 rounded-lg border border-[#D5DAEC] bg-white p-3">
                    <p className="mb-2 text-xs font-semibold text-[#141834]">
                      This question already has {currentCriteria.length} criteria. How should this rubric be applied?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setApplyMode("replace")}
                        className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          applyMode === "replace"
                            ? "bg-[#26306A] text-white"
                            : "border border-[#D5DAEC] text-[#565C82] hover:bg-[#EDEFF6]"
                        }`}
                      >
                        Replace existing
                      </button>
                      <button
                        onClick={() => setApplyMode("add")}
                        className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          applyMode === "add"
                            ? "bg-[#26306A] text-white"
                            : "border border-[#D5DAEC] text-[#565C82] hover:bg-[#EDEFF6]"
                        }`}
                      >
                        Add criteria
                      </button>
                    </div>
                  </div>
                )}
                <div className="mt-4 flex justify-between">
                  <span className="text-xs text-[#565C82]">
                    {preview.criteria.length} criteria · {preview.criteria.reduce((s, c) => s + c.maxMarks, 0)} total marks
                  </span>
                  <button
                    onClick={() => applyRubric(preview)}
                    className="rounded-xl bg-[#26306A] px-5 py-2 text-sm font-bold text-white shadow hover:bg-[#3A4A9F]"
                  >
                    {hasExistingCriteria && applyMode === "add" ? "Add to question" : "Use this rubric"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* List mode */
            <div className="space-y-2">
              {filtered.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-[#EDEFF6] bg-white p-3 hover:border-[#3A4A9F]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#141834]">{r.name}</p>
                    <p className="text-xs text-[#565C82]">
                      {r.course} · {r.criteria.length} criteria · {r.criteria.reduce((s, c) => s + c.maxMarks, 0)} marks
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreview(r)}
                      className="rounded-lg border border-[#D5DAEC] px-3 py-1.5 text-xs font-semibold text-[#3A4A9F] hover:bg-[#E9ECF9]"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => applyRubric(r)}
                      className="rounded-lg bg-[#26306A] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#3A4A9F]"
                    >
                      Use
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
