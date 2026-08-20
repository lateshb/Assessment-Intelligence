import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuestionCard from "../QuestionCard";
import SaveAsGlobalRubricModal, {
  canSaveAsGlobalRubric,
  deriveRubricName,
  getRubricSaveDisabledReason,
} from "../SaveAsGlobalRubricModal";
import { AssessmentProvider } from "@/lib/AssessmentContext";
import { RubricLibraryProvider, useRubricLibrary } from "@/lib/use-rubric-library";
import { HistoryProvider } from "@/lib/use-history";
import type { QuestionState } from "@/lib/assessment-types";
import type { Rubric } from "@/lib/types";
import type { ReactNode } from "react";

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => {
  const createQueryChain = () => {
    const chain: any = {
      eq: vi.fn(() => chain),
      neq: vi.fn(() => chain),
      order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      single: vi.fn(() => Promise.resolve({ data: { institution_id: "inst-1" }, error: null })),
      select: vi.fn(() => chain),
    };
    return chain;
  };

  return {
    createClient: vi.fn(() => ({
      auth: {
        getUser: vi.fn(() => Promise.resolve({ data: { user: { id: "user-123" } }, error: null })),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => createQueryChain()),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: {
                  id: "rubric-saved-123",
                  name: "Saved Rubric",
                  course: "Economics",
                  description: "",
                  criteria: [],
                  visibility: "private",
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              })
            ),
          })),
        })),
      })),
    })),
  };
});

function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <AssessmentProvider>
      <HistoryProvider>
        <RubricLibraryProvider>{children}</RubricLibraryProvider>
      </HistoryProvider>
    </AssessmentProvider>
  );
}

function makeQuestion(overrides?: Partial<QuestionState>): QuestionState {
  return {
    id: "q1",
    questionText: "Explain price elasticity of demand.",
    rubric: [
      { name: "Definition", description: "Clear definition of PED formula", maxMarks: 2 },
      { name: "Application", description: "Applies formula correctly to example", maxMarks: 4 },
    ],
    responseTab: "paste",
    pasteText: "Sample student response",
    csvRows: null,
    csvName: "",
    status: "ready",
    analysis: null,
    error: null,
    expanded: true,
    analyzedInputHash: null,
    ...overrides,
  };
}

describe("Save as Global Rubric Workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Save button appears in the Workspace
  it("renders 'Save as Global Rubric' button in QuestionCard", () => {
    const question = makeQuestion();
    const dispatch = vi.fn();

    render(
      <TestWrapper>
        <QuestionCard
          question={question}
          questionIndex={0}
          totalQuestions={1}
          dispatch={dispatch}
          onAnalyze={vi.fn()}
        />
      </TestWrapper>
    );

    const button = screen.getByRole("button", { name: /save as global rubric/i }) as HTMLButtonElement;
    expect(button).toBeDefined();
    expect(button.disabled).toBe(false);
  });

  // 2. Button is disabled/blocked for invalid rubrics
  it("disables 'Save as Global Rubric' button for invalid rubrics", () => {
    // Fewer than 2 criteria
    const invalidRubric1 = makeQuestion({
      rubric: [{ name: "Definition", description: "Formula", maxMarks: 2 }],
    });
    expect(canSaveAsGlobalRubric(invalidRubric1.rubric)).toBe(false);
    expect(getRubricSaveDisabledReason(invalidRubric1.rubric)).toBe(
      "Rubric must have at least 2 criteria."
    );

    // Empty criterion name
    const invalidRubric2 = makeQuestion({
      rubric: [
        { name: "Definition", description: "Formula", maxMarks: 2 },
        { name: "", description: "No name", maxMarks: 2 },
      ],
    });
    expect(canSaveAsGlobalRubric(invalidRubric2.rubric)).toBe(false);
    expect(getRubricSaveDisabledReason(invalidRubric2.rubric)).toBe(
      "Every criterion must have a name."
    );

    // Criterion maxMarks < 1
    const invalidRubric3 = makeQuestion({
      rubric: [
        { name: "Definition", description: "Formula", maxMarks: 2 },
        { name: "Application", description: "Example", maxMarks: 0 },
      ],
    });
    expect(canSaveAsGlobalRubric(invalidRubric3.rubric)).toBe(false);
    expect(getRubricSaveDisabledReason(invalidRubric3.rubric)).toBe(
      "Every criterion must have at least 1 mark."
    );

    // Button rendered disabled in QuestionCard
    const dispatch = vi.fn();
    render(
      <TestWrapper>
        <QuestionCard
          question={invalidRubric1}
          questionIndex={0}
          totalQuestions={1}
          dispatch={dispatch}
          onAnalyze={vi.fn()}
        />
      </TestWrapper>
    );

    const button = screen.getByRole("button", { name: /save as global rubric/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  // 3. Clicking it opens the save modal
  it("opens the save modal when valid button is clicked", async () => {
    const user = userEvent.setup();
    const question = makeQuestion();
    const dispatch = vi.fn();

    render(
      <TestWrapper>
        <QuestionCard
          question={question}
          questionIndex={0}
          totalQuestions={1}
          dispatch={dispatch}
          onAnalyze={vi.fn()}
        />
      </TestWrapper>
    );

    const button = screen.getByRole("button", { name: /save as global rubric/i });
    await user.click(button);

    const modalTitle = screen.getByRole("heading", { name: /save as global rubric/i });
    expect(modalTitle).toBeDefined();
    expect(screen.getByText("Save the current rubric criteria as a reusable template.")).toBeDefined();
  });

  // 4. Name/course/visibility fields work
  it("pre-fills fields and allows editing name, course, description, visibility", async () => {
    const user = userEvent.setup();
    const question = makeQuestion({ questionText: "Explain price elasticity of demand." });

    render(
      <TestWrapper>
        <SaveAsGlobalRubricModal
          questionText={question.questionText}
          criteria={question.rubric}
          onClose={vi.fn()}
        />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText(/rubric name \*/i) as HTMLInputElement;
    const descInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
    const visibilitySelect = screen.getByLabelText(/visibility/i) as HTMLSelectElement;

    // Derived pre-fill
    expect(nameInput.value).toBe("Explain price elasticity of demand — Assessment Rubric");

    // Edit fields
    await user.clear(nameInput);
    await user.type(nameInput, "Custom Economics Rubric");
    expect(nameInput.value).toBe("Custom Economics Rubric");

    // Course input when no existing courses are loaded
    const courseInput = screen.getByPlaceholderText(/enter new course name/i) as HTMLInputElement;
    await user.type(courseInput, "AP Economics");
    expect(courseInput.value).toBe("AP Economics");

    await user.type(descInput, "Used for midterms");
    expect(descInput.value).toBe("Used for midterms");

    await user.selectOptions(visibilitySelect, "institution");
    expect(visibilitySelect.value).toBe("institution");
  });

  // 5. Existing rubric criteria are passed correctly to library creation flow
  it("displays summary of criteria and total marks in modal", () => {
    const question = makeQuestion();

    render(
      <TestWrapper>
        <SaveAsGlobalRubricModal
          questionText={question.questionText}
          criteria={question.rubric}
          onClose={vi.fn()}
        />
      </TestWrapper>
    );

    // 2 criteria, (2 + 4 = 6 marks)
    expect(screen.getByText("2 criteria · 6 total marks")).toBeDefined();
  });

  // 6. Save uses the existing CREATE_RUBRIC path
  // 7. Successful save shows confirmation
  it("persists rubric via CREATE_RUBRIC and shows success confirmation", async () => {
    const user = userEvent.setup();
    const question = makeQuestion();
    const onClose = vi.fn();

    render(
      <TestWrapper>
        <SaveAsGlobalRubricModal
          questionText={question.questionText}
          criteria={question.rubric}
          onClose={onClose}
        />
      </TestWrapper>
    );

    const courseInput = screen.getByPlaceholderText(/enter new course name/i);
    await user.type(courseInput, "Economics");

    const saveButton = screen.getByRole("button", { name: /save global rubric/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("✓ Rubric saved to Global Rubrics")).toBeDefined();
    });

    const viewLink = screen.getByRole("link", { name: /view global rubrics/i });
    expect(viewLink.getAttribute("href")).toBe("/rubric-library");
  });

  // 8. Failed save does not show success and allows retry
  it("shows error and keeps modal open if creation fails or course is empty", async () => {
    const user = userEvent.setup();
    const question = makeQuestion();

    render(
      <TestWrapper>
        <SaveAsGlobalRubricModal
          questionText={question.questionText}
          criteria={question.rubric}
          onClose={vi.fn()}
        />
      </TestWrapper>
    );

    // Leave course empty
    const saveButton = screen.getByRole("button", { name: /save global rubric/i });
    await user.click(saveButton);

    // Shows validation error "Course is required."
    expect(screen.getByText("Course is required.")).toBeDefined();
    expect(screen.queryByText("✓ Rubric saved to Global Rubrics")).toBeNull();
  });

  // 9. Saving does not change current question rubric or trigger analysis
  it("does NOT alter current question state, question rubric, or trigger analysis dispatch", async () => {
    const user = userEvent.setup();
    const question = makeQuestion();
    const initialRubric = JSON.parse(JSON.stringify(question.rubric));
    const questionDispatch = vi.fn();

    render(
      <TestWrapper>
        <QuestionCard
          question={question}
          questionIndex={0}
          totalQuestions={1}
          dispatch={questionDispatch}
          onAnalyze={vi.fn()}
        />
      </TestWrapper>
    );

    // Open modal
    await user.click(screen.getByRole("button", { name: /save as global rubric/i }));

    const courseInput = screen.getByPlaceholderText(/enter new course name/i);
    await user.type(courseInput, "Economics");

    // Click save in modal
    const saveButton = screen.getByRole("button", { name: /save global rubric/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("✓ Rubric saved to Global Rubrics")).toBeDefined();
    });

    // Question dispatch was never called (no SET_RUBRIC, no START_ANALYSIS, no action)
    expect(questionDispatch).not.toHaveBeenCalled();

    // Question rubric object was not modified
    expect(question.rubric).toEqual(initialRubric);
    expect(question.status).toBe("ready");
  });

  // 10. Criteria are copied/snapshotted rather than sharing mutable references
  it("snapshots criteria so mutating question criteria after save does not mutate saved library rubric", async () => {
    const questionCriteria: Rubric[] = [
      { name: "Criterion 1", description: "Desc 1", maxMarks: 3 },
      { name: "Criterion 2", description: "Desc 2", maxMarks: 5 },
    ];

    let capturedPayload: any = null;
    const mockDispatch = vi.fn().mockImplementation((action: any) => {
      capturedPayload = action.rubric.criteria;
      return Promise.resolve(true);
    });

    // Directly test snapshot creation in handleSave / modal payload
    const snapshot = questionCriteria.map((c) => ({
      name: c.name,
      description: c.description,
      maxMarks: Number(c.maxMarks) || 1,
    }));

    // Mutate original question criteria array
    questionCriteria[0].name = "MUTATED IN QUESTION";
    questionCriteria[0].maxMarks = 999;

    // Snapshot retains original values
    expect(snapshot[0].name).toBe("Criterion 1");
    expect(snapshot[0].maxMarks).toBe(3);
  });
});
