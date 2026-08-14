# Locked Decisions — Assessment Intelligence

> Decisions that are final and must not be revisited without explicit user approval. These were established at project inception and guide all implementation work.

## Product decisions

| # | Decision | Rationale |
|---|---|---|
| PD-01 | Assessments contain multiple questions | Core product hierarchy |
| PD-02 | A question can be analyzed independently | Teacher workflow flexibility |
| PD-03 | "Analyze All" processes ready questions independently (not one giant LLM request) | Reliability: one failure ≠ total failure |
| PD-04 | One failed question must not fail the rest of an assessment | Resilience |
| PD-05 | Assessment name is optional | Low friction for quick analyses |
| PD-06 | Questions should be collapsible/expandable | Screen real estate management |
| PD-07 | Question actions: edit, duplicate, reset, clear rubric, clear responses, delete (with confirmation for destructive) | Full question lifecycle |
| PD-08 | An assessment always contains at least one question | Data integrity |
| PD-09 | "Rubric Library" is the official product term | Naming consistency |
| PD-10 | Rubric Library organized by Course only (no Topic/Module hierarchy in V1) | Simplicity |
| PD-11 | Library rubric is COPIED as a snapshot into the question; historical analyses never change | Data integrity and auditability |
| PD-12 | A question may use a custom rubric or a library rubric | Flexibility |
| PD-13 | Analysis History is assessment-first, not question-first | Natural mental model |
| PD-14 | Sharing has three levels: private, institution, specific teachers | Privacy control |
| PD-15 | Specific-teacher sharing uses email/account identity | Simple identity |
| PD-16 | Student responses use anonymous IDs only (no PII in V1) | Privacy |
| PD-17 | Save Draft is explicit (no auto-save) | User control |
| PD-18 | Editing after analysis marks existing analysis as stale; never silently present old analysis as current | Data honesty |
| PD-19 | Historical analyses preserve inputs and metadata that produced them | Auditability |
| PD-20 | Analysis decisions persisted in database (not just localStorage) | Data durability |
| PD-21 | Authentication: Supabase Auth with Google sign-in (no passwords, no enterprise SSO in V1) | Simplest secure approach |
| PD-22 | Two roles: teacher and institution admin | Minimal viable RBAC |
| PD-23 | Admin capabilities: only genuinely useful institution-level management | Avoid over-engineering |
| PD-24 | Teacher-private data protected at database level (RLS) | Security |
| PD-25 | Institution sharing protected at database level (RLS) | Security |
| PD-26 | Use Supabase Row Level Security; frontend filtering is NOT a security mechanism | Defense in depth |

## Architecture decisions

| # | Decision | Rationale |
|---|---|---|
| AD-01 | LLM provider isolated in `constants.ts` + `route.ts` | Vendor swappability |
| AD-02 | Server-side deterministic aggregation in `aggregate.ts` | Defensible math |
| AD-03 | Feature isolation: one responsibility → one module → stable interface | Maintainability |
| AD-04 | Presentation components must not own database queries or auth logic | Separation of concerns |
| AD-05 | Database access isolated from presentation | Clean architecture |
| AD-06 | Do not duplicate business rules in multiple places | DRY |
| AD-07 | Every new feature implemented WITH its automated tests | Quality |
| AD-08 | Use Supabase migrations for schema changes (version-controlled in Git) | Reproducibility |
| AD-09 | Supabase Free tier only — no paid services without explicit approval | Cost constraint |
| AD-10 | Secrets out of Git; no service-role key in client code | Security |

## Cost constraint (non-negotiable)

The entire project must remain compatible with **Supabase Free tier**. No upgrades, paid billing, or unnecessary paid infrastructure without explicit user approval.

## Open decisions (not yet locked)

| Topic | Question | Impact |
|---|---|---|
| First-time institution setup | Create a default institution or require onboarding flow? | Affects auth implementation |
| Unauthenticated demo mode | Keep the current no-auth demo flow alongside the authenticated flow? | Affects route structure |
| Real-time sync | Do shared assessments need real-time updates? | Affects architecture complexity |
| Response count limit | Hard limit at 50 responses, or allow more? | Affects UX and model costs |
