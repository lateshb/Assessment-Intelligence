<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Project operating rules — Assessment Intelligence

## 1. Context first

Before implementing anything:
1. Read `docs/product/MASTER-CONTEXT.md` for product identity and vision.
2. Read `docs/agent/CURRENT-STATE.md` for what exists today.
3. Read `docs/agent/TASK-QUEUE.md` for the current task and its prerequisites.
4. Read `docs/agent/DECISIONS.md` for locked decisions.
5. Inspect the relevant source files before modifying them.

## 2. Task discipline

- Implement **only** the current task from `TASK-QUEUE.md`.
- Do not implement future tasks speculatively.
- Do not silently invent product decisions. If a decision is missing, identify it clearly in `DECISIONS.md` and ask.
- Each task is complete only when: implementation + tests + typecheck + build pass.

## 3. Code architecture

- Feature isolation: one business responsibility → one module → stable interface.
- Presentation components do NOT own: database queries, auth logic, unrelated business logic.
- Database access is isolated from presentation.
- External AI provider access remains isolated in `src/app/api/analyze/route.ts` and `src/lib/`.
- Do not duplicate business rules in multiple places.
- Do not over-modularize into meaningless one-function files.

## 4. Testing

- Every new feature ships WITH its automated tests.
- For each feature: happy path, validation failures, edge cases, authorization cases, failure states.
- A task is NOT complete if tests are missing or there are TODO placeholders.
- Run `npm test`, `npm run build` after every task.

## 5. Database

- Use Supabase migrations for schema changes (version-controlled in Git).
- Use RLS for all exposed data.
- Do not expose service-role credentials to the client.
- Keep secrets out of Git.
- **Supabase Free tier only** — no paid services without explicit user approval.

## 6. Preserve existing functionality

- The current prototype is fully functional. Do not break it.
- All P0-* acceptance tests (see `docs/product/ACCEPTANCE-TESTS.md`) must continue to pass.
- When refactoring, verify behavior is identical before and after.

## 7. Stack

- Next.js 16 (App Router) + TypeScript strict + Tailwind CSS 4
- Supabase (Free tier) for database and auth
- Vitest for testing
- Vercel for deployment
- `GEMINI_API_KEY` server-only; `NEXT_PUBLIC_SUPABASE_*` client-accessible by design
