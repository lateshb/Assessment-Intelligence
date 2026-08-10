import { CONFIDENCE_REVIEW_THRESHOLD } from "./constants";
import type {
  Analysis,
  Cluster,
  GapRow,
  PerResponse,
  Recommendation,
  Rubric,
} from "./types";

/**
 * Takes the raw (untrusted) LLM output and produces the final Analysis.
 * All arithmetic - draft marks, gap-map percentages, cluster membership,
 * confidence averages - is computed HERE, deterministically. The LLM's own
 * aggregate numbers are ignored by design, so every figure shown on screen
 * is defensible in Board Q&A.
 */
export function aggregate(
  raw: unknown,
  rubric: Rubric[],
  responseIds: string[],
  meta: { model: string; latencyMs: number; source: "live" | "cached" },
  disclaimer: string
): Analysis {
  const obj = raw as {
    perResponse?: unknown[];
    clusters?: unknown[];
    recommendation?: Record<string, unknown>;
  };
  const totalMax = rubric.reduce((s, r) => s + r.maxMarks, 0);
  const byId = new Map<string, PerResponse>();

  for (const item of obj.perResponse ?? []) {
    const p = item as Record<string, unknown>;
    const id = typeof p.id === "string" ? p.id : null;
    if (!id || !responseIds.includes(id)) continue;

    const modelCategory = (
      ["correct", "partial", "misconception"].includes(String(p.category))
        ? String(p.category)
        : "partial"
    ) as "correct" | "partial" | "misconception";

    let confidence = Number(p.confidence);
    if (!Number.isFinite(confidence)) confidence = 0.3;
    confidence = Math.min(1, Math.max(0, confidence));

    let scores: number[] = Array.isArray(p.criterionScores)
      ? p.criterionScores.map((s): number => {
          const n = Number(s);
          return n >= 0.75 ? 1 : n >= 0.25 ? 0.5 : 0;
        })
      : [];
    if (scores.length !== rubric.length) {
      // malformed -> unknown mastery, force review
      scores = rubric.map(() => 0);
      confidence = Math.min(confidence, 0.3);
    }

    const draftMark =
      Math.round(
        scores.reduce((s, v, i) => s + v * rubric[i].maxMarks, 0) * 10
      ) / 10;

    const needsReview = confidence < CONFIDENCE_REVIEW_THRESHOLD;

    byId.set(id, {
      id,
      category: needsReview ? "needs_review" : modelCategory,
      modelCategory,
      misconception:
        modelCategory === "misconception" && typeof p.misconception === "string"
          ? p.misconception
          : null,
      evidence: typeof p.evidence === "string" ? p.evidence : "",
      confidence,
      criterionScores: scores,
      draftMark,
    });
  }

  // Any response the model dropped entirely -> needs_review, zero-knowledge.
  for (const id of responseIds) {
    if (!byId.has(id)) {
      byId.set(id, {
        id,
        category: "needs_review",
        modelCategory: "partial",
        misconception: null,
        evidence: "",
        confidence: 0,
        criterionScores: rubric.map(() => 0),
        draftMark: 0,
      });
    }
  }

  const perResponse = responseIds.map((id) => byId.get(id)!);

  // Clusters: membership recomputed from perResponse, never trusted from the model.
  const explanations = new Map<string, string>();
  for (const c of obj.clusters ?? []) {
    const cc = c as Record<string, unknown>;
    if (typeof cc.label === "string" && typeof cc.explanation === "string") {
      explanations.set(cc.label, cc.explanation);
    }
  }
  const clusterMap = new Map<string, string[]>();
  for (const p of perResponse) {
    if (p.misconception) {
      if (!clusterMap.has(p.misconception)) clusterMap.set(p.misconception, []);
      clusterMap.get(p.misconception)!.push(p.id);
    }
  }
  const clusters: Cluster[] = [...clusterMap.entries()]
    .map(([label, ids]) => ({
      label,
      explanation:
        explanations.get(label) ??
        "Students holding this belief answered in a consistently mistaken pattern; review the evidence quotes below.",
      responseIds: ids,
      avgConfidence:
        Math.round(
          (ids.reduce(
            (s, id) => s + (byId.get(id)?.confidence ?? 0),
            0
          ) /
            ids.length) *
            100
        ) / 100,
    }))
    .sort((a, b) => b.responseIds.length - a.responseIds.length);

  // Gap map: mean mastery per criterion across ALL responses.
  const gapMap: GapRow[] = rubric.map((r, i) => {
    const mean =
      perResponse.reduce((s, p) => s + (p.criterionScores[i] ?? 0), 0) /
      perResponse.length;
    const masteryPct = Math.round(mean * 100);
    return {
      criterion: r.name,
      masteryPct,
      level: masteryPct < 50 ? "critical" : masteryPct < 75 ? "warning" : "good",
    };
  });

  // Recommendation: text from the model, target list sanitised against real ids.
  const rec = (obj.recommendation ?? {}) as Record<string, unknown>;
  const weakest = [...gapMap].sort((a, b) => a.masteryPct - b.masteryPct)[0];
  const defaultTargets = perResponse
    .filter((p) => p.category === "misconception" || p.category === "partial")
    .map((p) => p.id);
  const targetIds = Array.isArray(rec.targetIds)
    ? (rec.targetIds as unknown[])
        .filter((t): t is string => typeof t === "string")
        .filter((t) => responseIds.includes(t))
    : [];
  const recommendation: Recommendation = {
    type:
      typeof rec.type === "string" && rec.type
        ? rec.type
        : "Targeted revision session",
    durationMin: Number.isFinite(Number(rec.durationMin))
      ? Math.min(25, Math.max(10, Number(rec.durationMin)))
      : 15,
    targetDescription:
      typeof rec.targetDescription === "string" && rec.targetDescription
        ? rec.targetDescription
        : `Students with partial understanding or a misconception on ${weakest?.criterion ?? "the weakest criterion"}`,
    targetIds: targetIds.length > 0 ? targetIds : defaultTargets,
    rationale:
      typeof rec.rationale === "string" && rec.rationale
        ? rec.rationale
        : `${weakest?.criterion ?? "One criterion"} shows the lowest class mastery (${weakest?.masteryPct ?? "-"}%).`,
    followUp:
      typeof rec.followUp === "string" && rec.followUp
        ? rec.followUp
        : "Run a 5-question diagnostic on the weakest criterion within 3 days.",
  };

  return {
    perResponse,
    clusters,
    gapMap,
    recommendation,
    meta: { ...meta, disclaimer },
  };
}

export function summaryCounts(perResponse: PerResponse[]) {
  const c = { correct: 0, partial: 0, misconception: 0, needs_review: 0 };
  for (const p of perResponse) c[p.category] += 1;
  return c;
}

/** kept for reference: total possible marks */
export function totalMaxMarks(rubric: Rubric[]) {
  return rubric.reduce((s, r) => s + r.maxMarks, 0);
}
