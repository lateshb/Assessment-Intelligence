"use client";

import { createContext, useContext, useReducer, type ReactNode } from "react";
import { reducer, createInitialState } from "./use-assessment";
import type { AssessmentState, AssessmentAction } from "./assessment-types";

type AssessmentContextValue = {
  state: AssessmentState;
  dispatch: React.Dispatch<AssessmentAction>;
};

const AssessmentContext = createContext<AssessmentContextValue | null>(null);

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, createInitialState());

  return (
    <AssessmentContext.Provider value={{ state, dispatch }}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error("useAssessment must be used within AssessmentProvider");
  }
  return context;
}
