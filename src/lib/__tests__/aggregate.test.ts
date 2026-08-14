import { describe, it, expect } from "vitest";
import { aggregate, summaryCounts, totalMaxMarks } from "../aggregate";
import type { Rubric } from "../types";

// ─── Shared test fixtures ──────────────────────────────────────────────────

const rubric: Rubric[] = [
  { name: "Definition", description: "Correct formula", maxMarks: 3 },
  { name: "Interpretation", description: "Explains meaning", maxMarks: 4 },
  { name: "Application", description: "Applies to example", maxMarks: 3 },
];

const responseIds = ["R01", "R02", "R03", "R04", "R05"];

const meta = { model: "test-model", latencyMs: 100, source: "live" as const };
const disclaimer = "Test disclaimer";

function makePerResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: "R01",
    category: "correct",
    misconception: null,
    evidence: "some evidence",
    confidence: 0.9,
    criterionScores: [1, 0.5, 0],
    draftMark: 5,
    ...overrides,
  };
}

function makeRawOutput(overrides: {
  perResponse?: unknown[];
  clusters?: unknown[];
  recommendation?: Record<string, unknown>;
} = {}) {
  return {
    perResponse: overrides.perResponse ?? responseIds.map((id) =>
      makePerResponse({ id })
    ),
    clusters: overrides.clusters ?? [],
    recommendation: overrides.recommendation ?? {},
  };
}

// ─── Category preservation ─────────────────────────────────────────────────

describe("aggregate — category preservation", () => {
  it("preserves 'correct' category when confidence is high", () => {
    const raw = makeRawOutput({
      perResponse: responseIds.map((id) =>
        makePerResponse({ id, category: "correct", confidence: 0.9 })
      ),
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    for (const p of result.perResponse) {
      expect(p.category).toBe("correct");
    }
  });

  it("preserves 'partial' category when confidence is high", () => {
    const raw = makeRawOutput({
      perResponse: responseIds.map((id) =>
        makePerResponse({ id, category: "partial", confidence: 0.85 })
      ),
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    for (const p of result.perResponse) {
      expect(p.category).toBe("partial");
    }
  });

  it("preserves 'misconception' category when confidence is high", () => {
    const raw = makeRawOutput({
      perResponse: responseIds.map((id) =>
        makePerResponse({
          id,
          category: "misconception",
          misconception: "Wrong belief",
          confidence: 0.8,
        })
      ),
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    for (const p of result.perResponse) {
      expect(p.category).toBe("misconception");
    }
  });

  it("defaults unknown category to 'partial'", () => {
    const raw = makeRawOutput({
      perResponse: [
        makePerResponse({ id: "R01", category: "invented_category", confidence: 0.9 }),
        ...responseIds.slice(1).map((id) => makePerResponse({ id })),
      ],
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    expect(result.perResponse[0].modelCategory).toBe("partial");
  });
});

// ─── Confidence handling ───────────────────────────────────────────────────

describe("aggregate — confidence handling", () => {
  it("routes responses below 0.6 confidence to needs_review", () => {
    const raw = makeRawOutput({
      perResponse: responseIds.map((id) =>
        makePerResponse({ id, category: "correct", confidence: 0.5 })
      ),
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    for (const p of result.perResponse) {
      expect(p.category).toBe("needs_review");
      expect(p.modelCategory).toBe("correct");
    }
  });

  it("keeps category when confidence is exactly 0.6", () => {
    const raw = makeRawOutput({
      perResponse: responseIds.map((id) =>
        makePerResponse({ id, category: "correct", confidence: 0.6 })
      ),
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    for (const p of result.perResponse) {
      expect(p.category).toBe("correct");
    }
  });

  it("clamps confidence above 1 to 1", () => {
    const raw = makeRawOutput({
      perResponse: responseIds.map((id) =>
        makePerResponse({ id, confidence: 1.5 })
      ),
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    for (const p of result.perResponse) {
      expect(p.confidence).toBe(1);
    }
  });

  it("clamps confidence below 0 to 0", () => {
    const raw = makeRawOutput({
      perResponse: responseIds.map((id) =>
        makePerResponse({ id, confidence: -0.3 })
      ),
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    for (const p of result.perResponse) {
      expect(p.confidence).toBe(0);
    }
  });

  it("defaults non-finite confidence to 0.3", () => {
    const raw = makeRawOutput({
      perResponse: responseIds.map((id) =>
        makePerResponse({ id, confidence: "not-a-number" })
      ),
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    for (const p of result.perResponse) {
      expect(p.confidence).toBe(0.3);
      // 0.3 < 0.6 threshold, so should be needs_review
      expect(p.category).toBe("needs_review");
    }
  });
});

// ─── Criterion scores and draft marks ──────────────────────────────────────

describe("aggregate — criterion scores and draft marks", () => {
  it("recomputes draft marks from criterion scores, ignoring model draftMark", () => {
    // criterionScores [1, 0.5, 0] → quantized [1, 0.5, 0]
    // draftMark = 1*3 + 0.5*4 + 0*3 = 5.0
    const raw = makeRawOutput({
      perResponse: responseIds.map((id) =>
        makePerResponse({
          id,
          criterionScores: [1, 0.5, 0],
          draftMark: 999, // model's value should be ignored
        })
      ),
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    for (const p of result.perResponse) {
      expect(p.draftMark).toBe(5);
    }
  });

  it("quantizes criterion scores: >=0.75 → 1, >=0.25 → 0.5, else → 0", () => {
    const raw = makeRawOutput({
      perResponse: [
        makePerResponse({ id: "R01", criterionScores: [0.9, 0.5, 0.1], confidence: 0.9 }),
        ...responseIds.slice(1).map((id) => makePerResponse({ id })),
      ],
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    expect(result.perResponse[0].criterionScores).toEqual([1, 0.5, 0]);
  });

  it("forces review and zeros scores when criterionScores length mismatches rubric", () => {
    const raw = makeRawOutput({
      perResponse: responseIds.map((id) =>
        makePerResponse({
          id,
          category: "correct",
          criterionScores: [1, 0.5], // only 2 of 3 expected
          confidence: 0.9,
        })
      ),
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    for (const p of result.perResponse) {
      expect(p.criterionScores).toEqual([0, 0, 0]);
      // confidence capped to 0.3 → needs_review
      expect(p.confidence).toBeLessThanOrEqual(0.3);
      expect(p.category).toBe("needs_review");
    }
  });

  it("forces review when criterionScores is not an array", () => {
    const raw = makeRawOutput({
      perResponse: responseIds.map((id) =>
        makePerResponse({
          id,
          criterionScores: "not-an-array",
          confidence: 0.9,
        })
      ),
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    for (const p of result.perResponse) {
      expect(p.criterionScores).toEqual([0, 0, 0]);
      expect(p.draftMark).toBe(0);
    }
  });

  it("computes perfect draft mark for all-1 scores", () => {
    const raw = makeRawOutput({
      perResponse: responseIds.map((id) =>
        makePerResponse({ id, criterionScores: [1, 1, 1], confidence: 0.9 })
      ),
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    // 1*3 + 1*4 + 1*3 = 10
    for (const p of result.perResponse) {
      expect(p.draftMark).toBe(10);
    }
  });
});

// ─── Gap map ───────────────────────────────────────────────────────────────

describe("aggregate — gap map", () => {
  it("computes mastery percentage from criterion scores", () => {
    // All responses have [1, 0.5, 0] → mastery: 100%, 50%, 0%
    const raw = makeRawOutput({
      perResponse: responseIds.map((id) =>
        makePerResponse({ id, criterionScores: [1, 0.5, 0], confidence: 0.9 })
      ),
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    expect(result.gapMap[0]).toEqual({ criterion: "Definition", masteryPct: 100, level: "good" });
    expect(result.gapMap[1]).toEqual({ criterion: "Interpretation", masteryPct: 50, level: "warning" });
    expect(result.gapMap[2]).toEqual({ criterion: "Application", masteryPct: 0, level: "critical" });
  });

  it("assigns 'critical' level when mastery < 50", () => {
    const raw = makeRawOutput({
      perResponse: responseIds.map((id) =>
        makePerResponse({ id, criterionScores: [0, 0, 0], confidence: 0.9 })
      ),
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    for (const g of result.gapMap) {
      expect(g.level).toBe("critical");
      expect(g.masteryPct).toBe(0);
    }
  });

  it("assigns 'warning' level when mastery is 50–74", () => {
    // All [0.5, 0.5, 0.5] → mastery 50% each → warning
    const raw = makeRawOutput({
      perResponse: responseIds.map((id) =>
        makePerResponse({ id, criterionScores: [0.5, 0.5, 0.5], confidence: 0.9 })
      ),
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    for (const g of result.gapMap) {
      expect(g.level).toBe("warning");
      expect(g.masteryPct).toBe(50);
    }
  });

  it("assigns 'good' level when mastery >= 75", () => {
    const raw = makeRawOutput({
      perResponse: responseIds.map((id) =>
        makePerResponse({ id, criterionScores: [1, 1, 1], confidence: 0.9 })
      ),
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    for (const g of result.gapMap) {
      expect(g.level).toBe("good");
      expect(g.masteryPct).toBe(100);
    }
  });
});

// ─── Cluster computation ───────────────────────────────────────────────────

describe("aggregate — clusters", () => {
  it("builds clusters from per-response misconception labels", () => {
    const raw = makeRawOutput({
      perResponse: [
        makePerResponse({ id: "R01", category: "misconception", misconception: "Wrong belief A", confidence: 0.8 }),
        makePerResponse({ id: "R02", category: "misconception", misconception: "Wrong belief A", confidence: 0.7 }),
        makePerResponse({ id: "R03", category: "misconception", misconception: "Wrong belief B", confidence: 0.9 }),
        makePerResponse({ id: "R04", category: "correct", confidence: 0.9 }),
        makePerResponse({ id: "R05", category: "partial", confidence: 0.9 }),
      ],
      clusters: [
        { label: "Wrong belief A", explanation: "Explanation for A", responseIds: ["R01", "R02"] },
        { label: "Wrong belief B", explanation: "Explanation for B", responseIds: ["R03"] },
      ],
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);

    // Cluster membership rebuilt from perResponse, not trusted from model
    expect(result.clusters).toHaveLength(2);
    const clusterA = result.clusters.find((c) => c.label === "Wrong belief A")!;
    expect(clusterA.responseIds).toEqual(["R01", "R02"]);
    expect(clusterA.explanation).toBe("Explanation for A");

    const clusterB = result.clusters.find((c) => c.label === "Wrong belief B")!;
    expect(clusterB.responseIds).toEqual(["R03"]);
  });

  it("sorts clusters by size (largest first)", () => {
    const raw = makeRawOutput({
      perResponse: [
        makePerResponse({ id: "R01", category: "misconception", misconception: "Small", confidence: 0.8 }),
        makePerResponse({ id: "R02", category: "misconception", misconception: "Large", confidence: 0.8 }),
        makePerResponse({ id: "R03", category: "misconception", misconception: "Large", confidence: 0.8 }),
        makePerResponse({ id: "R04", category: "misconception", misconception: "Large", confidence: 0.8 }),
        makePerResponse({ id: "R05", category: "correct", confidence: 0.9 }),
      ],
      clusters: [
        { label: "Small", explanation: "...", responseIds: [] },
        { label: "Large", explanation: "...", responseIds: [] },
      ],
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    expect(result.clusters[0].label).toBe("Large");
    expect(result.clusters[0].responseIds).toHaveLength(3);
    expect(result.clusters[1].label).toBe("Small");
    expect(result.clusters[1].responseIds).toHaveLength(1);
  });

  it("computes deterministic average confidence per cluster", () => {
    const raw = makeRawOutput({
      perResponse: [
        makePerResponse({ id: "R01", category: "misconception", misconception: "Belief", confidence: 0.8 }),
        makePerResponse({ id: "R02", category: "misconception", misconception: "Belief", confidence: 0.6 }),
        makePerResponse({ id: "R03", category: "correct", confidence: 0.9 }),
        makePerResponse({ id: "R04", category: "correct", confidence: 0.9 }),
        makePerResponse({ id: "R05", category: "correct", confidence: 0.9 }),
      ],
      clusters: [{ label: "Belief", explanation: "test", responseIds: [] }],
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    expect(result.clusters[0].avgConfidence).toBe(0.7);
  });

  it("provides fallback explanation when model omits it", () => {
    const raw = makeRawOutput({
      perResponse: [
        makePerResponse({ id: "R01", category: "misconception", misconception: "Novel belief", confidence: 0.8 }),
        ...responseIds.slice(1).map((id) => makePerResponse({ id })),
      ],
      clusters: [], // no cluster explanations from model
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    expect(result.clusters).toHaveLength(1);
    expect(result.clusters[0].explanation).toContain("consistently mistaken pattern");
  });
});

// ─── Missing model responses ───────────────────────────────────────────────

describe("aggregate — missing model responses", () => {
  it("creates needs_review entries for responses the model dropped", () => {
    const raw = makeRawOutput({
      perResponse: [
        makePerResponse({ id: "R01", confidence: 0.9 }),
        makePerResponse({ id: "R02", confidence: 0.9 }),
        // R03, R04, R05 are missing
      ],
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    expect(result.perResponse).toHaveLength(5);

    const r03 = result.perResponse.find((p) => p.id === "R03")!;
    expect(r03.category).toBe("needs_review");
    expect(r03.confidence).toBe(0);
    expect(r03.draftMark).toBe(0);
    expect(r03.criterionScores).toEqual([0, 0, 0]);
  });

  it("filters out response IDs not in the real responseIds list", () => {
    const raw = makeRawOutput({
      perResponse: [
        ...responseIds.map((id) => makePerResponse({ id })),
        makePerResponse({ id: "FAKE_ID" }), // hallucinated ID
      ],
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    expect(result.perResponse).toHaveLength(5);
    expect(result.perResponse.find((p) => p.id === "FAKE_ID")).toBeUndefined();
  });

  it("preserves response ordering from responseIds", () => {
    const raw = makeRawOutput({
      perResponse: [
        makePerResponse({ id: "R05" }),
        makePerResponse({ id: "R01" }),
        makePerResponse({ id: "R03" }),
        makePerResponse({ id: "R02" }),
        makePerResponse({ id: "R04" }),
      ],
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    expect(result.perResponse.map((p) => p.id)).toEqual(responseIds);
  });
});

// ─── Recommendation ────────────────────────────────────────────────────────

describe("aggregate — recommendation", () => {
  it("sanitizes targetIds against real response IDs", () => {
    const raw = makeRawOutput({
      recommendation: {
        type: "Revision session",
        durationMin: 15,
        targetDescription: "Students with misconceptions",
        targetIds: ["R01", "FAKE_ID", "R03"],
        rationale: "Test rationale",
        followUp: "Test follow-up",
      },
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    expect(result.recommendation.targetIds).toEqual(["R01", "R03"]);
    expect(result.recommendation.targetIds).not.toContain("FAKE_ID");
  });

  it("falls back to default targets when model provides empty targetIds", () => {
    const raw = makeRawOutput({
      perResponse: [
        makePerResponse({ id: "R01", category: "correct", confidence: 0.9 }),
        makePerResponse({ id: "R02", category: "partial", confidence: 0.9 }),
        makePerResponse({ id: "R03", category: "misconception", misconception: "Wrong", confidence: 0.8 }),
        makePerResponse({ id: "R04", category: "correct", confidence: 0.9 }),
        makePerResponse({ id: "R05", category: "partial", confidence: 0.9 }),
      ],
      recommendation: { targetIds: [] },
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    // Default targets: partial + misconception responses
    expect(result.recommendation.targetIds).toContain("R02");
    expect(result.recommendation.targetIds).toContain("R03");
    expect(result.recommendation.targetIds).toContain("R05");
    expect(result.recommendation.targetIds).not.toContain("R01");
    expect(result.recommendation.targetIds).not.toContain("R04");
  });

  it("falls back to defaults when recommendation is completely missing", () => {
    const raw = makeRawOutput({ recommendation: undefined as unknown as Record<string, unknown> });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    expect(result.recommendation.type).toBe("Targeted revision session");
    expect(result.recommendation.durationMin).toBeGreaterThanOrEqual(10);
    expect(result.recommendation.durationMin).toBeLessThanOrEqual(25);
    expect(result.recommendation.followUp).toBeTruthy();
  });

  it("clamps durationMin to 10–25 range", () => {
    const raw = makeRawOutput({
      recommendation: { durationMin: 100 },
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    expect(result.recommendation.durationMin).toBe(25);

    const raw2 = makeRawOutput({
      recommendation: { durationMin: 1 },
    });
    const result2 = aggregate(raw2, rubric, responseIds, meta, disclaimer);
    expect(result2.recommendation.durationMin).toBe(10);
  });
});

// ─── Meta and disclaimer ──────────────────────────────────────────────────

describe("aggregate — meta", () => {
  it("passes through model, latency, source, and disclaimer", () => {
    const raw = makeRawOutput();
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    expect(result.meta.model).toBe("test-model");
    expect(result.meta.latencyMs).toBe(100);
    expect(result.meta.source).toBe("live");
    expect(result.meta.disclaimer).toBe("Test disclaimer");
  });
});

// ─── Helper functions ──────────────────────────────────────────────────────

describe("summaryCounts", () => {
  it("counts categories correctly", () => {
    const raw = makeRawOutput({
      perResponse: [
        makePerResponse({ id: "R01", category: "correct", confidence: 0.9 }),
        makePerResponse({ id: "R02", category: "partial", confidence: 0.9 }),
        makePerResponse({ id: "R03", category: "misconception", misconception: "x", confidence: 0.8 }),
        makePerResponse({ id: "R04", category: "correct", confidence: 0.5 }), // → needs_review
        makePerResponse({ id: "R05", category: "partial", confidence: 0.9 }),
      ],
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    const counts = summaryCounts(result.perResponse);
    expect(counts.correct).toBe(1);
    expect(counts.partial).toBe(2);
    expect(counts.misconception).toBe(1);
    expect(counts.needs_review).toBe(1);
  });
});

describe("totalMaxMarks", () => {
  it("sums max marks from rubric", () => {
    expect(totalMaxMarks(rubric)).toBe(10); // 3+4+3
  });

  it("returns 0 for empty rubric", () => {
    expect(totalMaxMarks([])).toBe(0);
  });
});

// ─── Completely malformed input ────────────────────────────────────────────

describe("aggregate — malformed input", () => {
  it("throws on null input (known limitation — to harden in T-015)", () => {
    // aggregate() currently crashes on null because it casts raw to an object.
    // This documents the current behaviour. Error boundary work in T-015 should
    // add a guard so null/undefined raw input returns all needs_review gracefully.
    expect(() => aggregate(null, rubric, responseIds, meta, disclaimer)).toThrow();
  });

  it("handles empty perResponse array", () => {
    const raw = makeRawOutput({ perResponse: [] });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    expect(result.perResponse).toHaveLength(5);
    for (const p of result.perResponse) {
      expect(p.category).toBe("needs_review");
    }
  });

  it("handles perResponse with non-string ids", () => {
    const raw = makeRawOutput({
      perResponse: [
        makePerResponse({ id: 123 }), // numeric ID, should be skipped
        ...responseIds.map((id) => makePerResponse({ id })),
      ],
    });
    const result = aggregate(raw, rubric, responseIds, meta, disclaimer);
    // Numeric ID filtered out; all 5 real IDs present
    expect(result.perResponse).toHaveLength(5);
  });
});
