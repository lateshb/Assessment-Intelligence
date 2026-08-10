/**
 * The LLM is deliberately isolated behind this single constant + one fetch in
 * src/app/api/analyze/route.ts, so the vendor can be swapped (Gemini -> Azure
 * OpenAI -> Anthropic) without touching product code. See /build-and-scale.
 */
export const MODEL_ID = "gemini-3.5-flash";

export const API_TIMEOUT_MS = 45_000;

export const CONFIDENCE_REVIEW_THRESHOLD = 0.6;

export const DISCLAIMER =
  "AI-generated analysis. All marks are drafts. A teacher reviews every decision.";
