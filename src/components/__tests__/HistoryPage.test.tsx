import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import HistoryPage from "../HistoryPage";
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { HistoryEntry, HistoryAction } from "@/lib/history-types";
import type { AssessmentState } from "@/lib/assessment-types";
import { buildHistoryEntry } from "@/lib/use-history";

// ─── Test-only in-memory history provider ──────────────────────────────────

type TestHistoryContextType = {
  entries: HistoryEntry[];
  loading: boolean;
  dispatch: (action: HistoryAction) => Promise<void>;
  saveAssessment: (assessment: AssessmentState) => Promise<void>;
  reload: () => Promise<void>;
};

const TestHistoryContext = createContext<TestHistoryContextType | null>(null);

function TestHistoryProvider({ children, initialEntries = [] }: { children: ReactNode; initialEntries?: HistoryEntry[] }) {
  const [entries, setEntries] = useState<HistoryEntry[]>(initialEntries);
  const [loading] = useState(false);

  const saveAssessment = useCallback(async (assessment: AssessmentState) => {
    const hasAnalysis = assessment.questions.some((q) => q.analysis !== null);
    if (!hasAnalysis) return;

    const entry: HistoryEntry = {
      ...buildHistoryEntry(assessment),
      id: `hist-${Date.now()}`,
      savedAt: new Date().toISOString(),
      trashed: false,
    };
    setEntries((prev) => [entry, ...prev]);
  }, []);

  const dispatch = useCallback(async (action: HistoryAction) => {
    switch (action.type) {
      case "DELETE_ENTRY":
        setEntries((prev) => prev.map((e) => (e.id === action.id ? { ...e, trashed: true } : e)));
        break;
      case "RESTORE_ENTRY":
        setEntries((prev) => prev.map((e) => (e.id === action.id ? { ...e, trashed: false } : e)));
        break;
      case "PERMANENT_DELETE":
        setEntries((prev) => prev.filter((e) => e.id !== action.id));
        break;
      case "CLEAR_TRASH":
        setEntries((prev) => prev.filter((e) => !e.trashed));
        break;
      case "SAVE_ENTRY":
        // Handled by saveAssessment
        break;
    }
  }, []);

  const reload = useCallback(async () => {
    // no-op in tests
  }, []);

  return (
    <TestHistoryContext.Provider value={{ entries, loading, dispatch, saveAssessment, reload }}>
      {children}
    </TestHistoryContext.Provider>
  );
}

// Mock useHistory to use test context
vi.mock("@/lib/use-history", async () => {
  const actual = await vi.importActual("@/lib/use-history");
  return {
    ...actual,
    useHistory: () => {
      const ctx = useContext(TestHistoryContext);
      if (!ctx) throw new Error("useHistory must be used within TestHistoryProvider");
      return ctx;
    },
  };
});

// ─── Test fixtures ──────────────────────────────────────────────────────────

const singleQuestionEntry: HistoryEntry = {
  id: "hist-1",
  assessmentName: "Microeconomics Quiz 1",
  course: "Economics",
  questions: [
    {
      id: "q-1",
      questionText: "Explain price elasticity of demand.",
      rubric: [
        { name: "Definition", description: "Formula", maxMarks: 3 },
        { name: "Example", description: "Real-world", maxMarks: 4 },
      ],
      responses: [
        { id: "R1", text: "Response 1" },
        { id: "R2", text: "Response 2" },
        { id: "R3", text: "Response 3" },
        { id: "R4", text: "Response 4" },
        { id: "R5", text: "Response 5" },
      ],
      analysis: {
        perResponse: Array.from({ length: 5 }, (_, i) => ({
          id: `R${i + 1}`,
          category: "correct" as const,
          misconception: null,
          evidence: "Evidence",
          confidence: 0.9,
          criterionScores: [1, 0.5],
          draftMark: 5,
        })),
        clusters: [],
        gapMap: [
          { criterion: "Definition", masteryPct: 100, level: "good" as const },
          { criterion: "Example", masteryPct: 50, level: "warning" as const },
        ],
        recommendation: {
          type: "Revision session",
          durationMin: 15,
          targetDescription: "Students with misconceptions",
          targetIds: ["R01"],
          rationale: "Some students lack clarity",
          followUp: "Review slides 10-15",
        },
        meta: {
          model: "gemini-2.0-flash",
          latencyMs: 1500,
          disclaimer: "AI-generated",
          source: "live" as const,
        },
      },
      status: "analyzed" as const,
    },
  ],
  savedAt: "2026-08-15T10:00:00Z",
  trashed: false,
};

const multiQuestionEntry: HistoryEntry = {
  id: "hist-2",
  assessmentName: "Calculus Midterm",
  course: "Mathematics",
  questions: [
    {
      id: "q-1",
      questionText: "Q1",
      rubric: [
        { name: "C1", description: "D", maxMarks: 1 },
        { name: "C2", description: "D", maxMarks: 1 },
      ],
      responses: [{ id: "R1", text: "A1" }],
      analysis: {
        perResponse: [{ id: "R1", category: "correct" as const, misconception: null, evidence: "E", confidence: 0.9, criterionScores: [1, 1], draftMark: 2 }],
        clusters: [],
        gapMap: [],
        recommendation: { type: "T", durationMin: 10, targetDescription: "D", targetIds: [], rationale: "R", followUp: "F" },
        meta: { model: "m", latencyMs: 100, disclaimer: "D", source: "live" as const },
      },
      status: "analyzed" as const,
    },
    {
      id: "q-2",
      questionText: "Q2",
      rubric: [
        { name: "C1", description: "D", maxMarks: 2 },
        { name: "C2", description: "D", maxMarks: 2 },
      ],
      responses: [{ id: "R1", text: "A2" }],
      analysis: {
        perResponse: [{ id: "R1", category: "partial" as const, misconception: null, evidence: "E", confidence: 0.8, criterionScores: [0.5, 1], draftMark: 3 }],
        clusters: [],
        gapMap: [],
        recommendation: { type: "T", durationMin: 20, targetDescription: "D", targetIds: [], rationale: "R", followUp: "F" },
        meta: { model: "m", latencyMs: 200, disclaimer: "D", source: "live" as const },
      },
      status: "analyzed" as const,
    },
  ],
  savedAt: "2026-08-15T11:00:00Z",
  trashed: false,
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("HistoryPage", () => {
  describe("empty states", () => {
    it("shows 'No analyses yet' when Active is empty", () => {
      render(
        <TestHistoryProvider>
          <HistoryPage />
        </TestHistoryProvider>
      );

      expect(screen.getByText("No analyses yet")).toBeInTheDocument();
    });

    it("shows 'Trash is empty' when switching to Trash tab with no trashed items", async () => {
      const user = userEvent.setup();

      render(
        <TestHistoryProvider>
          <HistoryPage />
        </TestHistoryProvider>
      );

      await user.click(screen.getByText(/trash/i));
      expect(screen.getByText("Trash is empty")).toBeInTheDocument();
    });
  });

  describe("Active tab", () => {
    it("displays active assessment cards", () => {
      render(
        <TestHistoryProvider initialEntries={[singleQuestionEntry]}>
          <HistoryPage />
        </TestHistoryProvider>
      );

      expect(screen.getByText("Microeconomics Quiz 1")).toBeInTheDocument();
      expect(screen.getByText(/1 question/i)).toBeInTheDocument();
    });

    it("clicking View button opens detail view", async () => {
      const user = userEvent.setup();

      render(
        <TestHistoryProvider initialEntries={[singleQuestionEntry]}>
          <HistoryPage />
        </TestHistoryProvider>
      );

      await user.click(screen.getByText("View"));
      expect(screen.getByText("Explain price elasticity of demand.")).toBeInTheDocument();
    });
  });

  describe("Trash tab", () => {
    it("shows trashed assessments", async () => {
      const user = userEvent.setup();
      const trashedEntry = { ...singleQuestionEntry, id: "hist-trash", trashed: true };

      render(
        <TestHistoryProvider initialEntries={[trashedEntry]}>
          <HistoryPage />
        </TestHistoryProvider>
      );

      await user.click(screen.getByText(/trash/i));
      expect(screen.getByText("Microeconomics Quiz 1")).toBeInTheDocument();
    });

    it("can restore a trashed assessment", async () => {
      const user = userEvent.setup();
      const trashedEntry = { ...singleQuestionEntry, id: "hist-trash", trashed: true };

      render(
        <TestHistoryProvider initialEntries={[trashedEntry]}>
          <HistoryPage />
        </TestHistoryProvider>
      );

      await user.click(screen.getByText(/trash/i));
      
      const restoreButton = screen.getByText("Restore");
      await user.click(restoreButton);

      // Should move to Active
      await user.click(screen.getByText(/active/i));
      expect(screen.getByText("Microeconomics Quiz 1")).toBeInTheDocument();
    });
  });

  describe("history remains assessment-first", () => {
    it("groups questions under their parent assessment", () => {
      render(
        <TestHistoryProvider initialEntries={[multiQuestionEntry]}>
          <HistoryPage />
        </TestHistoryProvider>
      );

      expect(screen.getByText("Calculus Midterm")).toBeInTheDocument();
      expect(screen.getByText(/2 questions/i)).toBeInTheDocument();
    });

    it("shows View button for multi-question assessments", () => {
      render(
        <TestHistoryProvider initialEntries={[multiQuestionEntry]}>
          <HistoryPage />
        </TestHistoryProvider>
      );

      const viewButtons = screen.getAllByText("View");
      expect(viewButtons.length).toBeGreaterThan(0);
    });
  });
});
