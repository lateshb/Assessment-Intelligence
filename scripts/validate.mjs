// Measures live-model agreement against the curated ground truth.
// Usage: GEMINI_API_KEY=... node scripts/validate.mjs [BASE_URL]
// Default BASE_URL http://localhost:3000 (run `npm run dev` first).
import { readFileSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
const demo = JSON.parse(readFileSync("public/demo-data.json", "utf8"));
const gt = JSON.parse(readFileSync("data/ground-truth.json", "utf8"));

const res = await fetch(`${base}/api/analyze`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(demo),
});
if (!res.ok) {
  console.error("API error", res.status, await res.text());
  process.exit(1);
}
const analysis = await res.json();

let agree = 0, review = 0;
const misses = [];
for (const p of analysis.perResponse) {
  const truth = gt[p.id]?.label;
  const predicted = p.category === "needs_review" ? p.modelCategory : p.category;
  if (p.category === "needs_review") review++;
  if (predicted === truth) agree++;
  else misses.push(`${p.id}: truth=${truth} predicted=${predicted} conf=${p.confidence} note="${gt[p.id]?.note}"`);
}
const n = analysis.perResponse.length;
console.log(`Agreement: ${agree}/${n} (${Math.round((agree / n) * 100)}%) · routed to needs_review: ${review}`);
console.log(`Gap map:`, analysis.gapMap.map((g) => `${g.criterion} ${g.masteryPct}%`).join(" · "));
if (misses.length) {
  console.log("\nDisagreements (borderline cases are expected and are demo material, not failures):");
  for (const m of misses) console.log(" -", m);
}
