# Current State — Assessment Intelligence

> Last updated: 2026-08-14 (MVP features complete: Multi-Question, Rubric Library, Analysis History)

## 1. What exists today

### 1.1 Multi-question assessment workspace

The application now supports multi-question assessments with per-question analysis. Deployed at https://assessment-intelligence.vercel.app.

**Working features:**
- Multi-question assessments with add/delete/duplicate/reset
- Optional assessment name
- Accordion-style collapsible question cards
- Per-question status: draft → ready → analyzing → analyzed → needs_reanalysis / failed
- Question + rubric + responses input form per question
- Clear rubric / clear responses independently (preserves the other)
- Confirmation dialogs for destructive actions
- Cannot delete the last question
- Duplicate copies inputs but NOT analysis
- Staleness detection: editing after analysis → needs_reanalysis with warning banner
- Per-question "Analyze" using existing `/api/analyze` flow
- "Analyze All" processes ready questions independently (Promise.allSettled)
- One failed question does not fail others
- Inline results and recommendation per question
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
    AppFlow.tsx               ← Thin wrapper → AssessmentWorkspace
    AssessmentWorkspace.tsx    ← Assessment orchestrator (question list, Analyze All, history save)
    QuestionCard.tsx           ← Per-question editing, actions, inline results, Apply Rubric
    HistoryPage.tsx            ← Analysis history (list, detail, Active/Trash)
    RubricEditor.tsx           ← Reusable rubric criteria editor
    RubricPicker.tsx           ← Modal to pick/apply library rubric
    RubricLibraryPage.tsx      ← Rubric Library CRUD page
    Results.tsx               ← Analysis dashboard (191 lines)
    Recommendation.tsx        ← Recommendation + decisions (210 lines)
    ui.tsx                    ← Shared UI primitives (48 lines)
  lib/
    aggregate.ts              ← Deterministic server-side math (200 lines)
    assessment-types.ts       ← QuestionState, AssessmentState, action types
    constants.ts              ← MODEL_ID, thresholds, disclaimer (14 lines)
    prompt.ts                 ← LLM prompt builder (51 lines)
    types.ts                  ← Shared TypeScript types (64 lines)
    use-assessment.ts         ← Assessment state reducer + hook
    use-history.tsx           ← History state reducer + context provider
    use-rubric-library.tsx    ← Rubric Library state reducer + context provider
    history-types.ts          ← HistoryEntry, HistoryQuestion, HistoryAction
    rubric-library-types.ts   ← LibraryRubric, RubricLibraryAction
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

## 2. What exists today (Features)

- [x] Public Logged-Out Landing Page (10 sections: Hero, Product Visual, Workflow, Capabilities, Diagnosis Output, Trust, Comparison, Personas, Interactive Demo CTAs, How It Works guide)
- [x] Dual-Mode Root Routing (Logged-out → PublicLandingPage; Logged-in → AppFlow / AssessmentWorkspace)
- [x] Dynamic AppHeader (Responsive navigation, public anchor links, workspace links, mobile drawer)
- [x] Authenticated User Menu (User identity display, profile initial/avatar, role badge, accessible sign out, loading state, error banner)
- [x] Google OAuth Sign-in (Dynamic origin resolution, mobile touch handling, error banner)
- [x] Supabase Auth + Database Integration (Saved Assessments, Global Rubrics, Analysis History, Teacher Decisions persistence with RLS)
- [x] Multi-question assessments with per-question analysis and staleness detection
- [x] Rubric Library CRUD & snapshotting
- [x] Analysis History with rollback, trash management, and decision tracking
- [x] Automated tests — Vitest + RTL, 197 tests across 16 test suites

## 3. Technical debt & Improvements

| Item | Description | Priority |
|---|---|---|
| ~~Monolithic AppFlow~~ | ~~AppFlow.tsx decomposed into AssessmentWorkspace + QuestionCard + useAssessment~~ | ~~Done~~ |
| ~~Header Dropdown Clipping~~ | ~~Fixed by isolating overflow-x-auto to navigation element~~ | ~~Done~~ |
| ~~Mobile OAuth Redirect~~ | ~~Fixed by using dynamic window.location.origin instead of hardcoded hostname~~ | ~~Done~~ |
| No error boundary | React errors crash the whole page | Medium |
| aggregate.ts null guard | `aggregate()` crashes on null raw input instead of returning all needs_review | Low (fix in T-015) |

## 4. Dependencies

| Package | Version | Purpose |
|---|---|---|
| next | 16.3.0 | Framework |
| react | 19.2.8 | UI library |
| react-dom | 19.2.8 | DOM rendering |
| tailwindcss | ^4 | Styling |
| typescript | ^5 | Type checking |
| @supabase/supabase-js | ^2 | Supabase client |
| @supabase/ssr | ^0.5 | SSR auth helpers |
| vitest | ^4.1.10 | Test runner |
| @testing-library/react | ^16 | Component testing |
| @testing-library/jest-dom | ^7 | DOM matchers |
| @testing-library/user-event | ^14 | User interaction simulation |
| @vitejs/plugin-react | ^6 | Vite React plugin (for JSX in tests) |
| jsdom | ^29 | DOM environment for tests |

## 5. Environment

| Variable | Purpose | Required |
|---|---|---|
| `GEMINI_API_KEY` | Google AI Studio key for model calls | Server-side only |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Client & Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous API key | Client & Server |

Production deployment: Vercel (free tier), connected to GitHub repo `lateshb/Assessment-Intelligence`.
