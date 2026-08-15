"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loadAssessmentsFromDb, loadAssessmentWithQuestionsFromDb } from "@/lib/assessment-db";
import { transformDbToAssessmentState } from "@/lib/assessment-transformer";
import { useAssessment } from "@/lib/use-assessment";
import type { Database } from "@/types/database.types";

type Assessment = Database['public']['Tables']['assessments']['Row'];
type SavedAssessmentRow = Assessment & { _questionCount?: number; _hasAnalysis?: boolean };

export default function SavedAssessmentsPage() {
  const router = useRouter();
  const { dispatch } = useAssessment();
  const [assessments, setAssessments] = useState<SavedAssessmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Load assessments on mount
  useEffect(() => {
    async function loadAssessments() {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        const rows = await loadAssessmentsFromDb(user.id);
        setAssessments(rows);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadAssessments();
  }, []);

  // Open assessment
  const handleOpen = useCallback(
    async (assessmentId: string) => {
      try {
        const dbData = await loadAssessmentWithQuestionsFromDb(assessmentId);
        const state = transformDbToAssessmentState(dbData, dbData.questions);
        dispatch({ type: "LOAD_ASSESSMENT", state });
        router.push("/");
      } catch (err: any) {
        alert("Failed to open: " + err.message);
      }
    },
    [dispatch, router]
  );

  // Delete assessment
  const handleDelete = useCallback(
    async (assessmentId: string) => {
      try {
        const supabase = createClient();
        const { error: deleteError } = await supabase
          .from("assessments")
          .delete()
          .eq("id", assessmentId);

        if (deleteError) throw deleteError;

        setAssessments((prev) => prev.filter((a) => a.id !== assessmentId));
        setDeleteConfirm(null);
      } catch (err: any) {
        alert("Failed to delete: " + err.message);
      }
    },
    []
  );

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#26306A]">Saved Assessments</h1>
          <p className="mt-1 text-sm text-[#565C82]">Manage and revisit your previously saved assessments</p>
        </div>
        <div className="rounded-2xl border border-[#D5DAEC] bg-white p-12 text-center shadow-sm">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#3A4A9F] border-t-transparent mb-3" />
          <p className="text-sm font-semibold text-[#565C82]">Loading saved assessments…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#26306A]">Saved Assessments</h1>
          <p className="mt-1 text-sm text-[#565C82]">Manage and revisit your previously saved assessments</p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#26306A] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#3A4A9F] transition-all"
        >
          <span>+</span>
          <span>New Assessment</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-[#E4572E] bg-[#FBE9E3] p-4 text-sm font-medium text-[#B23A1B]">
          {error}
        </div>
      )}

      {assessments.length === 0 ? (
        <div className="rounded-2xl border border-[#D5DAEC] bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDEFF6] text-2xl">
            📋
          </div>
          <h3 className="text-base font-bold text-[#141834]">No saved assessments yet</h3>
          <p className="mt-1 text-sm text-[#565C82] max-w-md mx-auto">
            Create an assessment in the workspace and click "Save Draft" to access it here anytime.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#26306A] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#3A4A9F] transition-all"
          >
            Create Your First Assessment →
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {assessments.map((assessment) => (
            <div
              key={assessment.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#D5DAEC] bg-white p-4 sm:p-5 shadow-sm hover:border-[#3A4A9F] hover:shadow-md transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base font-bold text-[#26306A]">
                    {assessment.name || "Untitled Assessment"}
                  </h3>
                  {assessment._questionCount !== undefined && (
                    <span className="rounded-md bg-[#EDEFF6] px-2 py-0.5 text-xs font-semibold text-[#565C82]">
                      {assessment._questionCount} {assessment._questionCount === 1 ? "question" : "questions"}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-[#565C82]">
                  Last modified:{" "}
                  {assessment.updated_at
                    ? new Date(assessment.updated_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleOpen(assessment.id)}
                  className="flex-1 sm:flex-none rounded-xl bg-[#26306A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3A4A9F] transition-all"
                >
                  Open in Workspace
                </button>
                <button
                  onClick={() => setDeleteConfirm(assessment.id)}
                  className="rounded-xl border border-[#D5DAEC] px-3.5 py-2 text-sm font-semibold text-[#565C82] hover:bg-[#FBE9E3] hover:text-[#B23A1B] hover:border-[#E4572E]/40 transition-all"
                  aria-label="Delete assessment"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirm(null); }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-[#D5DAEC]">
            <h2 className="text-lg font-bold text-[#26306A]">Delete Assessment?</h2>
            <p className="mt-2 text-sm text-[#565C82] leading-relaxed">
              Are you sure you want to delete this assessment? This will permanently remove its associated questions, rubrics, and analysis records.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-xl border border-[#D5DAEC] px-4 py-2 text-sm font-semibold text-[#565C82] hover:bg-[#EDEFF6] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="rounded-xl bg-[#E4572E] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#B23A1B] transition-all"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
