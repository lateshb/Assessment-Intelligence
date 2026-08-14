# Task Queue — Assessment Intelligence

> Sequenced implementation plan. Tasks are ordered by dependency. Each task includes its prerequisites, scope, and acceptance criteria references.

## Execution rules

1. Implement tasks **in order**. Do not skip ahead.
2. Each task includes its tests. A task is not done without passing tests.
3. Run typecheck + build after every task.
4. Update `CURRENT-STATE.md` and `COMPLETED-TASKS.md` after each task.
5. Commit after each completed task.
6. Do not implement future tasks speculatively.

---

## Phase 1: Engineering foundation

### T-000: Foundation documentation ✅
**Status:** Complete (2026-08-14)
**Scope:** Create all docs/product/ and docs/agent/ documentation.
**See:** `COMPLETED-TASKS.md`

### T-001: Test framework setup ✅
**Status:** Complete (2026-08-14)
**Prerequisites:** None
**Scope:**
- Install Vitest (compatible with Next.js 16 + TypeScript)
- Configure test runner for both unit and integration tests
- Add test scripts to `package.json`
- Write first test: unit test for `aggregate.ts` (happy path + edge cases)
- Write test for `prompt.ts` (prompt builder output structure)
- Write component test for `Results.tsx` (user-visible behaviour)
- Write test for `ui.tsx` (CATEGORY_META deterministic data)
- Verify tests run in CI-compatible mode

**Acceptance criteria:**
- `npm test` runs and passes — ✅ 63 tests across 4 suites
- `aggregate.ts` has tests for: normal input, malformed input, missing responses, confidence thresholds — ✅ 36 tests
- `prompt.ts` has tests for: output contains question/rubric/responses — ✅ 15 tests
- Component test for Results.tsx — ✅ 9 tests
- UI helper tests — ✅ 3 tests

**Why first:** Every subsequent task requires tests. Cannot defer.

### T-002: Component decomposition
**Status:** Pending
**Prerequisites:** T-001
**Scope:**
- Extract `AppFlow.tsx` (381 lines) into smaller, focused components:
  - `SetupForm.tsx` — Question + rubric + responses input
  - `ResponseInput.tsx` — Paste/CSV tabs
  - `RubricEditor.tsx` — Rubric criteria editor
  - `LoadingState.tsx` — Staged loading indicator
  - `AnalysisView.tsx` — Results + Recommendation orchestrator
- Keep existing UI and behavior **identical** — pure refactor
- Preserve all Tailwind classes
- Add component tests (render, interaction)

**Acceptance criteria:**
- App behaves identically before and after refactor
- All P0-* acceptance tests still pass
- Each new component has at least one render test
- `npm run build` passes
- No visual regression in browser

**Why now:** Multi-question requires question-level components. Cannot modularize later without risk.

---

## Phase 2: Supabase + authentication

### T-003: Supabase project setup
**Status:** Pending
**Prerequisites:** T-002
**Scope:**
- Connect existing Supabase project (or confirm project ID)
- Install `@supabase/supabase-js` and `@supabase/ssr`
- Create Supabase client utilities (browser + server)
- Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to environment
- Verify connection works
- No schema changes yet

**Acceptance criteria:**
- Supabase client can connect from both browser and server
- Environment variables configured locally and on Vercel
- No Supabase costs incurred (free tier only)
- Existing app functionality unchanged

### T-004: Database schema (migration)
**Status:** Pending
**Prerequisites:** T-003
**Scope:**
- Create initial migration with all tables from `DATA-MODEL.md`:
  - `institutions`
  - `profiles`
  - `assessments`
  - `questions`
  - `analyses`
  - `teacher_decisions`
  - `rubric_library`
- Create profile creation trigger (on `auth.users` insert)
- Create a default institution
- Add planned indexes
- DO NOT create RLS policies yet (separate task)

**Acceptance criteria:**
- Migration applies cleanly via Supabase MCP
- All tables exist with correct columns and types
- Profile trigger works when a user is created
- Default institution exists
- Schema matches `DATA-MODEL.md`

### T-005: RLS policies
**Status:** Pending
**Prerequisites:** T-004
**Scope:**
- Enable RLS on all tables
- Implement all RLS policies from `SECURITY.md`
- Test policies with different user contexts
- Write automated tests for policy enforcement

**Acceptance criteria:**
- All SEC-* acceptance tests pass
- Teacher A cannot read Teacher B's private assessments
- Institution sharing works correctly
- Teacher-specific sharing works correctly
- Rubric library visible to institution members

### T-006: Authentication (Google sign-in)
**Status:** Pending
**Prerequisites:** T-005
**Scope:**
- Enable Google OAuth in Supabase dashboard
- Create `/login` page with Google sign-in button
- Implement auth middleware for protected routes
- Create auth context/hook for client components
- Add sign-out functionality
- Configure redirect URLs (production + local)
- Handle first-time user flow (profile creation)
- Keep existing unauthenticated demo mode working (decision: should unauthenticated users still access the demo?)

**Acceptance criteria:**
- All AUTH-* acceptance tests pass
- Google sign-in works end-to-end
- Protected routes redirect to login
- Session refresh works transparently
- Sign-out works
- Existing demo functionality accessible (TBD: authenticated or not)

---

## Phase 3: Persistence + multi-question

### T-007: Assessment CRUD
**Status:** Pending
**Prerequisites:** T-006
**Scope:**
- Create assessment data access layer (isolated from presentation)
- Implement Create / Read / Update / Delete for assessments
- Create dashboard view showing user's assessments
- Implement "New Assessment" flow
- Implement "Save Draft" (explicit save)
- Add tests for CRUD operations and RLS enforcement

**Acceptance criteria:**
- Teacher can create, view, edit, and delete assessments
- Save Draft persists to Supabase
- Dashboard shows assessments with name, date, status
- RLS enforced (tested)

### T-008: Question management (multi-question)
**Status:** Pending
**Prerequisites:** T-007
**Scope:**
- Implement question list within assessment workspace
- Add / remove / reorder questions
- Collapsible/expandable question cards
- Question action menu (edit, duplicate, reset, clear rubric, clear responses, delete)
- Confirmation dialogs for destructive actions
- Minimum one question enforcement
- Wire to Supabase persistence

**Acceptance criteria:**
- All MQ-01 through MQ-14 acceptance tests pass
- Questions are collapsible/expandable
- All action menu items work correctly
- Destructive actions show confirmation
- Assessment always has at least one question

### T-009: Per-question analysis + persistence
**Status:** Pending
**Prerequisites:** T-008
**Scope:**
- Wire per-question Analyze button to existing `/api/analyze` route
- Persist analysis results to `analyses` table immediately on completion
- Implement staleness detection (inputs changed → analysis stale)
- Implement "Analyze All" (parallel independent calls)
- Show per-question progress during Analyze All
- Handle partial failures in Analyze All
- Persist teacher decisions to `teacher_decisions` table

**Acceptance criteria:**
- Per-question analysis works and persists
- Analyze All processes ready questions independently
- One failure doesn't fail others
- Stale analysis detection works (MQ-07, MQ-08, MQ-09)
- Teacher decisions persist to database
- PERS-01 through PERS-04 pass

---

## Phase 4: Rubric Library

### T-010: Rubric Library CRUD
**Status:** Pending
**Prerequisites:** T-009
**Scope:**
- Create rubric library data access layer
- Implement `/rubric-library` page
- CRUD operations for library rubrics
- Filter by course
- Search by name
- Owner/admin edit permissions

**Acceptance criteria:**
- RL-01, RL-02, RL-06, RL-07, RL-08 pass
- Rubrics browsable, filterable, searchable
- CRUD works with correct permissions

### T-011: Rubric Library integration with questions
**Status:** Pending
**Prerequisites:** T-010
**Scope:**
- "Use from Rubric Library" flow on question
- Preview before applying
- Snapshot mechanism (copy criteria into question)
- "Save to Rubric Library" from question
- Verify snapshot independence (editing library doesn't change snapshot)

**Acceptance criteria:**
- RL-03, RL-04, RL-05 pass
- Snapshot correctly isolated from library source
- Both custom and library rubrics work for analysis

---

## Phase 5: History + sharing

### T-012: Analysis History
**Status:** Pending
**Prerequisites:** T-011
**Scope:**
- Implement `/history` route
- Assessment list with filters and search
- Drill-down into assessment questions
- View current and previous analyses
- View teacher decisions with their analyses

**Acceptance criteria:**
- All AH-01 through AH-07 pass
- History shows assessments, questions, analyses, decisions
- Stale analyses marked appropriately
- Privacy enforced (private vs shared)

### T-013: Assessment sharing
**Status:** Pending
**Prerequisites:** T-012
**Scope:**
- Sharing controls in assessment header
- Three levels: private, institution, specific teachers
- Email autocomplete for specific teacher sharing
- RLS enforcement for shared access
- Shared assessments visible in history

**Acceptance criteria:**
- Sharing levels work correctly
- RLS blocks unauthorized access
- Shared assessments appear in others' history (read-only)

---

## Phase 6: Polish + admin

### T-014: Admin dashboard
**Status:** Pending
**Prerequisites:** T-013
**Scope:**
- Admin view of institution teachers
- Role management (promote/demote teacher ↔ admin)
- Admin access to institution-shared assessments
- Admin management of institution rubric library

**Acceptance criteria:**
- Admin can view institution teachers
- Admin can change roles
- Admin sees all institution-shared content
- Admin capabilities are minimal and useful

### T-015: Error handling + edge cases
**Status:** Pending
**Prerequisites:** T-014
**Scope:**
- React error boundary for graceful crashes
- Network error handling (offline, timeout)
- Session expiry handling
- Edge cases from `EDGE-CASES.md`
- Loading states and empty states throughout

**Acceptance criteria:**
- No unhandled crashes
- Graceful error messages for all failure modes
- Session expiry handled without data loss

### T-016: Final polish + regression testing
**Status:** Pending
**Prerequisites:** T-015
**Scope:**
- Full regression against all acceptance tests
- Mobile responsiveness check (390px)
- Performance audit
- Accessibility audit
- Update README for V2
- Deploy and verify production

**Acceptance criteria:**
- All acceptance tests pass
- Mobile responsive
- Lighthouse accessibility score ≥ 90
- Production deployment works
- README up to date

---

## Summary

| Phase | Tasks | Focus |
|---|---|---|
| 1. Foundation | T-000 ✅, T-001 ✅, T-002 | Tests, component decomposition |
| 2. Auth + DB | T-003, T-004, T-005, T-006 | Supabase, schema, RLS, Google sign-in |
| 3. Persistence | T-007, T-008, T-009 | Assessment CRUD, multi-question, analysis persistence |
| 4. Rubric | T-010, T-011 | Rubric Library CRUD + question integration |
| 5. History | T-012, T-013 | Analysis history, assessment sharing |
| 6. Polish | T-014, T-015, T-016 | Admin, error handling, final regression |

Total: 17 tasks across 6 phases.
