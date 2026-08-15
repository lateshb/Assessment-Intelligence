/**
 * Assessment and question state types for the multi-question workflow.
 *
 * These types describe the UI state model. They are local-first:
 * persistence can later be added by syncing this state to Supabase
 * without rewriting the UI components.
 */

import type { Analysis, Rubric, StudentResponse } from "./types";

// ─── Question status (computed, never manually set) ────────────────────────

export type QuestionStatus =
  | "draft"          // Empty or partially filled — not ready for analysis
  | "ready"          // All inputs valid — can be analyzed
  | "analyzing"      // Analysis in progress
  | "analyzed"       // Has a current analysis
  | "needs_reanalysis" // Inputs changed since last analysis
  | "failed";        // Analysis attempted but failed

// ─── Question state ────────────────────────────────────────────────────────

export type QuestionState = {
  /** Stable unique ID (UUID-like). Survives reordering. */
  id: string;
  /** Database ID (null for unsaved questions) */
  dbId?: string | null;
  /** Rubric source (custom, library, or null) */
  rubricSource?: 'custom' | 'library' | null;
  /** Rubric library ID if from library */
  rubricLibraryId?: string | null;
  /** Exam question text */
  questionText: string;
  /** Rubric criteria */
  rubric: Rubric[];
  /** How responses were entered */
  responseTab: "paste" | "csv";
  /** Raw paste text */
  pasteText: string;
  /** Parsed CSV rows (null if not used) */
  csvRows: StudentResponse[] | null;
  /** CSV file display name */
  csvName: string;
  /** Computed status */
  status: QuestionStatus;
  /** Current analysis result (null if not analyzed) */
  analysis: Analysis | null;
  /** Error message from last failed analysis attempt */
  error: string | null;
  /** Whether the question card is expanded */
  expanded: boolean;
  /** Snapshot of inputs at time of analysis (for staleness detection) */
  analyzedInputHash: string | null;
};

// ─── Assessment state ──────────────────────────────────────────────────────

export type AssessmentState = {
  /** Database ID (null for unsaved assessments) */
  id?: string | null;
  /** Assessment name (optional) */
  name: string;
  /** Ordered list of questions */
  questions: QuestionState[];
  /** Whether "Analyze All" is in progress */
  analyzeAllInProgress: boolean;
  /** Whether demo mode (?demo=1) is active */
  demoFlag: boolean;
  /** Whether save is in progress */
  saveInProgress?: boolean;
  /** Last save error */
  saveError?: string | null;
};

// ─── Action types for the assessment reducer ───────────────────────────────

export type AssessmentAction =
  | { type: "SET_NAME"; name: string }
  | { type: "ADD_QUESTION" }
  | { type: "DELETE_QUESTION"; questionId: string }
  | { type: "DUPLICATE_QUESTION"; questionId: string }
  | { type: "RESET_QUESTION"; questionId: string }
  | { type: "CLEAR_RUBRIC"; questionId: string }
  | { type: "CLEAR_RESPONSES"; questionId: string }
  | { type: "SET_QUESTION_TEXT"; questionId: string; text: string }
  | { type: "SET_RUBRIC"; questionId: string; rubric: Rubric[] }
  | { type: "SET_RESPONSE_TAB"; questionId: string; tab: "paste" | "csv" }
  | { type: "SET_PASTE_TEXT"; questionId: string; text: string }
  | { type: "SET_CSV_ROWS"; questionId: string; rows: StudentResponse[]; fileName: string }
  | { type: "TOGGLE_EXPANDED"; questionId: string }
  | { type: "COLLAPSE_ALL" }
  | { type: "EXPAND_QUESTION"; questionId: string }
  | { type: "START_ANALYSIS"; questionId: string }
  | { type: "COMPLETE_ANALYSIS"; questionId: string; analysis: Analysis }
  | { type: "FAIL_ANALYSIS"; questionId: string; error: string }
  | { type: "SET_ANALYZE_ALL"; inProgress: boolean }
  | { type: "LOAD_DEMO"; question: string; rubric: Rubric[]; responses: StudentResponse[] }
  | { type: "SET_DEMO_FLAG"; flag: boolean }
  | { type: "START_SAVE" }
  | { type: "COMPLETE_SAVE"; assessmentId: string }
  | { type: "FAIL_SAVE"; error: string }
  | { type: "LOAD_ASSESSMENT"; state: AssessmentState };
