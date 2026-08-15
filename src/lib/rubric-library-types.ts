/**
 * Rubric Library types.
 *
 * A LibraryRubric is a reusable rubric template organized by course.
 * When applied to a question, the criteria are COPIED as a snapshot.
 */

import type { Rubric } from "./types";

export type RubricVisibility = 'private' | 'institution';

export type LibraryRubric = {
  /** Unique ID */
  id: string;
  /** Display name (required) */
  name: string;
  /** Course grouping (required) */
  course: string;
  /** Optional description */
  description: string;
  /** 2–5 criteria */
  criteria: Rubric[];
  /** Visibility: private (owner only) or institution (all institution teachers) */
  visibility: RubricVisibility;
  /** Created timestamp */
  createdAt: string;
  /** Updated timestamp */
  updatedAt: string;
};

export type RubricLibraryAction =
  | { type: "CREATE_RUBRIC"; rubric: Omit<LibraryRubric, "id" | "createdAt" | "updatedAt"> }
  | { type: "UPDATE_RUBRIC"; id: string; updates: Partial<Pick<LibraryRubric, "name" | "course" | "description" | "criteria" | "visibility">> }
  | { type: "DELETE_RUBRIC"; id: string }
  | { type: "DUPLICATE_RUBRIC"; id: string };
