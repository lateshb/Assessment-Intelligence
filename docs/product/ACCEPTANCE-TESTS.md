# Acceptance Tests — Assessment Intelligence

## 1. Test organization

Each feature task includes its own acceptance tests. This document defines the acceptance criteria that must pass before a feature is considered complete.

Tests are organized by feature area and numbered for reference in task completion reports.

---

## 2. Existing prototype tests (P0 — must continue to pass)

These are the acceptance criteria from the original `PRD.md` that the current prototype satisfies. They must not regress during V2 development.

| ID | Criterion | Status |
|---|---|---|
| P0-01 | Load demo data → Analyze produces: 18 correct, 21 partial, 11 misconception (±needs_review) | ✅ Pass |
| P0-02 | Gap map shows Interpretation as the critical gap | ✅ Pass |
| P0-03 | Recommendation cites real numbers from the current analysis | ✅ Pass |
| P0-04 | Approve, Modify, and Reject each produce a logged, visible outcome | ✅ Pass |
| P0-05 | Draft marks are labeled as drafts everywhere they appear | ✅ Pass |
| P0-06 | Confidence badges visible; limitations footer present on results | ✅ Pass |
| P0-07 | Paste input, CSV input, and demo data all work | ✅ Pass |
| P0-08 | Analyze completes in under ~30s on 50 responses | ✅ Pass |
| P0-09 | `?demo=1` and API-failure fallback both render cached results | ✅ Pass |
| P0-10 | Works on a fresh incognito browser and on a phone | ✅ Pass |
| P0-11 | No API key anywhere in client bundle or repository | ✅ Pass |
| P0-12 | README explains setup, env vars, and discloses AI-generated code | ✅ Pass |

---

## 3. Authentication acceptance tests

| ID | Criterion |
|---|---|
| AUTH-01 | Google sign-in redirects to Google OAuth and returns to app |
| AUTH-02 | Successful sign-in creates a profile record with role 'teacher' |
| AUTH-03 | Authenticated user sees dashboard; unauthenticated sees landing page |
| AUTH-04 | Protected routes redirect to login when unauthenticated |
| AUTH-05 | Sign-out clears session and redirects to landing |
| AUTH-06 | API routes return 401 without valid session |
| AUTH-07 | Session refresh works transparently (no manual re-login for active users) |

---

## 4. Multi-question acceptance tests

| ID | Criterion |
|---|---|
| MQ-01 | New assessment starts with one empty question |
| MQ-02 | "Add Question" creates a new question in the assessment |
| MQ-03 | Questions are collapsible/expandable |
| MQ-04 | Per-question Analyze works independently |
| MQ-05 | "Analyze All" processes all ready questions; skips not-ready ones |
| MQ-06 | One failed question in Analyze All does not fail others |
| MQ-07 | Editing question text after analysis shows stale warning |
| MQ-08 | Editing rubric after analysis shows stale warning |
| MQ-09 | Editing responses after analysis shows stale warning |
| MQ-10 | Delete question works (with confirmation) |
| MQ-11 | Delete blocked when only one question remains |
| MQ-12 | Duplicate question creates a copy without analysis |
| MQ-13 | Reset question clears all inputs (with confirmation) |
| MQ-14 | Assessment status updates correctly (draft → partial → complete) |

---

## 5. Rubric Library acceptance tests

| ID | Criterion |
|---|---|
| RL-01 | Library rubrics are browsable at `/rubric-library` |
| RL-02 | Rubrics are filterable by course |
| RL-03 | Applying a library rubric to a question copies a snapshot |
| RL-04 | Editing the library rubric does NOT change existing snapshots |
| RL-05 | Saving a question's custom rubric to the library works |
| RL-06 | Only owner/admin can edit/delete library rubrics |
| RL-07 | All institution members can view library rubrics |
| RL-08 | Validation enforces 2–5 criteria, names required |

---

## 6. Analysis History acceptance tests

| ID | Criterion |
|---|---|
| AH-01 | History view shows assessments with name, date, question count, status |
| AH-02 | Clicking an assessment shows its questions with analysis summaries |
| AH-03 | Previous analyses are preserved and viewable |
| AH-04 | Stale analyses are marked as stale in history |
| AH-05 | Teacher decisions are shown with their analysis |
| AH-06 | Private assessments are not visible to other teachers |
| AH-07 | Institution-shared assessments are visible to institution members |

---

## 7. Security acceptance tests

| ID | Criterion |
|---|---|
| SEC-01 | RLS prevents Teacher A from reading Teacher B's private assessments |
| SEC-02 | RLS allows institution members to read institution-shared assessments |
| SEC-03 | RLS allows specifically shared teachers to read shared assessments |
| SEC-04 | API key is not in client bundle |
| SEC-05 | Service role key is not in client code |
| SEC-06 | Teacher decisions are only visible to the decision maker |
| SEC-07 | Rubric library entries are readable by all institution members |
| SEC-08 | Only owner/admin can modify rubric library entries |

---

## 8. Persistence acceptance tests

| ID | Criterion |
|---|---|
| PERS-01 | Save Draft persists assessment to Supabase |
| PERS-02 | Reloading the page shows the saved assessment |
| PERS-03 | Analysis results are persisted immediately on completion |
| PERS-04 | Teacher decisions are persisted to Supabase (not just localStorage) |
| PERS-05 | Assessment updates reflect in history |
