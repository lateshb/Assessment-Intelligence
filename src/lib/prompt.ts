import type { Rubric, StudentResponse } from "./types";

/** Builds the single batched classification prompt (see ai-classification-prompt.md). */
export function buildPrompt(
  question: string,
  rubric: Rubric[],
  responses: StudentResponse[]
): string {
  return `You are an assessment-intelligence engine for a coaching institute. A teacher has given an exam question, a marking rubric, and a batch of student responses. Your job is to diagnose the misconception behind each response - not merely mark it right or wrong - so the teacher can decide a targeted intervention.

QUESTION:
${question}

RUBRIC (JSON array of criteria; maxMarks per criterion):
${JSON.stringify(rubric)}

STUDENT RESPONSES (JSON array of {id, text}):
${JSON.stringify(responses)}

For EVERY response, produce an object with:
- "id": the response id, unchanged.
- "category": one of "correct", "partial", "misconception".
  - "correct": satisfies the rubric in substance, minor wording issues allowed.
  - "partial": on the right track; satisfies some criteria but incomplete or imprecise, WITHOUT a clearly wrong underlying belief.
  - "misconception": reveals a specific wrong belief about the concept (not mere incompleteness).
- "misconception": if category is "misconception", a short reusable label for the wrong belief (e.g., "Confuses elasticity with absolute change in quantity"). Reuse the SAME label for the same wrong belief across responses so they cluster. Otherwise null.
- "evidence": a short VERBATIM quote copied exactly from that response's text that best shows why you classified it this way. Never paraphrase inside evidence.
- "confidence": your confidence in this classification, 0 to 1, honestly calibrated. Ambiguous, very short, off-topic, or unreadable responses must get low confidence (below 0.6).
- "criterionScores": an array with one score per rubric criterion, in rubric order: 1 (criterion met), 0.5 (partially met), 0 (not met).
- "draftMark": a suggested mark computed from criterionScores and maxMarks. This is a DRAFT for teacher review, never final.

Then produce:
- "clusters": one object per distinct misconception label: {"label", "explanation" (2-3 plain sentences a teacher can read aloud: what the students wrongly believe and why it is wrong), "responseIds"}.
- "recommendation": exactly ONE intervention the teacher could run: {"type" (e.g., "targeted revision session", "worked example + guided practice"), "durationMin" (10-25), "targetDescription" (who, in plain words), "targetIds" (the response ids it addresses), "rationale" (cite the dominant misconception and the weakest rubric criterion by name), "followUp" (one concrete check, e.g., "5-question diagnostic on interpretation within 3 days")}.

Rules:
1. Judge only the text of each response. Never infer or mention identity, gender, background, or ability of any student.
2. Incomplete is not the same as wrong: missing parts -> "partial"; an actively wrong belief -> "misconception".
3. Off-topic, blank, or unreadable responses: category "partial", confidence 0.3 or lower, evidence quoting whatever text exists (or an empty string if blank).
4. Do not invent misconception labels that only one weak signal supports; prefer fewer, well-evidenced clusters.
5. Be honest in confidence. It is better to flag uncertainty than to guess confidently.
6. Output ONLY valid JSON matching the schema below. No markdown, no code fences, no commentary.

OUTPUT SCHEMA:
{
  "perResponse": [ { "id": "...", "category": "...", "misconception": "... or null", "evidence": "...", "confidence": 0.0, "criterionScores": [0, 0.5, 1], "draftMark": 0.0 } ],
  "clusters": [ { "label": "...", "explanation": "...", "responseIds": ["..."] } ],
  "recommendation": { "type": "...", "durationMin": 15, "targetDescription": "...", "targetIds": ["..."], "rationale": "...", "followUp": "..." }
}`;
}
