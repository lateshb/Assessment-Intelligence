# Agent Prompts — Assessment Intelligence

> **Note:** This file was the build sequence for the original capstone prototype (P0–P8). The prototype is complete and deployed.
>
> The project has transitioned to a structured task queue. See:
> - `docs/agent/TASK-QUEUE.md` — Current implementation plan
> - `docs/agent/CURRENT-STATE.md` — What exists today
> - `docs/agent/DECISIONS.md` — Locked decisions
> - `AGENTS.md` — Operating rules for all agents
>
> The prompts below are preserved for historical reference only. Do not use them for new work.

---

## Historical build sequence (prototype, completed)

### Session rules (used during prototype build)

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

### P0 — Scaffold ✅
### P1 — Screen 1: Setup ✅
### P2 — The AI route ✅
### P3 — Screen 2: Analysis dashboard ✅
### P4 — Screen 3: Recommendation + decision log ✅
### P5 — Demo mode and failure fallback ✅
### P6 — Polish pass ✅
### P7 — README + deploy prep ✅
### P8 — Pre-demo hardening ✅

---

## Reusable debugging prompt (still useful)

```
Bug: [what happened]. Expected: [what should happen]. Steps: [how to reproduce].
Find the root cause first and tell me what it is in one or two sentences, then make the smallest fix that resolves it. Do not refactor or reformat anything else. Verify the fix in the browser and confirm nothing adjacent broke.
```

## Reusable audit prompt (still useful)

```
Audit the current app against PRD.md section by section. List every mismatch as: [PRD line] → [what the app does instead] → [proposed minimal fix]. Do not change any code yet; wait for my go-ahead per item.
```
