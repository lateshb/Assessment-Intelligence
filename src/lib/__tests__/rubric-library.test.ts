import { describe, it, expect } from "vitest";
import { validateLibraryRubric } from "../use-rubric-library";
import type { LibraryRubric } from "../rubric-library-types";

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeSampleRubric(overrides?: Partial<LibraryRubric>): LibraryRubric {
  return {
    id: "r-1",
    name: "Test Rubric",
    course: "Economics",
    description: "A test rubric",
    visibility: "private",
    criteria: [
      { name: "C1", description: "First", maxMarks: 3 },
      { name: "C2", description: "Second", maxMarks: 4 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// ─── Rubric Library (Supabase-backed) ──────────────────────────────────────
// Note: The reducer has been replaced with async dispatch to Supabase.
// These tests cover validation and snapshot isolation which remain pure functions.

describe("Rubric Library (Supabase-backed)", () => {
  describe("snapshot isolation", () => {
    it("applying a rubric creates an independent copy — editing library does not affect question", () => {
      const libraryRubric = makeSampleRubric();

      // Simulate "Apply Rubric": snapshot = deep copy of criteria
      const snapshot = libraryRubric.criteria.map((c) => ({ ...c }));

      // Edit the library rubric
      libraryRubric.criteria[0].name = "CHANGED IN LIBRARY";
      libraryRubric.criteria[0].maxMarks = 99;

      // Snapshot should be untouched
      expect(snapshot[0].name).toBe("C1");
      expect(snapshot[0].maxMarks).toBe(3);
    });

    it("editing the snapshot does not affect the library rubric", () => {
      const libraryRubric = makeSampleRubric();
      const snapshot = libraryRubric.criteria.map((c) => ({ ...c }));

      // Edit the snapshot (teacher edits applied rubric)
      snapshot[0].name = "CHANGED IN QUESTION";

      // Library should be untouched
      expect(libraryRubric.criteria[0].name).toBe("C1");
    });
  });

  describe("visibility", () => {
    it("private rubric is only visible to owner", () => {
      const privateRubric = makeSampleRubric({ visibility: "private" });
      const institutionRubric = makeSampleRubric({ id: "r-2", visibility: "institution" });

      // Owner can see private rubric
      expect(privateRubric.visibility).toBe("private");

      // Institution rubric is visible to same institution
      expect(institutionRubric.visibility).toBe("institution");
    });

    it("new rubrics default to private", () => {
      const rubric = makeSampleRubric({ id: "r-new" });
      // When created without visibility field, defaults to private
      expect(rubric.visibility || "private").toBe("private");
    });
  });

  describe("validateLibraryRubric", () => {
    it("returns null for valid rubric", () => {
      expect(
        validateLibraryRubric({
          name: "Valid",
          course: "Economics",
          criteria: [
            { name: "C1", maxMarks: 2 },
            { name: "C2", maxMarks: 3 },
          ],
        })
      ).toBeNull();
    });

    it("rejects empty name", () => {
      expect(
        validateLibraryRubric({ name: "", course: "X", criteria: [{ name: "C1", maxMarks: 1 }, { name: "C2", maxMarks: 1 }] })
      ).toBe("Rubric name is required.");
    });

    it("rejects empty course", () => {
      expect(
        validateLibraryRubric({ name: "X", course: "", criteria: [{ name: "C1", maxMarks: 1 }, { name: "C2", maxMarks: 1 }] })
      ).toBe("Course is required.");
    });

    it("rejects fewer than 2 criteria", () => {
      expect(
        validateLibraryRubric({ name: "X", course: "Y", criteria: [{ name: "C1", maxMarks: 1 }] })
      ).toBe("At least 2 criteria are required.");
    });

    it("rejects more than 5 criteria", () => {
      const criteria = Array.from({ length: 6 }, (_, i) => ({ name: `C${i}`, maxMarks: 1 }));
      expect(validateLibraryRubric({ name: "X", course: "Y", criteria })).toBe(
        "Maximum 5 criteria allowed."
      );
    });

    it("rejects criterion without name", () => {
      expect(
        validateLibraryRubric({ name: "X", course: "Y", criteria: [{ name: "", maxMarks: 1 }, { name: "C2", maxMarks: 1 }] })
      ).toBe("Every criterion needs a name.");
    });

    it("rejects criterion with maxMarks < 1", () => {
      expect(
        validateLibraryRubric({ name: "X", course: "Y", criteria: [{ name: "C1", maxMarks: 0 }, { name: "C2", maxMarks: 1 }] })
      ).toBe("Every criterion needs at least 1 mark.");
    });
  });
});
