# Multi-Question Assessment Design

## 1. Core principle

An Assessment is the parent entity. It contains one or more Questions. Each question is independently analyzable.

## 2. Assessment lifecycle

```
Create → Add questions → Fill inputs → Analyze → Decide → Save Draft
                ↑                          ↓
                └──── Add more questions ──┘
```

### 2.1 Creation

- Teacher clicks "New Assessment"
- Assessment starts with one empty question
- Name is optional (can be set at any time)
- Status: `draft`

### 2.2 Adding questions

- "Add Question" button adds a new empty question below the last one
- Questions are numbered by position (Q1, Q2, Q3…)
- No upper limit on question count in V1 (practical limit ~20)

### 2.3 Question independence

Each question has its own:
- Question text
- Rubric (custom or from library, snapshotted)
- Student responses
- Analysis
- Recommendation
- Teacher decision

A question is **ready for analysis** when it has:
- Non-empty question text
- At least 2 rubric criteria (each with a name)
- At least 5 student responses

### 2.4 Analyze All

"Analyze All" at the assessment level:
1. Identifies all questions that are ready for analysis
2. Processes each question independently (separate LLM calls)
3. Shows per-question progress indicators
4. One failed question does NOT fail others
5. Failed questions show an error with retry option

### 2.5 Assessment status

| Status | Condition |
|---|---|
| `draft` | No questions analyzed |
| `partial` | Some questions analyzed, some not |
| `complete` | All questions have a current analysis |
| `archived` | Manually archived by teacher |

Status is computed, not manually set (except `archived`).

## 3. Question UI states

### 3.1 Collapsed view

Shows:
- Position number (Q1, Q2…)
- Question text preview (first ~80 chars)
- Status indicator (empty / filled / analyzed / stale)
- Expand button

### 3.2 Expanded view

Shows the full question editing interface:
- Question text textarea
- Rubric editor (same as current prototype)
- Responses input (paste / CSV, same as current)
- Per-question Analyze button
- Results (if analyzed, inline below)
- Recommendation + decision (if analyzed)

### 3.3 Action menu

Each question has an action menu ("⋯") with:

| Action | Behavior | Confirmation |
|---|---|---|
| Edit | Expand to edit mode | No |
| Duplicate | Copy question (without analysis) | No |
| Reset question | Clear all inputs and analysis | Yes |
| Clear rubric | Remove rubric, mark analysis stale | Yes (if analysis exists) |
| Clear responses | Remove responses, mark analysis stale | Yes (if analysis exists) |
| Delete | Remove from assessment | Yes (blocked if only question) |

## 4. Staleness handling

When a question has a current analysis and the teacher edits:
- **Question text**: analysis becomes stale
- **Rubric criteria**: analysis becomes stale
- **Student responses**: analysis becomes stale

Stale analysis display:
- Warning banner: "Inputs changed since last analysis. Re-analyze to update."
- Old results still visible but visually de-emphasized
- "Re-analyze" button prominently displayed
- Old analysis preserved in history

## 5. Data flow

```
Teacher input → Question state (local) → Save Draft → Supabase
                                              ↓
Question state → POST /api/analyze → Analysis result → Save → Supabase
                                              ↓
Analysis result → Teacher decision → Decision record → Save → Supabase
```

All state is local until "Save Draft" is explicitly clicked. Analysis results are persisted immediately on completion (exception to the explicit-save rule, since they involve an LLM call).

## 6. Migration from prototype

The current prototype has a single-question flow (AppFlow → Results → Recommendation). The migration path:

1. Extract question-level state into a `Question` component
2. Assessment wrapper manages a list of questions
3. AppFlow becomes the assessment workspace orchestrator
4. Results and Recommendation components receive per-question data
5. Preserve all existing UI patterns and component logic
