# Current State — Assessment Intelligence

> Last updated: 2026-08-14 (T-001 complete)

## 1. What exists today

### 1.1 Working prototype (single-question analysis)

The application is a fully functional single-question analysis engine deployed at https://assessment-intelligence.vercel.app.

**Working features:**
- Question + rubric + responses input form
- Load demo data (50 curated economics responses)
- Paste and CSV response input
- One batched Gemini LLM call via `POST /api/analyze`
- Server-side deterministic aggregation (gap map, clusters, draft marks)
- Confidence-based needs_review routing (< 0.6)
- Summary strip with category counts
- Misconception cluster cards with evidence quotes
- Learning-gap map with horizontal bars
- Response detail table with draft mark labels
- AI recommendation card
- Approve / Modify / Reject decision flow
- Decision log in localStorage
- `?demo=1` mode and API failure fallback
- How to use guide page
- Build & scale technical brief page
- Mobile responsive design
- AI disclaimer footer

### 1.2 File structure

```
src/
  app/
    api/analyze/route.ts     ← Single LLM vendor touchpoint
    build-and-scale/page.tsx  ← Technical brief page
    how-to-use/page.tsx       ← User guide page
    globals.css               ← Tailwind + base tokens
    layout.tsx                ← App shell (header, nav, footer)
    page.tsx                  ← Entry point (renders AppFlow)
  components/
    AppFlow.tsx               ← Main flow orchestrator (381 lines)
    Results.tsx               ← Analysis dashboard (191 lines)
    Recommendation.tsx        ← Recommendation + decisions (210 lines)
    ui.tsx                    ← Shared UI primitives (48 lines)
  lib/
    aggregate.ts              ← Deterministic server-side math (200 lines)
    constants.ts              ← MODEL_ID, thresholds, disclaimer (14 lines)
    prompt.ts                 ← LLM prompt builder (51 lines)
    types.ts                  ← Shared TypeScript types (64 lines)
public/
  demo-data.json              ← 50 curated synthetic responses
  demo-results.json           ← Hand-checked cached analysis
data/
  ground-truth.json           ← Validation-only labels (never sent to model)
scripts/
  generate-demo-results.mjs   ← Regenerates cached analysis
  validate.mjs                ← Measures model agreement vs ground truth
```

### 1.3 Architecture principles already established

1. **LLM isolation**: Model vendor touched only in `route.ts` + `constants.ts`
2. **Deterministic aggregation**: All math in `aggregate.ts`, never trusted from model
3. **Defensive parsing**: Handles malformed model output gracefully
4. **Confidence routing**: Low confidence → needs_review regardless of model category
5. **Fallback**: API failure → cached demo results automatically

## 2. What does NOT exist yet

- [ ] Authentication (no sign-in, no user identity)
- [ ] Database (no Supabase, no persistence beyond localStorage)
- [ ] Multi-question assessments (single question only)
- [ ] Rubric Library (rubric is inline per question)
- [ ] Analysis History (no persistence of past analyses)
- [ ] Sharing (no multi-tenancy)
- [x] Automated tests — Vitest + RTL, 63 tests across 4 suites
- [ ] RLS policies (no database yet)
- [ ] Save Draft (no persistence)

## 3. Technical debt

| Item | Description | Priority |
|---|---|---|
| Monolithic AppFlow | AppFlow.tsx (381 lines) handles setup form + results + loading — should decompose | High (before multi-question) |
| localStorage-only decisions | Decision log in localStorage will be lost across devices | Medium (addressed by persistence task) |
| No error boundary | React errors crash the whole page | Medium |
| aggregate.ts null guard | `aggregate()` crashes on null raw input instead of returning all needs_review | Low (fix in T-015) |
| Inline styles via Tailwind classes | Some components have very long class strings | Low (cosmetic) |

## 4. Dependencies

| Package | Version | Purpose |
|---|---|---|
| next | 16.3.0 | Framework |
| react | 19.2.8 | UI library |
| react-dom | 19.2.8 | DOM rendering |
| tailwindcss | ^4 | Styling |
| typescript | ^5 | Type checking |
| vitest | ^4.1.10 | Test runner |
| @testing-library/react | ^16 | Component testing |
| @testing-library/jest-dom | ^7 | DOM matchers |
| @testing-library/user-event | ^14 | User interaction simulation |
| @vitejs/plugin-react | ^6 | Vite React plugin (for JSX in tests) |
| jsdom | ^29 | DOM environment for tests |

No Supabase client yet.

## 5. Environment

| Variable | Purpose | Required |
|---|---|---|
| `GEMINI_API_KEY` | Google AI Studio key for model calls | Server-side only |

Production deployment: Vercel (free tier), connected to GitHub repo `lateshb/Assessment-Intelligence`.
