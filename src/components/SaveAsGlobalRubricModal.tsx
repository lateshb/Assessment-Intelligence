"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRubricLibrary, validateLibraryRubric } from "@/lib/use-rubric-library";
import type { RubricVisibility } from "@/lib/rubric-library-types";
import type { Rubric } from "@/lib/types";
import CourseSelector from "./CourseSelector";

export function deriveRubricName(questionText: string): string {
  const trimmed = questionText.trim();
  if (!trimmed) return "New Global Rubric";

  const firstLine = trimmed.split("\n")[0].trim();
  const cleaned = firstLine.replace(/[.:!?]+$/, "");

  if (cleaned.length <= 40) {
    return `${cleaned} — Assessment Rubric`;
  }

  const words = cleaned.slice(0, 40).split(" ");
  if (words.length > 1) words.pop();
  return `${words.join(" ")}… — Assessment Rubric`;
}

export function canSaveAsGlobalRubric(criteria: Rubric[]): boolean {
  if (!criteria || criteria.length < 2 || criteria.length > 5) return false;
  return criteria.every(
    (c) => Boolean(c.name.trim()) && typeof c.maxMarks === "number" && c.maxMarks >= 1
  );
}

export function getRubricSaveDisabledReason(criteria: Rubric[]): string | null {
  if (!criteria || criteria.length === 0) return "Rubric is empty.";
  if (criteria.length < 2) return "Rubric must have at least 2 criteria.";
  if (criteria.length > 5) return "Rubric cannot have more than 5 criteria.";
  if (criteria.some((c) => !c.name.trim())) return "Every criterion must have a name.";
  if (criteria.some((c) => !c.maxMarks || c.maxMarks < 1)) return "Every criterion must have at least 1 mark.";
  return null;
}

export default function SaveAsGlobalRubricModal({
  questionText,
  criteria,
  onClose,
}: {
  questionText: string;
  criteria: Rubric[];
  onClose: () => void;
}) {
  const { rubrics, institutionRubrics, error: libraryError, dispatch } = useRubricLibrary();

  const existingCourses = useMemo(() => {
    const set = new Set<string>();
    [...rubrics, ...institutionRubrics].forEach((r) => {
      if (r.course && r.course.trim()) {
        set.add(r.course.trim());
      }
    });
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [rubrics, institutionRubrics]);

  const [formName, setFormName] = useState(() => deriveRubricName(questionText));
  const [formCourse, setFormCourse] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formVisibility, setFormVisibility] = useState<RubricVisibility>("private");
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const totalMarks = criteria.reduce((sum, c) => sum + (Number(c.maxMarks) || 0), 0);

  async function handleSave() {
    const validationError = validateLibraryRubric({
      name: formName,
      course: formCourse,
      criteria,
    });

    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setIsSaving(true);
    setSubmitError(null);

    // Deep copy criteria to ensure snapshot independence
    const criteriaSnapshot = criteria.map((c) => ({
      name: c.name,
      description: c.description,
      maxMarks: Number(c.maxMarks) || 1,
    }));

    try {
      const success = await dispatch({
        type: "CREATE_RUBRIC",
        rubric: {
          name: formName.trim(),
          course: formCourse.trim(),
          description: formDescription.trim(),
          criteria: criteriaSnapshot,
          visibility: formVisibility,
        },
      });

      if (success !== false) {
        setIsSuccess(true);
      } else {
        setSubmitError(libraryError || "Failed to save rubric to Global Library.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setSubmitError(msg);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-rubric-title"
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#D5DAEC] bg-white shadow-xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EDEFF6] px-6 py-4">
          <div>
            <h2 id="save-rubric-title" className="text-lg font-bold text-[#141834]">
              Save as Global Rubric
            </h2>
            <p className="text-xs text-[#565C82]">
              Save the current rubric criteria as a reusable template.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-semibold text-[#565C82] hover:bg-[#EDEFF6]"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="space-y-4 text-center py-2" id="save-rubric-success-state">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E4F5F3] text-2xl text-[#0E7C71]">
                ✓
              </div>
              <div>
                <h3 className="text-base font-bold text-[#141834]">
                  ✓ Rubric saved to Global Rubrics
                </h3>
                <p className="mt-1 text-xs text-[#565C82]">
                  This rubric is now available in your Global Rubric Library to reuse across assessments.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="rounded-xl border border-[#D5DAEC] px-4 py-2 text-xs font-semibold text-[#565C82] hover:bg-[#EDEFF6]"
                >
                  Done
                </button>
                <Link
                  href="/rubric-library"
                  className="rounded-xl bg-[#26306A] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#3A4A9F]"
                  id="view-global-rubrics-link"
                >
                  View Global Rubrics
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {(submitError || libraryError) && (
                <div
                  className="rounded-xl border border-[#E4572E] bg-[#FBE9E3] p-3 text-xs font-medium text-[#B23A1B]"
                  id="save-rubric-error-msg"
                >
                  {submitError || libraryError}
                </div>
              )}

              <div>
                <label
                  htmlFor="global-rubric-name"
                  className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#565C82]"
                >
                  Rubric name *
                </label>
                <input
                  id="global-rubric-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Price Elasticity — Assessment Rubric"
                  className="w-full rounded-lg border border-[#D5DAEC] px-3 py-2 text-sm text-[#141834] focus:border-[#3A4A9F] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="global-rubric-course"
                  className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#565C82]"
                >
                  Course *
                </label>
                <CourseSelector
                  id="global-rubric-course"
                  existingCourses={existingCourses}
                  value={formCourse}
                  onChange={(course) => {
                    setFormCourse(course);
                    if (submitError) setSubmitError(null);
                  }}
                  error={Boolean(submitError && submitError.includes("Course"))}
                />
              </div>

              <div>
                <label
                  htmlFor="global-rubric-description"
                  className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#565C82]"
                >
                  Description (optional)
                </label>
                <textarea
                  id="global-rubric-description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="Brief context for when to use this rubric"
                  className="w-full rounded-lg border border-[#D5DAEC] px-3 py-2 text-sm text-[#141834] focus:border-[#3A4A9F] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="global-rubric-visibility"
                  className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#565C82]"
                >
                  Visibility
                </label>
                <select
                  id="global-rubric-visibility"
                  value={formVisibility}
                  onChange={(e) => setFormVisibility(e.target.value as RubricVisibility)}
                  className="w-full rounded-lg border border-[#D5DAEC] px-3 py-2 text-sm text-[#141834] focus:border-[#3A4A9F] focus:outline-none"
                >
                  <option value="private">Private (only I can see this)</option>
                  <option value="institution">
                    Institution (teachers in my institution can see this)
                  </option>
                </select>
              </div>

              {/* Summary */}
              <div className="rounded-xl bg-[#F4F6FC] px-4 py-2.5 text-xs font-semibold text-[#565C82]">
                {criteria.length} criteria · {totalMarks} total marks
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-[#565C82] hover:bg-[#EDEFF6] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-xl bg-[#26306A] px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#3A4A9F] disabled:opacity-50 flex items-center gap-2"
                  id="submit-save-global-rubric-btn"
                >
                  {isSaving ? "Saving…" : "Save Global Rubric"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
