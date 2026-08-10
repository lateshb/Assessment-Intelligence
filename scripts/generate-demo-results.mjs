// Generates public/demo-results.json: a hand-checkable cached Analysis built
// from data/ground-truth.json. Used by ?demo=1 and as the API-failure fallback.
// Run: node scripts/generate-demo-results.mjs
import { readFileSync, writeFileSync } from "node:fs";

const demo = JSON.parse(readFileSync("public/demo-data.json", "utf8"));
const gt = JSON.parse(readFileSync("data/ground-truth.json", "utf8"));
const rubric = demo.rubric;

const CLUSTERS = {
  abs: {
    label: "Confuses elasticity with absolute change in quantity",
    explanation:
      "These students compute elasticity using raw units or rupees (e.g. \u201cdemand fell by 50 units, so elasticity is 50\u201d). They have missed that elasticity compares PERCENTAGE changes, which is what makes it comparable across goods and prices.",
  },
  slope: {
    label: "Confuses elasticity with the slope of the demand curve",
    explanation:
      "These students treat the steepness of the demand curve as elasticity itself. Slope depends on units and stays constant on a straight line, while elasticity uses percentage changes and varies along the curve.",
  },
  law: {
    label: "Confuses elasticity with the law of demand",
    explanation:
      "These students restate that price and quantity move in opposite directions. That is the law of demand (direction). Elasticity measures HOW MUCH quantity responds, in percentage terms, not merely which way it moves.",
  },
  invert: {
    label: "Inverts the elasticity formula",
    explanation:
      "This answer divides the percentage change in price by the percentage change in quantity, upside down. The inverted ratio flips elastic and inelastic classifications, so every pricing conclusion drawn from it reverses.",
  },
};

function clusterKey(note) {
  if (/Absolute change|Units-based/i.test(note)) return "abs";
  if (/Slope/i.test(note)) return "slope";
  if (/law of demand/i.test(note)) return "law";
  if (/Inverted/i.test(note)) return "invert";
  return null;
}

function scoresFor(label, note) {
  if (label === "correct") return [1, 1, 1];
  if (label === "misconception") {
    if (/Slope/i.test(note)) return [0.5, 0, 0];
    if (/Inverted/i.test(note)) return [0.5, 0.5, 0];
    return [0, 0, 0];
  }
  // partial variants
  if (/no explicit percentage formula/i.test(note)) return [0.5, 1, 1];
  if (/Example only/i.test(note)) return [0, 0.5, 0.5];
  if (/Vague/i.test(note)) return [0.5, 0, 0];
  if (/Calculation|Bare calculation|Correct calc/i.test(note)) return [1, 1, 0];
  // definition-only family
  return [1, 0, 0];
}

// deterministic confidence per id
function conf(id, label) {
  const n = parseInt(id.slice(1), 10);
  const jitter = ((n * 7) % 10) / 100; // 0.00..0.09
  if (label === "correct") return +(0.86 + jitter).toFixed(2);
  if (label === "misconception") return +(0.83 + jitter).toFixed(2);
  return +(0.68 + jitter).toFixed(2);
}

function evidence(text) {
  if (text.length <= 110) return text;
  const cut = text.slice(0, 110);
  const sp = cut.lastIndexOf(" ");
  return cut.slice(0, sp > 60 ? sp : 110);
}

const perResponse = demo.responses.map((r) => {
  const { label, note } = gt[r.id];
  const criterionScores = scoresFor(label, note);
  const draftMark =
    Math.round(criterionScores.reduce((s, v, i) => s + v * rubric[i].maxMarks, 0) * 10) / 10;
  const key = label === "misconception" ? clusterKey(note) : null;
  return {
    id: r.id,
    category: label,
    modelCategory: label,
    misconception: key ? CLUSTERS[key].label : null,
    evidence: evidence(r.text),
    confidence: conf(r.id, label),
    criterionScores,
    draftMark,
  };
});

// clusters
const clusterMap = new Map();
for (const p of perResponse) {
  if (p.misconception) {
    if (!clusterMap.has(p.misconception)) clusterMap.set(p.misconception, []);
    clusterMap.get(p.misconception).push(p.id);
  }
}
const clusters = [...clusterMap.entries()]
  .map(([label, ids]) => ({
    label,
    explanation: Object.values(CLUSTERS).find((c) => c.label === label).explanation,
    responseIds: ids,
    avgConfidence:
      Math.round(
        (ids.reduce((s, id) => s + perResponse.find((p) => p.id === id).confidence, 0) /
          ids.length) * 100
      ) / 100,
  }))
  .sort((a, b) => b.responseIds.length - a.responseIds.length);

// gap map
const gapMap = rubric.map((r, i) => {
  const mean = perResponse.reduce((s, p) => s + p.criterionScores[i], 0) / perResponse.length;
  const masteryPct = Math.round(mean * 100);
  return { criterion: r.name, masteryPct, level: masteryPct < 50 ? "critical" : masteryPct < 75 ? "warning" : "good" };
});

const targets = perResponse
  .filter((p) => p.category === "misconception" || p.category === "partial")
  .map((p) => p.id);
const weakest = [...gapMap].sort((a, b) => a.masteryPct - b.masteryPct)[0];
const dominant = clusters[0];

const analysis = {
  perResponse,
  clusters,
  gapMap,
  recommendation: {
    type: "Targeted revision session: interpreting elasticity",
    durationMin: 15,
    targetDescription: `The ${targets.length} students with partial understanding or an active misconception, prioritising the ${dominant.responseIds.length} who confuse elasticity with absolute change`,
    targetIds: targets,
    rationale: `${weakest.criterion} is the weakest rubric criterion at ${weakest.masteryPct}% class mastery, and the dominant misconception (\u201c${dominant.label}\u201d, ${dominant.responseIds.length} students) directly attacks it. A short focused session on percentage-based interpretation with one worked contrast (units vs percentages) addresses both at once.`,
    followUp: "5-question diagnostic on interpretation within 3 days; re-run this analysis on the results.",
  },
  meta: {
    model: "cached-demo (generated from curated ground truth)",
    latencyMs: 0,
    disclaimer: "AI-generated analysis. All marks are drafts. A teacher reviews every decision.",
    source: "cached",
  },
};

writeFileSync("public/demo-results.json", JSON.stringify(analysis, null, 2));
const counts = perResponse.reduce((a, p) => ((a[p.category] = (a[p.category] || 0) + 1), a), {});
console.log("counts:", counts);
console.log("gapMap:", gapMap);
console.log("targets:", targets.length, "| clusters:", clusters.map((c) => `${c.label} x${c.responseIds.length}`));
