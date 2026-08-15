import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import AssessmentWorkspace from "../AssessmentWorkspace";
import { RubricLibraryProvider } from "@/lib/use-rubric-library";
import { HistoryProvider } from "@/lib/use-history";
import type { ReactNode } from "react";

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  })),
}));

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <HistoryProvider>
      <RubricLibraryProvider>{children}</RubricLibraryProvider>
    </HistoryProvider>
  );
}

// Mock fetch for demo data
const mockDemoData = {
  question: "Explain price elasticity of demand.",
  rubric: [
    { name: "Definition", description: "Correct formula", maxMarks: 3 },
    { name: "Interpretation", description: "Meaning", maxMarks: 4 },
  ],
  responses: Array.from({ length: 10 }, (_, i) => ({
    id: `R${String(i + 1).padStart(2, "0")}`,
    text: `Response ${i + 1} text here`,
  })),
};

const mockAnalysis = {
  perResponse: mockDemoData.responses.map((r) => ({
    id: r.id,
    category: "correct" as const,
    modelCategory: "correct" as const,
    misconception: null,
    evidence: r.text,
    confidence: 0.9,
    criterionScores: [1, 0.5],
    draftMark: 5,
  })),
  clusters: [],
  gapMap: [
    { criterion: "Definition", masteryPct: 100, level: "good" as const },
    { criterion: "Interpretation", masteryPct: 50, level: "warning" as const },
  ],
  recommendation: {
    type: "Revision session",
    durationMin: 15,
    targetDescription: "Students with misconceptions",
    targetIds: ["R01"],
    rationale: "Test rationale",
    followUp: "Test follow-up",
  },
  meta: { model: "test", latencyMs: 100, disclaimer: "Test", source: "live" as const },
};

beforeEach(() => {
  vi.restoreAllMocks();
  globalThis.fetch = vi.fn((url: string | URL | Request) => {
    const urlStr = typeof url === "string" ? url : url.toString();
    if (urlStr.includes("demo-data")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockDemoData),
      } as Response);
    }
    if (urlStr.includes("demo-results")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAnalysis),
      } as Response);
    }
    if (urlStr.includes("/api/analyze")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAnalysis),
      } as Response);
    }
    return Promise.reject(new Error(`Unmocked fetch: ${urlStr}`));
  }) as typeof fetch;
});

describe("AssessmentWorkspace", () => {
  it("renders with one empty question initially", () => {
    render(<AssessmentWorkspace />, { wrapper: Wrapper });
    expect(screen.getByText("Question 1")).toBeInTheDocument();
    expect(screen.getByText("1 question")).toBeInTheDocument();
  });

  it("has an assessment name input", () => {
    render(<AssessmentWorkspace />, { wrapper: Wrapper });
    expect(screen.getByPlaceholderText("Assessment name (optional)")).toBeInTheDocument();
  });

  it("has Add Question and Analyze All buttons", () => {
    render(<AssessmentWorkspace />, { wrapper: Wrapper });
    expect(screen.getByText("+ Add Question")).toBeInTheDocument();
    expect(screen.getByText("Analyze All")).toBeInTheDocument();
  });

  it("adds a question when + Add Question is clicked", async () => {
    const user = userEvent.setup();
    render(<AssessmentWorkspace />, { wrapper: Wrapper });
    await user.click(screen.getByText("+ Add Question"));
    expect(screen.getByText("Question 2")).toBeInTheDocument();
    expect(screen.getByText("2 questions")).toBeInTheDocument();
  });

  it("loads demo data into first question", async () => {
    const user = userEvent.setup();
    render(<AssessmentWorkspace />, { wrapper: Wrapper });
    await user.click(screen.getByText(/Load demo data/));

    // Wait for fetch and state update
    const textarea = await screen.findByDisplayValue("Explain price elasticity of demand.");
    expect(textarea).toBeInTheDocument();
  });

  it("shows the hero section", () => {
    render(<AssessmentWorkspace />, { wrapper: Wrapper });
    expect(
      screen.getByText(/Turn a pile of graded answers into one specific teaching decision/)
    ).toBeInTheDocument();
  });
});

describe("AssessmentWorkspace — question actions", () => {
  it("deletes a question when there are multiple", async () => {
    const user = userEvent.setup();
    render(<AssessmentWorkspace />, { wrapper: Wrapper });

    // Add a second question
    await user.click(screen.getByText("+ Add Question"));
    expect(screen.getByText("2 questions")).toBeInTheDocument();

    // Open action menu for Q1 (first ⋯ button)
    const actionButtons = screen.getAllByText("⋯");
    await user.click(actionButtons[0]);

    // Click Delete
    await user.click(screen.getByText("Delete"));

    // Confirm deletion
    await user.click(screen.getByText("Confirm"));

    expect(screen.getByText("1 question")).toBeInTheDocument();
  });

  it("cannot delete the final question", async () => {
    const user = userEvent.setup();
    render(<AssessmentWorkspace />, { wrapper: Wrapper });

    // Only one question — open action menu
    const actionButton = screen.getByText("⋯");
    await user.click(actionButton);

    // Delete should be disabled
    const deleteBtn = screen.getByText(/Delete/);
    expect(deleteBtn).toBeDisabled();
  });
});
