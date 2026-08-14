import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import HistoryPage from "../HistoryPage";
import { HistoryProvider, useHistory } from "@/lib/use-history";
import type { AssessmentState } from "@/lib/assessment-types";
import { useEffect } from "react";

// Test harness that seeds history with test data
function HistoryTestHarness({ children, seed }: { children: React.ReactNode; seed?: AssessmentState[] }) {
  const { saveAssessment } = useHistory();

  useEffect(() => {
    if (seed) {
      seed.forEach((assessment) => saveAssessment(assessment));
    }
  }, [seed, saveAssessment]);

  return <>{children}</>;
}

function renderWithHistory(seed?: AssessmentState[]) {
  return render(
    <HistoryProvider>
      <HistoryTestHarness seed={seed}>
        <HistoryPage />
      </HistoryTestHarness>
    </HistoryProvider>
  );
}

// Fixtures
const singleQuestionAssessment: AssessmentState = {
  name: "Microeconomics Quiz 1",
  questions: [
    {
      id: "q-1",
      questionText: "Explain price elasticity of demand.",
      rubric: [
        { name: "Definition", description: "Formula", maxMarks: 3 },
        { name: "Example", description: "Real-world", maxMarks: 4 },
      ],
      responseTab: "paste",
      pasteText: "R1\nR2\nR3\nR4\nR5",
      csvRows: null,
      csvName: "",
      status: "analyzed",
      analysis: {
        perResponse: Array.from({ length: 5 }, (_, i) => ({
          id: `R${i + 1}`,
          category: "correct" as const,
          modelCategory: "correct" as const,
          misconception: null,
          evidence: `Response ${i + 1} text`,
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
          targetDescription: "All students",
          targetIds: [],
          rationale: "Test rationale",
          followUp: "Test follow-up",
        },
        meta: { model: "test", latencyMs: 100, disclaimer: "Test", source: "live" as const },
      },
      error: null,
      expanded: true,
      analyzedInputHash: "hash1",
    },
  ],
  analyzeAllInProgress: false,
  demoFlag: false,
};

const multiQuestionAssessment: AssessmentState = {
  name: "Macroeconomics Midterm",
  questions: [
    {
      id: "q-1",
      questionText: "Q1 text",
      rubric: [
        { name: "C1", description: "", maxMarks: 2 },
        { name: "C2", description: "", maxMarks: 3 },
      ],
      responseTab: "paste",
      pasteText: "R1\nR2\nR3\nR4\nR5",
      csvRows: null,
      csvName: "",
      status: "draft",
      analysis: null,
      error: null,
      expanded: true,
      analyzedInputHash: null,
    },
    {
      id: "q-2",
      questionText: "Q2 text",
      rubric: [
        { name: "C1", description: "", maxMarks: 2 },
        { name: "C2", description: "", maxMarks: 3 },
      ],
      responseTab: "paste",
      pasteText: "R1\nR2\nR3\nR4\nR5",
      csvRows: null,
      csvName: "",
      status: "analyzed",
      analysis: {
        perResponse: Array.from({ length: 5 }, (_, i) => ({
          id: `R${i + 1}`,
          category: "partial" as const,
          modelCategory: "partial" as const,
          misconception: null,
          evidence: `Q2 response ${i + 1}`,
          confidence: 0.8,
          criterionScores: [0.5, 0.5],
          draftMark: 2.5,
        })),
        clusters: [],
        gapMap: [
          { criterion: "C1", masteryPct: 50, level: "warning" as const },
          { criterion: "C2", masteryPct: 50, level: "warning" as const },
        ],
        recommendation: {
          type: "Tutorial",
          durationMin: 20,
          targetDescription: "Partial understanding group",
          targetIds: [],
          rationale: "Q2 rationale",
          followUp: "Q2 follow-up",
        },
        meta: { model: "test", latencyMs: 150, disclaimer: "Test", source: "live" as const },
      },
      error: null,
      expanded: false,
      analyzedInputHash: "hash2",
    },
  ],
  analyzeAllInProgress: false,
  demoFlag: false,
};

describe("HistoryPage", () => {
  describe("empty states", () => {
    it("shows 'No analyses yet' when Active is empty", () => {
      renderWithHistory();
      expect(screen.getByText("No analyses yet")).toBeInTheDocument();
      expect(screen.getByText("Analyze an assessment to see it here.")).toBeInTheDocument();
    });

    it("shows 'Trash is empty' when Trash tab is empty", async () => {
      const user = userEvent.setup();
      renderWithHistory();
      await user.click(screen.getByText(/Trash \(0\)/));
      expect(screen.getByText("Trash is empty")).toBeInTheDocument();
      expect(screen.getByText("Deleted assessments will appear here.")).toBeInTheDocument();
    });
  });

  describe("analyzed assessment appears in history", () => {
    it("shows assessment name, question count, analyzed count in Active list", () => {
      renderWithHistory([singleQuestionAssessment]);
      expect(screen.getByText("Microeconomics Quiz 1")).toBeInTheDocument();
      expect(screen.getByText(/1 question/)).toBeInTheDocument();
      expect(screen.getByText(/1 analyzed/)).toBeInTheDocument();
      expect(screen.getByText("complete")).toBeInTheDocument();
    });

    it("shows partial status when some questions are analyzed", () => {
      renderWithHistory([multiQuestionAssessment]);
      expect(screen.getByText("Macroeconomics Midterm")).toBeInTheDocument();
      expect(screen.getByText(/2 questions/)).toBeInTheDocument();
      expect(screen.getByText(/1 analyzed/)).toBeInTheDocument();
      expect(screen.getByText("partial")).toBeInTheDocument();
    });
  });

  describe("multiple questions belong to one assessment", () => {
    it("shows correct question count for multi-question assessment", () => {
      renderWithHistory([multiQuestionAssessment]);
      expect(screen.getByText(/2 questions/)).toBeInTheDocument();
      expect(screen.getByText(/1 analyzed/)).toBeInTheDocument();
    });
  });

  describe("View opens correct assessment", () => {
    it("navigates to detail view when View is clicked", async () => {
      const user = userEvent.setup();
      renderWithHistory([singleQuestionAssessment]);
      
      await user.click(screen.getByText("View"));

      // Should show detail view
      expect(screen.getByText("← Back to History")).toBeInTheDocument();
      expect(screen.getByText("Microeconomics Quiz 1")).toBeInTheDocument();
      expect(screen.getByText(/1 question/)).toBeInTheDocument();
      expect(screen.getByText(/1 analyzed/)).toBeInTheDocument();
      expect(screen.getAllByText("Read-only").length).toBeGreaterThan(0);
    });

    it("shows correct question text in detail view", async () => {
      const user = userEvent.setup();
      renderWithHistory([singleQuestionAssessment]);
      
      await user.click(screen.getByText("View"));

      expect(screen.getByText("Explain price elasticity of demand.")).toBeInTheDocument();
      expect(screen.getAllByText("Definition").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Example").length).toBeGreaterThan(0);
    });

    it("shows multiple questions in detail view for multi-question assessment", async () => {
      const user = userEvent.setup();
      renderWithHistory([multiQuestionAssessment]);
      
      await user.click(screen.getByText("View"));

      expect(screen.getByText("Question 1")).toBeInTheDocument();
      // Question 2 is in collapsed card, text may be split
      expect(screen.getByText(/Q2 text/)).toBeInTheDocument();
    });

    it("returns to list view when Back to History is clicked", async () => {
      const user = userEvent.setup();
      renderWithHistory([singleQuestionAssessment]);
      
      await user.click(screen.getByText("View"));
      await user.click(screen.getByText("← Back to History"));

      // Should be back at list
      expect(screen.getByText("Past Assessments")).toBeInTheDocument();
      expect(screen.queryByText("← Back to History")).not.toBeInTheDocument();
    });
  });

  describe("Delete moves to Trash", () => {
    it("removes assessment from Active when Delete is clicked", async () => {
      const user = userEvent.setup();
      renderWithHistory([singleQuestionAssessment]);
      
      expect(screen.getByText("Microeconomics Quiz 1")).toBeInTheDocument();
      await user.click(screen.getByText("Delete"));

      // Should disappear from Active
      expect(screen.queryByText("Microeconomics Quiz 1")).not.toBeInTheDocument();
      expect(screen.getByText("No analyses yet")).toBeInTheDocument();
    });

    it("appears in Trash tab after deletion", async () => {
      const user = userEvent.setup();
      renderWithHistory([singleQuestionAssessment]);
      
      await user.click(screen.getByText("Delete"));
      await user.click(screen.getByText(/Trash \(1\)/));

      expect(screen.getByText("Microeconomics Quiz 1")).toBeInTheDocument();
    });
  });

  describe("Restore returns to Active", () => {
    it("moves assessment back to Active when Restore is clicked", async () => {
      const user = userEvent.setup();
      renderWithHistory([singleQuestionAssessment]);
      
      // Delete it first
      await user.click(screen.getByText("Delete"));
      await user.click(screen.getByText(/Trash \(1\)/));
      expect(screen.getByText("Microeconomics Quiz 1")).toBeInTheDocument();

      // Restore
      await user.click(screen.getByText("Restore"));

      // Should disappear from Trash
      expect(screen.queryByText("Microeconomics Quiz 1")).not.toBeInTheDocument();
      expect(screen.getByText("Trash is empty")).toBeInTheDocument();

      // Should reappear in Active
      await user.click(screen.getByText(/Active \(1\)/));
      expect(screen.getByText("Microeconomics Quiz 1")).toBeInTheDocument();
    });
  });

  describe("Permanent delete removes it", () => {
    it("shows confirmation dialog when Permanently Delete is clicked", async () => {
      const user = userEvent.setup();
      renderWithHistory([singleQuestionAssessment]);
      
      await user.click(screen.getByText("Delete"));
      await user.click(screen.getByText(/Trash \(1\)/));
      await user.click(screen.getByText("Permanently Delete"));

      expect(screen.getByText("Confirm")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("removes assessment when Confirm is clicked", async () => {
      const user = userEvent.setup();
      renderWithHistory([singleQuestionAssessment]);
      
      await user.click(screen.getByText("Delete"));
      await user.click(screen.getByText(/Trash \(1\)/));
      await user.click(screen.getByText("Permanently Delete"));
      await user.click(screen.getByText("Confirm"));

      expect(screen.queryByText("Microeconomics Quiz 1")).not.toBeInTheDocument();
      expect(screen.getByText("Trash is empty")).toBeInTheDocument();
    });

    it("keeps assessment when Cancel is clicked", async () => {
      const user = userEvent.setup();
      renderWithHistory([singleQuestionAssessment]);
      
      await user.click(screen.getByText("Delete"));
      await user.click(screen.getByText(/Trash \(1\)/));
      await user.click(screen.getByText("Permanently Delete"));
      await user.click(screen.getByText("Cancel"));

      expect(screen.getByText("Microeconomics Quiz 1")).toBeInTheDocument();
    });
  });

  describe("history remains assessment-first", () => {
    it("groups questions under assessment in list view", () => {
      renderWithHistory([multiQuestionAssessment]);
      
      // Should show assessment name once with aggregated counts
      const assessmentName = screen.getByText("Macroeconomics Midterm");
      expect(assessmentName).toBeInTheDocument();
      
      // Should NOT show individual question cards in list view
      expect(screen.queryByText("Q1 text")).not.toBeInTheDocument();
      expect(screen.queryByText("Q2 text")).not.toBeInTheDocument();
      
      // Should show summary
      expect(screen.getByText(/2 questions/)).toBeInTheDocument();
      expect(screen.getByText(/1 analyzed/)).toBeInTheDocument();
    });

    it("shows questions nested under assessment in detail view", async () => {
      const user = userEvent.setup();
      renderWithHistory([multiQuestionAssessment]);
      
      await user.click(screen.getByText("View"));

      // Assessment name at top
      const heading = screen.getByText("Macroeconomics Midterm");
      expect(heading).toBeInTheDocument();

      // Questions shown as children
      expect(screen.getByText("Question 1")).toBeInTheDocument();
      expect(screen.getByText("Q1 text")).toBeInTheDocument();
      expect(screen.getByText("Q2 text")).toBeInTheDocument();
    });
  });
});
