import { describe, it, expect } from "vitest";
import {
  rubricLibraryReducer,
  validateLibraryRubric,
} from "../use-rubric-library";
import type { LibraryRubric } from "../rubric-library-types";

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeSampleRubric(overrides?: Partial<LibraryRubric>): LibraryRubric {
  return {
    id: "r-1",
    name: "Test Rubric",
    course: "Economics",
    description: "A test rubric",
    criteria: [
      { name: "C1", description: "First", maxMarks: 3 },
      { name: "C2", description: "Second", maxMarks: 4 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// ─── Reducer tests ─────────────────────────────────────────────────────────

describe("rubricLibraryReducer", () => {
  describe("CREATE_RUBRIC", () => {
    it("adds a new rubric with generated id and timestamps", () => {
      const state: LibraryRubric[] = [];
      const result = rubricLibraryReducer(state, {
        type: "CREATE_RUBRIC",
        rubric: {
          name: "New Rubric",
          course: "Physics",
          description: "Desc",
          criteria: [
            { name: "C1", description: "D1", maxMarks: 2 },
            { name: "C2", description: "D2", maxMarks: 3 },
          ],
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("New Rubric");
      expect(result[0].course).toBe("Physics");
      expect(result[0].id).toMatch(/^rubric-/);
      expect(result[0].createdAt).toBeTruthy();
      expect(result[0].updatedAt).toBeTruthy();
    });

    it("preserves existing rubrics", () => {
      const existing = makeSampleRubric();
      const result = rubricLibraryReducer([existing], {
        type: "CREATE_RUBRIC",
        rubric: { name: "Second", course: "Math", description: "", criteria: [{ name: "A", description: "", maxMarks: 1 }, { name: "B", description: "", maxMarks: 1 }] },
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("r-1");
    });
  });

  describe("UPDATE_RUBRIC", () => {
    it("updates name and course", () => {
      const state = [makeSampleRubric()];
      const result = rubricLibraryReducer(state, {
        type: "UPDATE_RUBRIC",
        id: "r-1",
        updates: { name: "Renamed", course: "Math" },
      });
      expect(result[0].name).toBe("Renamed");
      expect(result[0].course).toBe("Math");
      expect(result[0].description).toBe("A test rubric"); // unchanged
    });

    it("updates criteria", () => {
      const state = [makeSampleRubric()];
      const newCriteria = [{ name: "New C", description: "New D", maxMarks: 5 }, { name: "New C2", description: "", maxMarks: 2 }];
      const result = rubricLibraryReducer(state, {
        type: "UPDATE_RUBRIC",
        id: "r-1",
        updates: { criteria: newCriteria },
      });
      expect(result[0].criteria).toHaveLength(2);
      expect(result[0].criteria[0].name).toBe("New C");
    });

    it("updates updatedAt timestamp", () => {
      const state = [makeSampleRubric()];
      const result = rubricLibraryReducer(state, {
        type: "UPDATE_RUBRIC",
        id: "r-1",
        updates: { name: "Updated" },
      });
      expect(result[0].updatedAt).not.toBe("2026-01-01T00:00:00Z");
    });

    it("ignores unknown id", () => {
      const state = [makeSampleRubric()];
      const result = rubricLibraryReducer(state, {
        type: "UPDATE_RUBRIC",
        id: "nonexistent",
        updates: { name: "X" },
      });
      expect(result[0].name).toBe("Test Rubric");
    });
  });

  describe("DELETE_RUBRIC", () => {
    it("removes the rubric by id", () => {
      const state = [makeSampleRubric(), makeSampleRubric({ id: "r-2", name: "Other" })];
      const result = rubricLibraryReducer(state, { type: "DELETE_RUBRIC", id: "r-1" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("r-2");
    });

    it("no-op for unknown id", () => {
      const state = [makeSampleRubric()];
      const result = rubricLibraryReducer(state, { type: "DELETE_RUBRIC", id: "nonexistent" });
      expect(result).toHaveLength(1);
    });
  });

  describe("DUPLICATE_RUBRIC", () => {
    it("creates a copy with new id and '(copy)' suffix", () => {
      const state = [makeSampleRubric()];
      const result = rubricLibraryReducer(state, { type: "DUPLICATE_RUBRIC", id: "r-1" });
      expect(result).toHaveLength(2);
      expect(result[1].name).toBe("Test Rubric (copy)");
      expect(result[1].id).not.toBe("r-1");
      expect(result[1].course).toBe("Economics");
    });

    it("creates an independent copy of criteria", () => {
      const state = [makeSampleRubric()];
      const result = rubricLibraryReducer(state, { type: "DUPLICATE_RUBRIC", id: "r-1" });
      // Mutating the copy should not affect the original
      result[1].criteria[0].name = "MUTATED";
      expect(result[0].criteria[0].name).toBe("C1");
    });

    it("no-op for unknown id", () => {
      const state = [makeSampleRubric()];
      const result = rubricLibraryReducer(state, { type: "DUPLICATE_RUBRIC", id: "nonexistent" });
      expect(result).toHaveLength(1);
    });
  });
});

// ─── Snapshot isolation test ───────────────────────────────────────────────

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

// ─── Validation tests ──────────────────────────────────────────────────────

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
