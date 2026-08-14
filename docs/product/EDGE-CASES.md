# Edge Cases & Failure Modes

## 1. AI / LLM failures

| Scenario | Handling |
|---|---|
| API key missing | Return 503 with `fallbackAdvised: true`; client falls back to cached demo results |
| Model call timeout (>45s) | Abort, return 504 with `fallbackAdvised: true`; client falls back |
| Model returns unparseable JSON | Return 502 with `fallbackAdvised: true`; client falls back |
| Model drops some responses | `aggregate.ts` creates `needs_review` entries for missing responses |
| Model returns invalid category | `aggregate.ts` defaults to `"partial"` |
| Model returns invalid confidence | `aggregate.ts` defaults to `0.3` |
| Model returns wrong-length criterionScores | `aggregate.ts` zeros all scores and forces low confidence |
| Model hallucinates response IDs | `aggregate.ts` filters against real IDs |
| `?demo=1` query parameter | Skip model call entirely, load cached results |

## 2. Input edge cases

| Scenario | Handling |
|---|---|
| Empty question text | Validation error: "Please enter the question." |
| Rubric criterion without name | Validation error: "Every rubric criterion needs a name." |
| Fewer than 5 responses | Validation error with count |
| Blank/whitespace-only response | Included in batch (model handles it with low confidence) |
| Gibberish/off-topic response | Model classifies as `partial` with low confidence → `needs_review` |
| Very long response (>5000 chars) | Accepted; may slow model. No truncation in V1. |
| CSV with wrong columns | Parser falls back to positional parsing |
| CSV with quoted commas | Parser handles standard CSV quoting |
| Duplicate response IDs | First occurrence wins in aggregation |

## 3. Multi-question edge cases

| Scenario | Handling |
|---|---|
| Delete only question | Blocked: assessment must have at least one question |
| Analyze All with no ready questions | Disabled button or notification |
| Analyze All with mixed ready/not-ready | Only ready questions are analyzed |
| One question fails during Analyze All | Other questions proceed; failed question shows error with retry |
| Edit question text after analysis | Analysis becomes stale with warning |
| Edit rubric after analysis | Analysis becomes stale with warning |
| Add/remove responses after analysis | Analysis becomes stale with warning |
| Save with stale analyses | Allowed; stale flag preserved |

## 4. Rubric Library edge cases

| Scenario | Handling |
|---|---|
| Library rubric deleted after snapshot | Question snapshot unaffected; provenance link broken gracefully |
| Library rubric edited after snapshot | Question snapshot unaffected |
| Duplicate rubric names in library | Allowed (different courses may have same name) |
| Course name casing | Normalize to title case on save |
| Empty criteria list | Validation error: 2–5 criteria required |

## 5. Authentication edge cases

| Scenario | Handling |
|---|---|
| Session expired during analysis | API returns 401; client prompts re-login |
| Session expired during save | API returns 401; client preserves local state, prompts re-login |
| User tries to access another user's private assessment | RLS returns empty result; 404 page |
| User removed from institution | RLS blocks access; UI shows appropriate message |
| Google OAuth failure | Error page with retry option |

## 6. Sharing edge cases

| Scenario | Handling |
|---|---|
| Share with non-existent email | Validation error or ignored |
| Shared user leaves institution | RLS blocks access; no active cleanup needed |
| Change sharing from institution to private | Existing shared views become inaccessible |
| Share with self | Ignored (already owner) |

## 7. Concurrent access

| Scenario | Handling |
|---|---|
| Two tabs, same assessment | Last save wins; no real-time sync in V1 |
| Two teachers analyzing same shared assessment | Each creates independent analysis; last write wins |
| Save conflict | Last save wins; no optimistic locking in V1 |

## 8. Performance edge cases

| Scenario | Handling |
|---|---|
| 50 responses × 5 criteria | Within model limits; tested in prototype |
| Assessment with 20 questions | May be slow to load; paginate if needed |
| Large rubric library (>100 rubrics) | Paginate; filter by course |
| Many analyses in history | Paginate; filter by date/status |
