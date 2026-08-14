/**
 * Analysis History types.
 *
 * A HistoryEntry is a snapshot of an assessment at a point in time.
 * Assessment-first: each entry contains the full assessment with all questions.
 */

import type { Analysis, Rubric, StudentResponse } from "./types";

/** Snapshot of a single question within a history entry */
export type HistoryQuestion = {
  id: string;
  questionText: string;
  rubric: Rubric[];
  responses: StudentResponse[];
  analysis: Analysis | null;
  status: "draft" | "analyzed" | "failed";
};

/** A history entry = one saved assessment snapshot */
export type HistoryEntry = {
  /** Unique ID for this history entry */
  id: string;
  /** Assessment name */
  assessmentName: string;
  /** Course (if available from rubric library context) */
  course: string;
  /** Snapshotted questions */
  questions: HistoryQuestion[];
  /** When this entry was saved */
  savedAt: string;
  /** Whether it's in trash */
  trashed: boolean;
};

export type HistoryAction =
  | { type: "SAVE_ENTRY"; entry: Omit<HistoryEntry, "id" | "savedAt" | "trashed"> }
  | { type: "DELETE_ENTRY"; id: string }         // Move to trash
  | { type: "RESTORE_ENTRY"; id: string }        // Restore from trash
  | { type: "PERMANENT_DELETE"; id: string }      // Actually remove
  | { type: "CLEAR_TRASH" };                      // Remove all trashed
