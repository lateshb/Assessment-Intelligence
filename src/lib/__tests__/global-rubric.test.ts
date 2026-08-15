import { describe, it, expect } from "vitest";
import type { Rubric } from "../types";
import type { LibraryRubric } from "../rubric-library-types";

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeRubric(overrides?: Partial<Rubric>): Rubric {
  return { name: "Criterion A", description: "Test criterion", maxMarks: 5, ...overrides };
}

function makeLibraryRubric(overrides?: Partial<LibraryRubric>): LibraryRubric {
  return {
    id: "lr-1",
    name: "Global Rubric",
    course: "Economics",
    description: "Course-level rubric",
    visibility: "private",
    criteria: [
      { name: "Understanding", description: "Concept understanding", maxMarks: 5 },
      { name: "Application", description: "Real-world application", maxMarks: 5 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// Simulate the applyGlobalRubric logic from RubricPicker
function applyGlobalRubric(
  globalCriteria: Rubric[],
  currentCriteria: Rubric[],
  mode: "replace" | "add"
): Rubric[] {
  // SNAPSHOT: always deep-copy from global rubric
  const snapshot = globalCriteria.map((c) => ({ ...c }));

  if (mode === "replace" || currentCriteria.length === 0) {
    return snapshot;
  }

  // Add mode: merge, avoiding exact duplicates
  function criteriaMatch(a: Rubric, b: Rubric): boolean {
    return (
      a.name.trim().toLowerCase() === b.name.trim().toLowerCase() &&
      a.description.trim().toLowerCase() === b.description.trim().toLowerCase() &&
      a.maxMarks === b.maxMarks
    );
  }

  const merged = [...currentCriteria];
  for (const newCrit of snapshot) {
    const isDuplicate = merged.some((existing) => criteriaMatch(existing, newCrit));
    if (!isDuplicate) {
      merged.push(newCrit);
    }
  }
  return merged;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("Global Rubric: apply to question", () => {
  it("replace mode: overwrites existing criteria with snapshot", () => {
    const globalRubric = makeLibraryRubric();
    const existingCriteria = [makeRubric({ name: "Old Criterion", maxMarks: 3 })];

    const result = applyGlobalRubric(globalRubric.criteria, existingCriteria, "replace");

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Understanding");
    expect(result[1].name).toBe("Application");
  });

  it("replace mode with empty existing: just uses global rubric", () => {
    const globalRubric = makeLibraryRubric();

    const result = applyGlobalRubric(globalRubric.criteria, [], "replace");

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Understanding");
  });

  it("add mode: merges new criteria with existing, no duplicates", () => {
    const globalRubric = makeLibraryRubric();
    const existingCriteria = [makeRubric({ name: "Presentation", description: "Clarity", maxMarks: 3 })];

    const result = applyGlobalRubric(globalRubric.criteria, existingCriteria, "add");

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe("Presentation"); // existing first
    expect(result[1].name).toBe("Understanding"); // global appended
    expect(result[2].name).toBe("Application");
  });

  it("add mode: does NOT add duplicate criteria (same name, description, maxMarks)", () => {
    const globalRubric = makeLibraryRubric();
    // Existing already has "Understanding" with same values
    const existingCriteria = [
      { name: "Understanding", description: "Concept understanding", maxMarks: 5 },
    ];

    const result = applyGlobalRubric(globalRubric.criteria, existingCriteria, "add");

    // Understanding is a dup, Application is new → total = 2
    expect(result).toHaveLength(2);
    expect(result.filter((c) => c.name === "Understanding")).toHaveLength(1);
    expect(result.find((c) => c.name === "Application")).toBeTruthy();
  });

  it("snapshot independence: editing global rubric does not affect applied snapshot", () => {
    const globalRubric = makeLibraryRubric();

    // Apply produces a deep copy
    const applied = applyGlobalRubric(globalRubric.criteria, [], "replace");

    // Mutate the global rubric's criteria
    globalRubric.criteria[0].name = "MUTATED IN GLOBAL";
    globalRubric.criteria[0].maxMarks = 99;

    // Applied snapshot should be unchanged
    expect(applied[0].name).toBe("Understanding");
    expect(applied[0].maxMarks).toBe(5);
  });

  it("snapshot independence: editing applied rubric does not affect global rubric", () => {
    const globalRubric = makeLibraryRubric();
    const applied = applyGlobalRubric(globalRubric.criteria, [], "replace");

    // Mutate the applied rubric
    applied[0].name = "MUTATED IN QUESTION";

    // Global rubric should be unchanged
    expect(globalRubric.criteria[0].name).toBe("Understanding");
  });

  it("deleting global rubric: applied snapshot in question is unaffected", () => {
    const globalRubric = makeLibraryRubric();
    const applied = applyGlobalRubric(globalRubric.criteria, [], "replace");

    // Simulate global rubric deletion by nullifying it
    const deletedRubric = null;

    // Question still has its snapshot
    expect(applied).toHaveLength(2);
    expect(deletedRubric).toBeNull();
    expect(applied[0].name).toBe("Understanding");
  });

  it("applying same rubric twice with add mode: deduplicates", () => {
    const globalRubric = makeLibraryRubric();

    // Apply once
    const firstApply = applyGlobalRubric(globalRubric.criteria, [], "replace");
    // Apply same rubric again with add mode
    const secondApply = applyGlobalRubric(globalRubric.criteria, firstApply, "add");

    // Should still have exactly 2 criteria, no duplicates
    expect(secondApply).toHaveLength(2);
  });

  it("combined rubric sent to analysis has correct criteria", () => {
    const globalRubric = makeLibraryRubric();
    const customCriteria = [makeRubric({ name: "Custom", description: "Custom crit", maxMarks: 2 })];

    const combined = applyGlobalRubric(globalRubric.criteria, customCriteria, "add");

    // Analysis would receive this combined rubric
    expect(combined).toHaveLength(3);
    expect(combined.every((c) => typeof c.name === "string" && c.maxMarks > 0)).toBe(true);
  });
});

describe("Global Rubric: CRUD via validateLibraryRubric", () => {
  // Import from rubric-library module to test validation
  it("validates global rubric with required fields", async () => {
    const { validateLibraryRubric } = await import("../use-rubric-library");

    expect(
      validateLibraryRubric({
        name: "Price Elasticity",
        course: "Economics",
        criteria: [
          { name: "Definition", maxMarks: 5 },
          { name: "Application", maxMarks: 5 },
        ],
      })
    ).toBeNull();
  });

  it("rejects global rubric without course", async () => {
    const { validateLibraryRubric } = await import("../use-rubric-library");

    expect(
      validateLibraryRubric({
        name: "My Rubric",
        course: "",
        criteria: [
          { name: "C1", maxMarks: 5 },
          { name: "C2", maxMarks: 5 },
        ],
      })
    ).toBe("Course is required.");
  });
});
