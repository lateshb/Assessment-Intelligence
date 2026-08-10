export type Rubric = { name: string; description: string; maxMarks: number };
export type StudentResponse = { id: string; text: string };
export type Category = "correct" | "partial" | "misconception" | "needs_review";

export type PerResponse = {
  id: string;
  category: Category;
  /** original model category before the needs_review confidence rule */
  modelCategory?: Exclude<Category, "needs_review">;
  misconception: string | null;
  evidence: string;
  confidence: number; // 0..1
  criterionScores: number[]; // 0 | 0.5 | 1 per rubric criterion
  draftMark: number; // recomputed server-side
};

export type Cluster = {
  label: string;
  explanation: string;
  responseIds: string[];
  avgConfidence: number;
};

export type GapRow = {
  criterion: string;
  masteryPct: number;
  level: "critical" | "warning" | "good";
};

export type Recommendation = {
  type: string;
  durationMin: number;
  targetDescription: string;
  targetIds: string[];
  rationale: string;
  followUp: string;
};

export type Analysis = {
  perResponse: PerResponse[];
  clusters: Cluster[];
  gapMap: GapRow[];
  recommendation: Recommendation;
  meta: {
    model: string;
    latencyMs: number;
    disclaimer: string;
    source: "live" | "cached";
  };
};

export type Decision = {
  at: string;
  action: "approve" | "modify" | "reject";
  summary: string;
  reason?: string;
};

export type AnalyzeRequest = {
  question: string;
  rubric: Rubric[];
  responses: StudentResponse[];
};
