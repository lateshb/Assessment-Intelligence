"use client";

import AssessmentWorkspace from "./AssessmentWorkspace";

/**
 * AppFlow — thin wrapper that delegates to AssessmentWorkspace.
 *
 * The original monolithic AppFlow has been decomposed into:
 * - AssessmentWorkspace (orchestrator)
 * - QuestionCard (per-question editing + results)
 * - useAssessment hook (state management)
 *
 * This file is kept for backward compatibility with page.tsx imports.
 */
export default function AppFlow() {
  return <AssessmentWorkspace />;
}
