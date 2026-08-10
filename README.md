# Assessment Intelligence — Learning-Gap Engine

> This application predicts the **misconception behind each student response** for **faculty**, so that **targeted remediation can be decided faster and better**. AI recommends. Teachers decide.

Working prototype for the DTAI Capstone (IIM Lucknow) — use case #1 of an AI transformation strategy anchored to PhysicsWallah. Built by vibe coding.

## What it does
Teacher enters a question, a 2–5 criterion rubric, and 5–50 student responses (paste / CSV / one-click demo data). One batched, temperature-0 LLM call classifies every response by the belief behind it, clusters misconceptions with verbatim evidence and confidence scores, computes a per-criterion learning-gap map, and proposes exactly one intervention which the teacher **approves, modifies, or rejects** (logged). Draft marks are never final without a teacher.

## Run locally
```bash
npm install
cp .env.example .env.local        # add your key
npm run dev                       # http://localhost:3000
```
`.env.local`:
```
GEMINI_API_KEY=your_key_from_Google_AI_Studio
```
No key? The app still works: any model failure automatically falls back to a cached analysis of the demo dataset, and `?demo=1` forces that path (used for connectivity-proof live demos).

## Deploy (Vercel)
1. Push this repo to GitHub.
2. Vercel → Add New Project → import the repo.
3. Add `GEMINI_API_KEY` under Environment Variables **before** deploying.
4. Deploy; test the URL on a fresh device and a phone.

## Structure
```
src/app/page.tsx                 # main flow (Assess → Diagnose → Recommend → Intervene)
src/app/how-to-use/              # user guide + 3-minute demo script
src/app/build-and-scale/         # architecture + production ML roadmap (Azure/Vertex)
src/app/api/analyze/route.ts     # the ONLY place the LLM vendor is touched
src/lib/prompt.ts                # the classification prompt (see ai-classification-prompt.md)
src/lib/aggregate.ts             # deterministic server-side math (marks, clusters, gap map)
src/lib/constants.ts             # swappable MODEL_ID, confidence threshold
public/demo-data.json            # 50 curated synthetic responses (no ground truth)
public/demo-results.json         # hand-checkable cached analysis (fallback + ?demo=1)
data/ground-truth.json           # validation-only labels — never sent to the model
scripts/generate-demo-results.mjs# regenerates the cached analysis
scripts/validate.mjs             # measures live-model agreement vs ground truth
```

## Validate the classifier (needs a key)
```bash
node scripts/validate.mjs        # prints agreement % vs data/ground-truth.json
```

## Guardrails
No demographic inputs; marks always drafts; confidence always visible; <60% confidence auto-routes to "Needs teacher review"; approve/modify/reject logged; API key only in env vars.

## Academic integrity disclosure
All application code in this repository was AI-generated through vibe coding (natural-language direction of AI coding assistants) under the team's design direction, per the capstone's disclosure requirement. The product spec is in `PRD.md`; the AI prompt contract is in `ai-classification-prompt.md`. Synthetic data only; no real student data was used.
