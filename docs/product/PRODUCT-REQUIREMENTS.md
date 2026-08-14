# Product Requirements — Assessment Intelligence V2

> Extends the original `PRD.md` (capstone prototype) with the product evolution described in `MASTER-CONTEXT.md`. The original PRD is preserved for reference.

## 1. Core use case (unchanged)

> This application predicts the **misconception behind each student response** for **faculty**, so that **targeted remediation can be decided faster and better**.

If a proposed feature does not serve this sentence, do not build it.

## 2. Users

| Role | Description |
|---|---|
| **Teacher** | Creates assessments, analyzes student responses, makes intervention decisions. Owns their data. Can share with institution or specific teachers. |
| **Institution Admin** | Manages teachers, views institution-level shared assessments, manages Rubric Library. Does NOT override teacher decisions. |

## 3. Product entities

### 3.1 Assessment

The top-level container. A teacher creates an assessment that contains one or many questions.

- **Name**: optional (defaults to "Untitled Assessment" + date)
- **Status**: `draft` | `partial` (some questions analyzed) | `complete` (all analyzed) | `archived`
- **Sharing**: private | institution | specific teachers (by email/identity)
- **Save**: explicit "Save Draft" — no auto-save

### 3.2 Question

A question lives inside an assessment. Each question is independently analyzable.

- **Question text**: required
- **Rubric**: 2–5 criteria, either custom or copied from Rubric Library (snapshot)
- **Responses**: 5–50 anonymous student responses (`id` + `text`)
- **Analysis**: the result of one LLM classification call
- **Recommendation**: AI-proposed intervention per question
- **Teacher decision**: approve / modify / reject per question

### 3.3 Rubric Library

Reusable rubrics organized by **Course** (flat, no topic/module hierarchy in V1).

- A rubric in the library can be edited at any time
- When a teacher applies a library rubric to a question, it is **copied as a snapshot**
- The snapshot is immutable once analysis has run
- Historical analyses reference the snapshot, never the current library version

### 3.4 Analysis History

- Assessment-first view: browse assessments, then drill into their questions
- Each analysis preserves: question text, rubric snapshot, student responses, LLM output, server-side aggregates, model info, timestamp
- Editing question / rubric / responses after analysis **marks the existing analysis as stale**
- A stale analysis is never silently presented as current

## 4. Core user journey

1. Teacher creates an assessment
2. Adds one or more questions
3. For each question: enters question text, selects/creates rubric, enters student responses
4. Analyzes one question or all ready questions ("Analyze All" processes independently)
5. Reviews diagnosis: summary, misconception clusters, gap map, response detail
6. AI proposes one intervention per question; teacher Approves / Modifies / Rejects
7. Saves the assessment
8. Can view in Analysis History later

## 5. AI behavior (unchanged from prototype)

Single serverless route: `POST /api/analyze`

- One batched LLM call per question, temperature 0, JSON output mode
- Server computes all aggregates deterministically (gap map, cluster counts, draft marks)
- Confidence < 0.6 → needs_review regardless of model's category
- Model provider isolated in `src/lib/constants.ts` and `src/app/api/analyze/route.ts`
- Failures fall back to cached demo analysis

See `ai-classification-prompt.md` for the classification prompt.

## 6. Multi-question rules

1. Assessments contain multiple questions
2. A question can be analyzed independently
3. "Analyze All" processes each ready question independently (parallel, not one giant call)
4. One failed question must not fail the rest
5. Questions should be collapsible/expandable
6. Question actions: edit, duplicate, reset, clear rubric, clear responses, delete
7. Confirmation for destructive actions
8. An assessment always contains at least one question

## 7. Sharing and privacy

1. Three sharing levels: private, institution, specific teachers
2. Specific-teacher sharing uses teacher's email/account identity
3. Teacher-private data is protected at the database level (RLS)
4. Institution sharing is protected at the database level (RLS)
5. Frontend filtering is NOT a security mechanism

## 8. Guardrails (non-negotiable, unchanged)

1. No demographic inputs; the AI never infers identity, gender, or background
2. Marks are always drafts; no AI output is final without teacher action
3. Confidence is always visible; low-confidence responses go to human review
4. Persistent footer on results: disclaimer about probabilistic analysis
5. Approve/Modify/Reject actions are logged
6. Student responses use anonymous IDs only (no names, emails, or PII)

## 9. Non-goals for V1

- Student-facing views
- Gradebook export
- Real PII handling
- Payments / billing
- Notifications / email
- Multi-language UI
- Topic/Module hierarchy in Rubric Library
- Automatic saving
