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
        <h1 className="mb-6 text-2xl font-bold text-[#26306A]">Saved Assessments</h1>
        <div className="rounded-2xl border border-[#D5DAEC] bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-[#565C82]">Loading assessments…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[#26306A]">Saved Assessments</h1>

      {error && (
        <div className="mb-4 rounded-xl border border-[#E4572E] bg-[#FBE9E3] px-4 py-3 text-sm font-medium text-[#B23A1B]">
          {error}
        </div>
      )}

      {assessments.length === 0 ? (
        <div className="rounded-2xl border border-[#D5DAEC] bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-[#565C82]">No saved assessments yet.</p>
          <p className="mt-1 text-xs text-[#8B92B5]">Create an assessment and save it to see it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map((assessment) => (
            <div
              key={assessment.id}
              className="flex items-center justify-between rounded-xl border border-[#D5DAEC] bg-white px-4 py-3 shadow-sm hover:shadow-md"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-[#26306A]">{assessment.name || "Untitled"}</h3>
                <p className="text-xs text-[#565C82]">
                  {assessment.updated_at ? new Date(assessment.updated_at).toLocaleDateString() : "—"}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleOpen(assessment.id)}
                  className="rounded-lg bg-[#26306A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3A4A9F]"
                >
                  Open
                </button>
                <button
                  onClick={() => setDeleteConfirm(assessment.id)}
                  className="rounded-lg border border-[#D5DAEC] px-4 py-2 text-sm font-semibold text-[#565C82] hover:bg-[#EDEFF6]"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-2 text-lg font-bold text-[#26306A]">Delete Assessment?</h2>
            <p className="mb-4 text-sm text-[#565C82]">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-[#D5DAEC] px-4 py-2 text-sm font-semibold text-[#565C82] hover:bg-[#EDEFF6]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="rounded-lg bg-[#E4572E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#B23A1B]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
