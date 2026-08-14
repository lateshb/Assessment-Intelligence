/**
 * Rubric Library state management — reducer + context.
 *
 * Stores library rubrics in local React state.
 * Persistence can later be swapped to Supabase without changing consumers.
 */

"use client";

import { createContext, useContext, useReducer, type ReactNode } from "react";
import type { LibraryRubric, RubricLibraryAction } from "./rubric-library-types";

// ─── Helpers ───────────────────────────────────────────────────────────────

let idCounter = 0;
function generateRubricId(): string {
  return `rubric-${Date.now()}-${++idCounter}`;
}

function now(): string {
  return new Date().toISOString();
}

// ─── Sample rubrics for demo ───────────────────────────────────────────────

const SAMPLE_RUBRICS: LibraryRubric[] = [
  {
    id: "sample-1",
    name: "Price Elasticity Assessment",
    course: "Economics",
    description: "Assesses understanding of price elasticity of demand including formula, interpretation, and application.",
    criteria: [
      { name: "Definition", description: "Student states the correct formula and concept", maxMarks: 3 },
      { name: "Interpretation", description: "Student explains what elasticity values mean", maxMarks: 4 },
      { name: "Application", description: "Student applies to a real-world example", maxMarks: 3 },
    ],
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "sample-2",
    name: "Newton's Laws Problem Set",
    course: "Physics",
    description: "Rubric for assessing conceptual and mathematical understanding of Newton's three laws.",
    criteria: [
      { name: "Law identification", description: "Correctly identifies which law applies", maxMarks: 2 },
      { name: "Free body diagram", description: "Accurate force diagram", maxMarks: 3 },
      { name: "Mathematical solution", description: "Correct calculation with units", maxMarks: 3 },
      { name: "Conceptual explanation", description: "Explains why the law applies", maxMarks: 2 },
    ],
    createdAt: "2026-02-10T10:00:00Z",
    updatedAt: "2026-02-10T10:00:00Z",
  },
  {
    id: "sample-3",
    name: "Essay Structure",
    course: "English",
    description: "General essay structure rubric for argumentative writing.",
    criteria: [
      { name: "Thesis clarity", description: "Clear, debatable thesis statement", maxMarks: 3 },
      { name: "Evidence quality", description: "Relevant, well-chosen supporting evidence", maxMarks: 4 },
      { name: "Analysis depth", description: "Explains how evidence supports the thesis", maxMarks: 3 },
    ],
    createdAt: "2026-03-05T10:00:00Z",
    updatedAt: "2026-03-05T10:00:00Z",
  },
];

// ─── Reducer ───────────────────────────────────────────────────────────────

export function rubricLibraryReducer(
  state: LibraryRubric[],
  action: RubricLibraryAction
): LibraryRubric[] {
  switch (action.type) {
    case "CREATE_RUBRIC": {
      const newRubric: LibraryRubric = {
        ...action.rubric,
        id: generateRubricId(),
        createdAt: now(),
        updatedAt: now(),
      };
      return [...state, newRubric];
    }

    case "UPDATE_RUBRIC":
      return state.map((r) =>
        r.id === action.id
          ? { ...r, ...action.updates, updatedAt: now() }
          : r
      );

    case "DELETE_RUBRIC":
      return state.filter((r) => r.id !== action.id);

    case "DUPLICATE_RUBRIC": {
      const source = state.find((r) => r.id === action.id);
      if (!source) return state;
      const dup: LibraryRubric = {
        ...source,
        id: generateRubricId(),
        name: `${source.name} (copy)`,
        criteria: source.criteria.map((c) => ({ ...c })),
        createdAt: now(),
        updatedAt: now(),
      };
      return [...state, dup];
    }

    default:
      return state;
  }
}

// ─── Validation ────────────────────────────────────────────────────────────

export function validateLibraryRubric(
  rubric: { name: string; course: string; criteria: { name: string; maxMarks: number }[] }
): string | null {
  if (!rubric.name.trim()) return "Rubric name is required.";
  if (!rubric.course.trim()) return "Course is required.";
  if (rubric.criteria.length < 2) return "At least 2 criteria are required.";
  if (rubric.criteria.length > 5) return "Maximum 5 criteria allowed.";
  if (rubric.criteria.some((c) => !c.name.trim())) return "Every criterion needs a name.";
  if (rubric.criteria.some((c) => c.maxMarks < 1)) return "Every criterion needs at least 1 mark.";
  return null;
}

// ─── Context ───────────────────────────────────────────────────────────────

type RubricLibraryContextType = {
  rubrics: LibraryRubric[];
  dispatch: React.Dispatch<RubricLibraryAction>;
};

const RubricLibraryContext = createContext<RubricLibraryContextType | null>(null);

export function RubricLibraryProvider({ children }: { children: ReactNode }) {
  const [rubrics, dispatch] = useReducer(rubricLibraryReducer, SAMPLE_RUBRICS);
  return (
    <RubricLibraryContext.Provider value={{ rubrics, dispatch }}>
      {children}
    </RubricLibraryContext.Provider>
  );
}

export function useRubricLibrary() {
  const ctx = useContext(RubricLibraryContext);
  if (!ctx) throw new Error("useRubricLibrary must be used within a RubricLibraryProvider");
  return ctx;
}
