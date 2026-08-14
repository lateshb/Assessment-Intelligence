# Master Context — Assessment Intelligence

> **Single-sentence purpose:** Predict the misconception behind each student response so faculty can decide targeted remediation faster and better.

## 1. Product identity

| Field | Value |
|---|---|
| Name | Assessment Intelligence |
| Tagline | AI recommends. Teachers decide. |
| Production URL | https://assessment-intelligence.vercel.app |
| Repository | lateshb/Assessment-Intelligence |
| Stack | Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Vercel |
| AI provider | Google Gemini (gemini-3.5-flash, swappable via one constant) |
| Database (planned) | Supabase (Free tier) |
| Auth (planned) | Supabase Auth with Google sign-in |

## 2. Origin and current phase

Assessment Intelligence started as a DTAI Capstone prototype (IIM Lucknow), anchored to PhysicsWallah. The working prototype demonstrates the core AI classification loop:

1. Teacher enters a question, rubric, and student responses
2. One batched LLM call classifies every response by misconception
3. Server-side aggregation computes deterministic gap maps, clusters, and draft marks
4. Teacher reads diagnosis, AI proposes one intervention
5. Teacher Approves / Modifies / Rejects (logged to localStorage)

The prototype is **fully functional for single-question analysis** with demo data and live model calls. It has no authentication, no database, no multi-question assessments, and no persistent storage beyond localStorage.

## 3. Where we are going

The product is evolving from a demo prototype into a multi-tenant, multi-question assessment platform with:

- **Authentication** (Supabase Auth + Google sign-in)
- **Multi-question assessments** (assessment → questions → analyses)
- **Rubric Library** (reusable rubrics organized by course)
- **Analysis History** (assessment-first, persisted in Supabase)
- **Institution-level multi-tenancy** with two roles: teacher and admin
- **Row Level Security** protecting teacher-private and institution-shared data

## 4. Product hierarchy

```
Institution
  ├── Teachers / Admins
  ├── Courses
  ├── Rubric Library (organized by Course)
  └── Assessments
       └── Questions
            ├── Question text
            ├── Rubric snapshot (copied from library or custom)
            ├── Student responses (anonymous IDs)
            ├── Analysis (per-response classifications + aggregates)
            ├── Recommendation (AI-proposed intervention)
            └── Teacher decision (approve / modify / reject)
```

## 5. What must never change

1. AI recommends; teachers decide. No AI output is final without teacher action.
2. Marks are always drafts.
3. Confidence is always visible; low confidence → human review.
4. No demographic inputs; only response text is analyzed.
5. The LLM provider is isolated behind one constant and one API route.
6. Server-side aggregation computes all numbers deterministically.

## 6. Guiding documents

| Document | Purpose |
|---|---|
| `docs/product/PRODUCT-REQUIREMENTS.md` | Full V2 product requirements |
| `docs/product/UX-REQUIREMENTS.md` | UX patterns, flows, and interaction design |
| `docs/product/DATA-MODEL.md` | Database schema and entity relationships |
| `docs/product/AUTH-MULTITENANCY.md` | Authentication, authorization, and multi-tenancy |
| `docs/product/MULTI-QUESTION.md` | Multi-question assessment design |
| `docs/product/RUBRIC-LIBRARY.md` | Rubric Library design |
| `docs/product/ANALYSIS-HISTORY.md` | Analysis history and persistence |
| `docs/product/SECURITY.md` | Security architecture and RLS policies |
| `docs/product/EDGE-CASES.md` | Edge cases, failure modes, and recovery |
| `docs/product/ACCEPTANCE-TESTS.md` | Acceptance criteria for each feature |
| `docs/agent/CURRENT-STATE.md` | What has been built and what remains |
| `docs/agent/TASK-QUEUE.md` | Sequenced implementation plan |
| `docs/agent/DECISIONS.md` | All locked product and architecture decisions |
| `docs/agent/COMPLETED-TASKS.md` | Log of completed implementation tasks |
| `PRD.md` | Original capstone PRD (preserved for reference) |
