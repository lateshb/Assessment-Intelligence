# PRD — Assessment Intelligence & Learning-Gap Engine
**Version 1.0 · DTAI Capstone (IIM Lucknow) · Anchored to PhysicsWallah**

---

## 0. One-sentence use case (do not drift from this)

> This application predicts the **misconception behind each student response** for **faculty**, so that **targeted remediation can be decided faster and better**.

If a proposed feature does not serve this sentence, do not build it.

## 1. Context and goal

This app is the working proof-of-concept for use case #1 of an AI transformation strategy presented to a Board panel. It is graded on: Problem-Solution Fit (25%), AI Capability Integration (25%), Functionality & UX (20%), Live Deployment (15%), Business Impact Articulation (15%).

Design principles that flow from the grading:
- The AI classification IS the product. Not a chatbot, not cosmetic AI.
- Honesty beats accuracy: show confidence, state limitations, never overclaim.
- A non-technical Board member must be able to drive it without help.
- The app must articulate its own business impact on screen.
- Must run flawlessly at a public Vercel URL during a 3–5 minute live demo.

## 2. Users

- **Primary: Faculty member** at a coaching institute. Uploads an assessment, reads the diagnosis, approves or rejects the recommended intervention.
- **Secondary: Board panelist** clicking through in a demo. Needs a "Load demo data" path that works in one click.

## 3. Core user journey (mirrors the strategy: Assess → Diagnose → Recommend → Intervene → Measure)

1. Teacher enters a question, a marking rubric, and a batch of student responses (or clicks Load demo data).
2. AI classifies every response by the misconception behind it, not just right/wrong.
3. Teacher reads the class gap map and misconception clusters with evidence.
4. AI proposes one specific intervention; teacher **Approves / Modifies / Rejects**.
5. App confirms the decision, logs it, and states the impact ("32 of 50 targeted instead of reteaching all 50").

## 4. Screens

### Screen 1 — Setup (`/`)
- App header: name, tagline **"AI recommends. Teachers decide."**
- **Question** textarea.
- **Rubric editor**: rows of {criterion name, what full marks looks like, max marks}. Start with 3 rows, allow 2–5.
- **Responses input** with two tabs:
  - Paste: one response per line OR separated by `---`.
  - Upload CSV with columns `id,response`.
- **Load demo data** button: fills all fields from `/public/demo-data.json` instantly.
- **Analyze** button → full-screen loading state with staged text ("Reading rubric… Classifying 50 responses… Building gap map…"). Disable while running.
- Validation: minimum 5 responses, non-empty question and rubric. Friendly inline errors, never a crash.

### Screen 2 — Analysis dashboard (shown after analyze completes)
- **Summary strip**: total responses; counts + percentages as colored chips: Correct (green), Partially correct (amber), Misconception (red), Needs teacher review (grey).
- **Misconception clusters**: cards sorted by count desc. Each card: cluster label (e.g., "Confuses elasticity with absolute change"), count and %, one-paragraph plain-language explanation of the misconception, 2–3 verbatim evidence quotes from actual responses, average confidence badge.
- **Learning-gap map**: horizontal bar per rubric criterion showing % class mastery. Color: green ≥75%, amber 50–74%, red <50%. Tag the lowest as **CRITICAL GAP**.
- **Response detail table** (collapsible): id, response snippet, category, misconception label, confidence, and a **draft mark clearly labeled "DRAFT — teacher confirms"**. Never present a mark as final.
- Every AI-produced element carries a small "AI" badge.

### Screen 3 — Recommendation panel (below or beside the dashboard)
- **AI recommendation card**: intervention type and duration (e.g., "15-minute targeted revision on interpretation"), target group with exact numbers pulled from the analysis, rationale that cites the gap map ("Interpretation mastery is 41%, driven by 11 responses confusing elasticity with absolute change"), and a suggested follow-up (e.g., 5-question diagnostic).
- Three buttons: **Approve** / **Modify** (opens the recommendation as editable text, then save) / **Reject** (quick-pick reason chips: "Not the real gap", "No class time", "Will handle differently", "Other").
- Post-decision state: confirmation banner + impact line, e.g., **"Intervention approved for 32 students · Targeted teaching instead of reteaching all 50 · logged 14:32"**.
- **Decision log**: session list of {time, decision, intervention summary}; persist in localStorage so a refresh doesn't lose it.

## 5. AI behavior and API contract

Single serverless route: `POST /api/analyze`.

Request:
```json
{ "question": "...", "rubric": [{"name":"...","description":"...","maxMarks":2}], "responses": [{"id":"R01","text":"..."}] }
```

Behavior:
- One batched LLM call (all responses in one prompt) using the system prompt in `ai-classification-prompt.md`, with JSON-mode / structured output, temperature 0.
- The LLM returns per-response: category, misconception label (or null), verbatim evidence quote, confidence 0–1, per-criterion mastery score (0 / 0.5 / 1), draft mark.
- **The server, not the LLM, computes aggregates** (cluster counts, gap-map percentages) from the per-response objects, so the math is deterministic and defensible in Q&A.
- The LLM also returns cluster definitions and ONE recommended intervention.
- Any response with confidence < 0.6 is moved to "Needs teacher review" regardless of its category.

Response:
```json
{
  "perResponse": [...],
  "clusters": [{"label":"...","explanation":"...","responseIds":[...],"avgConfidence":0.86}],
  "gapMap": [{"criterion":"...","masteryPct":41,"level":"critical"}],
  "recommendation": {"type":"...","durationMin":15,"targetIds":[...],"rationale":"...","followUp":"..."},
  "meta": {"model":"<model-id>","latencyMs":0,"disclaimer":"AI-generated analysis. All marks are drafts. A teacher reviews every decision."}
}
```

Model: current fast Gemini model (e.g., `gemini-3.5-flash`). Keep the model id in **one constant** so it can be swapped (model-agnostic principle). API key only via `process.env.GEMINI_API_KEY`, never in client code.

## 6. Demo mode and failure fallback

- Ship `/public/demo-results.json`: a pre-computed, hand-checked analysis of the demo data.
- If `/api/analyze` fails or exceeds 45s, show a non-scary notice ("Live model unavailable — showing cached analysis of the same data") and render demo results. The demo must never dead-end in front of the Board.
- Add a hidden query flag `?demo=1` that skips the API entirely and loads cached results (for rehearsal and connectivity-risk days).

## 7. Guardrails (non-negotiable)

1. No demographic inputs anywhere; the AI never infers identity, gender, or background.
2. Marks are always drafts; no AI output is final without teacher action.
3. Confidence is always visible; low-confidence responses go to human review.
4. Persistent footer on results: *"AI-assisted analysis on this page is probabilistic and can be wrong. Every mark and intervention requires teacher approval. Prototype runs on synthetic data."*
5. Approve/Modify/Reject actions are logged.

## 8. Data model (TypeScript)

```ts
type Rubric = { name: string; description: string; maxMarks: number };
type StudentResponse = { id: string; text: string };
type Category = "correct" | "partial" | "misconception" | "needs_review";
type PerResponse = {
  id: string; category: Category; misconception: string | null;
  evidence: string; confidence: number;         // 0..1
  criterionScores: number[];                    // 0 | 0.5 | 1 per rubric criterion
  draftMark: number;                            // out of total maxMarks
};
type Decision = { at: string; action: "approve"|"modify"|"reject"; summary: string; reason?: string };
```

## 9. Tech stack and constraints

- Next.js (App Router) + TypeScript + Tailwind CSS. No component library needed; simple clean cards.
- Charts: plain divs/bars are fine (no chart library required); recharts allowed if trivial.
- No database, no auth. State in React; decision log in localStorage.
- Mobile-responsive enough to look sane on a phone (Board members will try).
- Deployed on Vercel free tier. `GEMINI_API_KEY` as an environment variable.
- Design: professional, education-appropriate. Deep navy `#26306A` primary, amber `#F5A623` accent, generous whitespace, no clutter. Looks like a product, not a hackathon.

## 10. Acceptance criteria (all must pass before demo day)

- [ ] Load demo data → Analyze produces: 18 correct, 21 partial, 11 misconception (±: needs_review may pull from any bucket if confidence is low; totals always 50).
- [ ] Gap map shows Interpretation as the critical gap.
- [ ] Recommendation cites real numbers from the current analysis, not hardcoded text.
- [ ] Approve, Modify, and Reject each produce a logged, visible outcome.
- [ ] Draft marks are labeled as drafts everywhere they appear.
- [ ] Confidence badges visible; at least the limitations footer present on results.
- [ ] Paste input, CSV input, and demo data all work; 5 varied manual test inputs (incl. one gibberish response) handled gracefully.
- [ ] Analyze completes in under ~30s on 50 responses; loading state shown throughout.
- [ ] `?demo=1` and API-failure fallback both render cached results.
- [ ] Works on a fresh incognito browser and on a phone at the public Vercel URL.
- [ ] No API key anywhere in client bundle or repository.
- [ ] README explains setup, env vars, and discloses AI-generated code.

## 11. Non-goals (do not build)

Authentication, student-facing views, gradebook export, multi-assessment history, real PII handling, payments, notifications, multi-language UI.

## 12. Deliverables

Public Vercel URL + GitHub repository + this PRD in the repo + README with AI-code disclosure.
