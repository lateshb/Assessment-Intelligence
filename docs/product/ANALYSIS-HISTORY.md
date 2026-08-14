# Analysis History Design

## 1. Core principle

Analysis History is **assessment-first**, not question-first. Users browse assessments and drill into their questions.

## 2. Data preservation

Every analysis preserves a complete snapshot of the inputs that produced it:

- Question text at analysis time
- Rubric snapshot at analysis time
- Student responses at analysis time
- Model output (per-response classifications)
- Server-computed aggregates (clusters, gap map, recommendation)
- Model info (ID, latency, source)
- Timestamp

This means:
- An analysis is always reviewable in its original context
- Changing the library rubric doesn't alter past analyses
- Changing the question doesn't alter past analyses
- Multiple analyses of the same question (before/after edits) are all preserved

## 3. Current vs. stale

- Only one analysis per question is `is_current = true`
- When question inputs change (text, rubric, or responses), the current analysis's `is_current` is set to `false`
- Re-analyzing creates a new analysis row with `is_current = true`
- Stale analyses are preserved and visible in history

## 4. Assessment history view

### 4.1 Assessment list (`/history`)

| Column | Content |
|---|---|
| Name | Assessment name (or "Untitled Assessment") |
| Date | Last updated |
| Questions | Count (e.g., "3 questions") |
| Status | draft / partial / complete / archived |
| Sharing | Private / Institution / Shared with N teachers |

Sorting: newest first (default), by name, by status.

Filter: by status, by date range, search by name.

### 4.2 Assessment detail (click to expand / navigate)

Shows all questions in the assessment with:
- Question text preview
- Most recent analysis summary (if exists): category counts, critical gap
- Decision status: pending / approved / modified / rejected
- Timestamp of last analysis

### 4.3 Question analysis history (within assessment detail)

For each question, can expand to see:
- **Current analysis**: full results (same as workspace view)
- **Previous analyses**: collapsed list with timestamp, category counts
- Click a previous analysis to view its full results (read-only, with the inputs that produced it)

## 5. Teacher decisions in history

- Each analysis can have one or more teacher decisions
- Decisions are shown with the analysis they belong to
- In the history view, the most recent decision for the current analysis is highlighted

## 6. Sharing in history

- Private assessments: visible only to owner
- Institution-shared: visible to all institution members (read-only)
- Teacher-shared: visible to owner and shared teachers

Shared assessments show the owner's name and sharing status.

## 7. Migration from localStorage

The prototype currently stores decisions in localStorage (`ai-decision-log-v1`). Migration path:

1. Keep localStorage as fallback for unauthenticated demo mode
2. When authenticated, persist decisions to `teacher_decisions` table
3. Do not attempt to migrate old localStorage data (it's synthetic demo data)
