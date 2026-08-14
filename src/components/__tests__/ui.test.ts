import { describe, it, expect } from "vitest";
import { CATEGORY_META } from "../ui";

describe("CATEGORY_META", () => {
  it("has labels for all four categories", () => {
    expect(CATEGORY_META.correct.label).toBe("Correct");
    expect(CATEGORY_META.partial.label).toBe("Partially correct");
    expect(CATEGORY_META.misconception.label).toBe("Misconception");
    expect(CATEGORY_META.needs_review.label).toBe("Needs teacher review");
  });

  it("has chip CSS classes for all four categories", () => {
    for (const key of ["correct", "partial", "misconception", "needs_review"]) {
      expect(CATEGORY_META[key].chip).toBeTruthy();
      expect(typeof CATEGORY_META[key].chip).toBe("string");
    }
  });

  it("has dot CSS classes for all four categories", () => {
    for (const key of ["correct", "partial", "misconception", "needs_review"]) {
      expect(CATEGORY_META[key].dot).toBeTruthy();
      expect(typeof CATEGORY_META[key].dot).toBe("string");
    }
  });
});
