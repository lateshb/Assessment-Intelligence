"use client";

import { useState, useMemo } from "react";
import { useRubricLibrary, validateLibraryRubric } from "@/lib/use-rubric-library";
import type { LibraryRubric } from "@/lib/rubric-library-types";
import type { Rubric } from "@/lib/types";
import RubricEditor from "@/components/RubricEditor";

type Mode = "list" | "create" | "edit";
type RubricTab = "my" | "institution";

const EMPTY_CRITERIA: Rubric[] = [
  { name: "", description: "", maxMarks: 2 },
  { name: "", description: "", maxMarks: 2 },
];

export default function RubricLibraryPage() {
  const { rubrics, institutionRubrics, loading, error: dbError, dispatch } = useRubricLibrary();
  const [mode, setMode] = useState<Mode>("list");
  const [rubricTab, setRubricTab] = useState<RubricTab>("my");
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formCourse, setFormCourse] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCriteria, setFormCriteria] = useState<Rubric[]>(EMPTY_CRITERIA.map((c) => ({ ...c })));

  const activeList = rubricTab === "my" ? rubrics : institutionRubrics;

  const courses = useMemo(
    () => [...new Set(activeList.map((r) => r.course))].sort(),
    [activeList]
  );

  const filtered = useMemo(() => {
    let list = activeList;
    if (courseFilter) list = list.filter((r) => r.course === courseFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) => r.name.toLowerCase().includes(q) || r.course.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeList, courseFilter, search]);

  function resetForm() {
    setFormName("");
    setFormCourse("");
    setFormDescription("");
    setFormCriteria(EMPTY_CRITERIA.map((c) => ({ ...c })));
    setError(null);
    setEditId(null);
  }

  function openCreate() {
    resetForm();
    setMode("create");
  }

  function openEdit(rubric: LibraryRubric) {
    setFormName(rubric.name);
    setFormCourse(rubric.course);
    setFormDescription(rubric.description);
    setFormCriteria(rubric.criteria.map((c) => ({ ...c })));
    setEditId(rubric.id);
    setError(null);
    setMode("edit");
  }

  function handleSave() {
    const validationError = validateLibraryRubric({
      name: formName,
      course: formCourse,
      criteria: formCriteria,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    if (mode === "create") {
      dispatch({
        type: "CREATE_RUBRIC",
        rubric: {
          name: formName.trim(),
          course: formCourse.trim(),
          description: formDescription.trim(),
          criteria: formCriteria.map((c) => ({ ...c })),
        },
      });
    } else if (mode === "edit" && editId) {
      dispatch({
        type: "UPDATE_RUBRIC",
        id: editId,
        updates: {
          name: formName.trim(),
          course: formCourse.trim(),
          description: formDescription.trim(),
          criteria: formCriteria.map((c) => ({ ...c })),
        },
      });
    }

    resetForm();
    setMode("list");
  }

  function handleDelete(id: string) {
    if (confirm("Delete this rubric? This cannot be undone.")) {
      dispatch({ type: "DELETE_RUBRIC", id });
    }
  }

  function handleDuplicate(id: string) {
    dispatch({ type: "DUPLICATE_RUBRIC", id });
  }

  // ─── Create/Edit form ─────────────────────────────────────────────

  if (mode === "create" || mode === "edit") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <button
          onClick={() => { resetForm(); setMode("list"); }}
          className="mb-4 text-sm font-semibold text-[#3A4A9F] hover:underline"
        >
          ← Back to Rubric Library
        </button>

        <h1 className="text-2xl font-bold text-[#141834]">
          {mode === "create" ? "Create Rubric" : "Edit Rubric"}
        </h1>

        {error && (
          <div className="mt-4 rounded-xl border border-[#E4572E] bg-[#FBE9E3] px-4 py-3 text-sm font-medium text-[#B23A1B]">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-4 rounded-2xl border border-[#D5DAEC] bg-white p-5 shadow-sm">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#565C82]">
              Rubric name *
            </label>
            <input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Price Elasticity Assessment"
              className="w-full rounded-lg border border-[#D5DAEC] px-3 py-2 text-sm focus:border-[#3A4A9F] focus:outline-none"
              id="rubric-name"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#565C82]">
              Course *
            </label>
            <input
              value={formCourse}
              onChange={(e) => setFormCourse(e.target.value)}
              placeholder="e.g. Economics"
              className="w-full rounded-lg border border-[#D5DAEC] px-3 py-2 text-sm focus:border-[#3A4A9F] focus:outline-none"
              id="rubric-course"
              list="course-suggestions"
            />
            <datalist id="course-suggestions">
              {courses.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#565C82]">
              Description (optional)
            </label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={2}
              placeholder="Brief context for when to use this rubric"
              className="w-full rounded-lg border border-[#D5DAEC] px-3 py-2 text-sm focus:border-[#3A4A9F] focus:outline-none"
              id="rubric-description"
            />
          </div>

          <RubricEditor criteria={formCriteria} onChange={setFormCriteria} />

          <div className="flex justify-between pt-2">
            <span className="text-xs text-[#565C82]">
              {formCriteria.length} criteria · {formCriteria.reduce((s, c) => s + c.maxMarks, 0)} total marks
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => { resetForm(); setMode("list"); }}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-[#565C82] hover:bg-[#EDEFF6]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-xl bg-[#26306A] px-5 py-2 text-sm font-bold text-white shadow hover:bg-[#3A4A9F]"
                id="save-rubric-btn"
              >
                {mode === "create" ? "Create Rubric" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ─── List view ─────────────────────────────────────────────────────

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#B45309]">
            Rubric Library
          </p>
          <h1 className="text-2xl font-bold text-[#141834]">
            Reusable Rubrics
          </h1>
          <p className="mt-1 text-sm text-[#565C82]">
            Create and manage rubrics that can be applied to any assessment question.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-xl bg-[#26306A] px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-[#3A4A9F]"
          id="create-rubric-btn"
        >
          + Create Rubric
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search rubrics…"
          className="flex-1 rounded-lg border border-[#D5DAEC] bg-white px-3 py-2 text-sm focus:border-[#3A4A9F] focus:outline-none"
          id="rubric-search"
        />
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="rounded-lg border border-[#D5DAEC] bg-white px-3 py-2 text-sm focus:border-[#3A4A9F] focus:outline-none"
          id="rubric-course-filter"
        >
          <option value="">All courses ({activeList.length})</option>
          {courses.map((c) => (
            <option key={c} value={c}>
              {c} ({activeList.filter((r) => r.course === c).length})
            </option>
          ))}
        </select>
      </div>

      {/* Tabs: My Rubrics / Institution */}
      <div className="mb-4 flex gap-1 rounded-xl bg-[#EDEFF6] p-1 text-sm font-semibold">
        <button
          onClick={() => { setRubricTab("my"); setCourseFilter(""); }}
          className={`flex-1 rounded-lg px-3 py-1.5 ${
            rubricTab === "my" ? "bg-white text-[#26306A] shadow" : "text-[#565C82]"
          }`}
        >
          My Rubrics ({rubrics.length})
        </button>
        <button
          onClick={() => { setRubricTab("institution"); setCourseFilter(""); }}
          className={`flex-1 rounded-lg px-3 py-1.5 ${
            rubricTab === "institution" ? "bg-white text-[#26306A] shadow" : "text-[#565C82]"
          }`}
        >
          Institution Rubrics ({institutionRubrics.length})
        </button>
      </div>

      {/* DB error */}
      {dbError && (
        <div className="mb-4 rounded-xl border border-[#E4572E] bg-[#FBE9E3] px-4 py-3 text-sm font-medium text-[#B23A1B]">
          {dbError}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="rounded-2xl border border-[#D5DAEC] bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-[#565C82]">Loading rubrics…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#D5DAEC] bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-semibold text-[#141834]">No rubrics found</p>
          <p className="mt-1 text-sm text-[#565C82]">
            {search || courseFilter
              ? "Try adjusting your search or filter."
              : rubricTab === "institution"
                ? "No institution rubrics from other teachers yet."
                : "Create your first rubric to get started."}
          </p>
          {!search && !courseFilter && rubricTab === "my" && (
            <button
              onClick={openCreate}
              className="mt-4 rounded-xl bg-[#26306A] px-5 py-2 text-sm font-bold text-white shadow hover:bg-[#3A4A9F]"
            >
              + Create Rubric
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-[#D5DAEC] bg-white p-5 shadow-sm transition-all hover:border-[#3A4A9F]"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-[#141834]">{r.name}</h3>
                  <span className="inline-flex items-center rounded-full bg-[#E9ECF9] px-2 py-0.5 text-[10px] font-bold text-[#3A4A9F]">
                    {r.course}
                  </span>
                </div>
              </div>
              {r.description && (
                <p className="mt-2 text-xs text-[#565C82] line-clamp-2">{r.description}</p>
              )}
              <div className="mt-3 space-y-1">
                {r.criteria.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-[#1D2140]">{c.name}</span>
                    <span className="text-[#565C82]">{c.maxMarks} marks</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 border-t border-[#EDEFF6] pt-3">
                <div className="flex gap-2">
                  {rubricTab === "my" && (
                    <button
                      onClick={() => openEdit(r)}
                      className="rounded-lg border border-[#D5DAEC] px-3 py-1 text-xs font-semibold text-[#3A4A9F] hover:bg-[#E9ECF9]"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => handleDuplicate(r.id)}
                    className="rounded-lg border border-[#D5DAEC] px-3 py-1 text-xs font-semibold text-[#565C82] hover:bg-[#EDEFF6]"
                  >
                    Duplicate
                  </button>
                  {rubricTab === "my" && (
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="rounded-lg border border-[#D5DAEC] px-3 py-1 text-xs font-semibold text-[#B23A1B] hover:bg-[#FBE9E3]"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
