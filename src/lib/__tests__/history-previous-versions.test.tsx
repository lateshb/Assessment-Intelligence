import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { HistoryProvider, useHistory } from "../use-history";
import { AssessmentProvider } from "../AssessmentContext";
import { createClient } from "../supabase/client";

vi.mock("../supabase/client");

function TestConsumer() {
  const { entries, loading } = useHistory();
  if (loading) return <div>Loading...</div>;
  return (
    <div>
      <div data-testid="entry-count">{entries.length}</div>
      {entries.map((entry) => (
        <div key={entry.id} data-testid={`entry-${entry.id}`}>
          {entry.questions.map((q) => (
            <div key={q.id} data-testid={`question-${q.id}`}>
              <span data-testid={`question-${q.id}-status`}>{q.status}</span>
              <span data-testid={`question-${q.id}-prev-count`}>
                {q.previousAnalyses?.length || 0}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

describe("History Previous Versions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads current analysis by default", async () => {
    const mockUser = { id: "user-1" };
    const mockAssessments = [
      { id: "a1", owner_id: "user-1", name: "Test", updated_at: "2024-01-01", created_at: "2024-01-01" },
    ];
    const mockQuestions = [
      { id: "q1", assessment_id: "a1", position: 1, question_text: "Q1", rubric_snapshot: [], responses: [] },
    ];
    const mockAnalyses = [
      {
        id: "analysis-1",
        question_id: "q1",
        is_current: true,
        question_text_snapshot: "Q1",
        rubric_snapshot: [],
        responses_snapshot: [],
        per_response: [],
        clusters: [],
        gap_map: [],
        recommendation: {},
        model: "gemini",
        latency_ms: 100,
        source: "live",
        created_at: "2024-01-01T10:00:00Z",
      },
    ];

    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
      from: vi.fn((table: string) => {
        if (table === "assessments") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockAssessments, error: null }),
          };
        }
        if (table === "questions") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockQuestions, error: null }),
          };
        }
        if (table === "analyses") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockAnalyses, error: null }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }),
    };

    vi.mocked(createClient).mockReturnValue(mockSupabase as any);

    render(
      <AssessmentProvider>
        <HistoryProvider>
          <TestConsumer />
        </HistoryProvider>
      </AssessmentProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("entry-count").textContent).toBe("1");
    });

    expect(screen.getByTestId("question-q1-status").textContent).toBe("analyzed");
    expect(screen.getByTestId("question-q1-prev-count").textContent).toBe("0");
  });

  it("loads previous analyses when available", async () => {
    const mockUser = { id: "user-1" };
    const mockAssessments = [
      { id: "a1", owner_id: "user-1", name: "Test", updated_at: "2024-01-01", created_at: "2024-01-01" },
    ];
    const mockQuestions = [
      { id: "q1", assessment_id: "a1", position: 1, question_text: "Q1 v2", rubric_snapshot: [], responses: [] },
    ];
    const mockAnalyses = [
      {
        id: "analysis-2",
        question_id: "q1",
        is_current: true,
        question_text_snapshot: "Q1 v2",
        rubric_snapshot: [],
        responses_snapshot: [],
        per_response: [],
        clusters: [],
        gap_map: [],
        recommendation: {},
        model: "gemini",
        latency_ms: 100,
        source: "live",
        created_at: "2024-01-02T10:00:00Z",
      },
      {
        id: "analysis-1",
        question_id: "q1",
        is_current: false,
        question_text_snapshot: "Q1 v1",
        rubric_snapshot: [],
        responses_snapshot: [],
        per_response: [],
        clusters: [],
        gap_map: [],
        recommendation: {},
        model: "gemini",
        latency_ms: 100,
        source: "live",
        created_at: "2024-01-01T10:00:00Z",
      },
    ];

    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
      from: vi.fn((table: string) => {
        if (table === "assessments") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockAssessments, error: null }),
          };
        }
        if (table === "questions") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockQuestions, error: null }),
          };
        }
        if (table === "analyses") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockAnalyses, error: null }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }),
    };

    vi.mocked(createClient).mockReturnValue(mockSupabase as any);

    render(
      <AssessmentProvider>
        <HistoryProvider>
          <TestConsumer />
        </HistoryProvider>
      </AssessmentProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("entry-count").textContent).toBe("1");
    });

    expect(screen.getByTestId("question-q1-status").textContent).toBe("analyzed");
    expect(screen.getByTestId("question-q1-prev-count").textContent).toBe("1");
  });

  it("does not show previous versions control when no previous analyses", async () => {
    const mockUser = { id: "user-1" };
    const mockAssessments = [
      { id: "a1", owner_id: "user-1", name: "Test", updated_at: "2024-01-01", created_at: "2024-01-01" },
    ];
    const mockQuestions = [
      { id: "q1", assessment_id: "a1", position: 1, question_text: "Q1", rubric_snapshot: [], responses: [] },
    ];
    const mockAnalyses = [
      {
        id: "analysis-1",
        question_id: "q1",
        is_current: true,
        question_text_snapshot: "Q1",
        rubric_snapshot: [],
        responses_snapshot: [],
        per_response: [],
        clusters: [],
        gap_map: [],
        recommendation: {},
        model: "gemini",
        latency_ms: 100,
        source: "live",
        created_at: "2024-01-01T10:00:00Z",
      },
    ];

    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
      from: vi.fn((table: string) => {
        if (table === "assessments") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockAssessments, error: null }),
          };
        }
        if (table === "questions") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockQuestions, error: null }),
          };
        }
        if (table === "analyses") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockAnalyses, error: null }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }),
    };

    vi.mocked(createClient).mockReturnValue(mockSupabase as any);

    render(
      <AssessmentProvider>
        <HistoryProvider>
          <TestConsumer />
        </HistoryProvider>
      </AssessmentProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("entry-count").textContent).toBe("1");
    });

    // No previous analyses
    expect(screen.getByTestId("question-q1-prev-count").textContent).toBe("0");
  });
});
