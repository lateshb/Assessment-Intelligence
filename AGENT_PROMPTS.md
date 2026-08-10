# Agent Prompts — build sequence for Antigravity

How to use: open the project folder in Antigravity with `PRD.md`, `ai-classification-prompt.md`, and `demo-data.json` already inside it. Paste the **Session rules** at the start of every new agent session, then run prompts P0 → P8 in order. Verify each step in the browser before moving on. Commit after every prompt that passes.

---

## Session rules (paste first, every session)

```
Rules for this project:
1. PRD.md in this repo is the source of truth. Before building anything, read it. If my request conflicts with the PRD, tell me instead of silently choosing.
2. Build ONLY what the current prompt asks. No extra features, no speculative abstractions, no auth.
3. When I report a bug, make the smallest targeted fix. Do not refactor unrelated code.
4. TypeScript strict, App Router, Tailwind. No new dependencies without asking me first.
5. After each task: run the dev server, open the browser, and verify the feature works before telling me it is done. Show me what you verified.
6. The Gemini API key comes only from process.env.GEMINI_API_KEY. Never print it, never put it in client code.
7. Keep the LLM model id in one constant file so it can be swapped.
```

---

## P0 — Scaffold

```
Read PRD.md fully. Then scaffold the project: Next.js (App Router) + TypeScript + Tailwind, with the folder structure you'll need for the three screens and the /api/analyze route. Put demo-data.json into /public. Create a constants file with the model id and the shared TypeScript types from PRD section 8. Add a minimal home page with the app header and tagline so I can see it running. Start the dev server and confirm it renders.
```

## P1 — Screen 1: Setup

```
Build Screen 1 exactly per PRD section 4: question textarea, rubric editor (3 default rows, add/remove between 2 and 5), responses input with Paste and CSV tabs, the "Load demo data" button that fills everything from /public/demo-data.json (use its question, rubric, and responses fields; ignore any field named intendedLabel or intendedNote — that is validation-only ground truth and must never be sent to the API or shown in the UI), validation (min 5 responses), and the Analyze button with the staged loading state. Analyze can call a stub for now that returns after 2 seconds. Verify in the browser: demo button fills the form, validation blocks empty submits, loading state shows.
```

## P2 — The AI route

```
Implement POST /api/analyze per PRD section 5. Use the system prompt in ai-classification-prompt.md verbatim, filling its placeholders. One batched call to the Gemini API with structured JSON output and temperature 0. Parse defensively: strip code fences, validate the shape, and if a response object is malformed, put that response into needs_review rather than failing the whole request. The server computes cluster counts and gap-map percentages from perResponse criterionScores — do not trust any aggregate number the LLM returns. Apply the confidence < 0.6 → needs_review rule. Return the exact response shape from the PRD. Then test it by POSTing the demo data and print me the summary counts and the gap map you got back.
```

## P3 — Screen 2: Analysis dashboard

```
Build the analysis dashboard per PRD section 4 Screen 2: summary strip with colored chips, misconception cluster cards with evidence quotes and confidence badges, the learning-gap map as horizontal bars with the CRITICAL GAP tag, and the collapsible response table with draft marks labeled "DRAFT — teacher confirms". Add the "AI" badges and the permanent limitations footer from PRD section 7. Wire it to the real /api/analyze. Verify in the browser with demo data and tell me the counts you see on screen.
```

## P4 — Screen 3: Recommendation + decision log

```
Build the recommendation panel per PRD section 4 Screen 3: the AI recommendation card whose numbers come from the live analysis object (never hardcoded), Approve / Modify / Reject flows including the modify editor and reject reason chips, the post-decision confirmation with the impact line, and the decision log persisted to localStorage. Verify all three decision paths in the browser and show me the log surviving a page refresh.
```

## P5 — Demo mode and failure fallback

```
Implement PRD section 6: generate /public/demo-results.json by running the real API once on the demo data and saving the output (I will hand-check it). Add the ?demo=1 flag that skips the API and renders those cached results, and the automatic fallback when /api/analyze errors or exceeds 45 seconds, with the notice text from the PRD. Verify both paths: once with ?demo=1, once by temporarily breaking the API key locally.
```

## P6 — Polish pass

```
Do one polish pass against PRD sections 4, 7, and 9 only: empty states, error states, mobile responsiveness (test at 390px width), consistent navy/amber styling, focus states, and remove any leftover console noise. Do not add features. Then walk every acceptance criterion in PRD section 10 in the browser and give me a pass/fail table.
```

## P7 — README + deploy prep

```
Write the README: what the app does (use the one-sentence use case), local setup, GEMINI_API_KEY env var instructions, deploy-on-Vercel steps, the demo-mode flag, known limitations, and an academic-integrity note disclosing that the code was AI-generated via vibe coding under team direction. Confirm .env.local is gitignored and the key appears nowhere in the repo or client bundle.
```

## P8 — Pre-demo hardening

```
Run these five manual tests and fix only what fails, with targeted fixes: (1) demo data end-to-end including all three decision paths; (2) 6 pasted responses of varied quality; (3) a CSV upload; (4) one gibberish/off-topic response mixed into real ones — it must land in needs_review or misconception without crashing; (5) the whole flow at 390px mobile width. Report results as a table.
```

---

## Reusable debugging prompt

```
Bug: [what happened]. Expected: [what should happen]. Steps: [how to reproduce].
Find the root cause first and tell me what it is in one or two sentences, then make the smallest fix that resolves it. Do not refactor or reformat anything else. Verify the fix in the browser and confirm nothing adjacent broke.
```

## Reusable audit prompt (run before demo day)

```
Audit the current app against PRD.md section by section. List every mismatch as: [PRD line] → [what the app does instead] → [proposed minimal fix]. Do not change any code yet; wait for my go-ahead per item.
```
