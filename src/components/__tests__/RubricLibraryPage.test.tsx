import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RubricLibraryPage from "../RubricLibraryPage";
import { RubricLibraryProvider } from "@/lib/use-rubric-library";

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => {
  const createQueryChain = () => {
    const chain: any = {
      eq: vi.fn(() => chain),
      neq: vi.fn(() => chain),
      order: vi.fn(() =>
        Promise.resolve({
          data: [
            {
              id: "rubric-1",
              name: "Elasticity Rubric",
              course: "Economics",
              description: "Midterm rubric",
              criteria: [
                { name: "Criterion A", description: "Desc", maxMarks: 2 },
                { name: "Criterion B", description: "Desc", maxMarks: 3 },
              ],
              visibility: "private",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          error: null,
        })
      ),
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
        insert: vi.fn((data: any) => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: {
                  id: "rubric-created-123",
                  name: data.name || "New Rubric",
                  course: data.course || "Physics",
                  description: data.description || "",
                  criteria: data.criteria || [
                    { name: "Criterion 1", description: "", maxMarks: 2 },
                    { name: "Criterion 2", description: "", maxMarks: 2 },
                  ],
                  visibility: data.visibility || "private",
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              })
            ),
          })),
        })),
        update: vi.fn((data: any) => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: {
                    id: "rubric-1",
                    name: data.name || "Elasticity Rubric",
                    course: data.course || "Economics",
                    description: data.description || "",
                    criteria: data.criteria || [],
                    visibility: data.visibility || "private",
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
    })),
  };
});

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <RubricLibraryProvider>{children}</RubricLibraryProvider>;
}

describe("RubricLibraryPage - Create & Edit Rubric Workflows", () => {
  it("renders Create Rubric form with empty CourseSelector requiring course selection/entry", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <RubricLibraryPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading rubrics/i)).toBeNull();
    });

    const createBtn = screen.getByRole("button", { name: /create rubric/i });
    await user.click(createBtn);

    expect(screen.getByRole("heading", { name: /create rubric/i })).toBeDefined();

    // Fill rubric name so validation reaches Course check
    const nameInput = screen.getByLabelText(/rubric name \*/i);
    await user.type(nameInput, "Physics Mechanics Rubric");

    const courseTrigger = screen.getByRole("button", { name: /select course/i });
    expect(courseTrigger.textContent).toContain("Select course");

    const saveBtn = screen.getByRole("button", { name: /create rubric/i });
    await user.click(saveBtn);

    expect(screen.getByText(/course is required/i)).toBeDefined();
  });

  it("allows selecting an existing course or creating a new course in Create Rubric form", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <RubricLibraryPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading rubrics/i)).toBeNull();
    });

    await user.click(screen.getByRole("button", { name: /create rubric/i }));

    const courseTrigger = screen.getByRole("button", { name: /select course/i });
    await user.click(courseTrigger);

    const createNewOption = screen.getByRole("button", { name: /create new course/i });
    await user.click(createNewOption);

    const courseInput = screen.getByPlaceholderText(/enter course name/i);
    await user.type(courseInput, "Computer Science");

    const nameInput = screen.getByLabelText(/rubric name \*/i);
    await user.type(nameInput, "CS Assessment Rubric");

    const criteriaInputs = screen.getAllByPlaceholderText(/criterion.*name/i);
    if (criteriaInputs.length >= 2) {
      await user.type(criteriaInputs[0], "Code Formatting");
      await user.type(criteriaInputs[1], "Algorithm Efficiency");
    }

    const saveBtn = screen.getByRole("button", { name: /create rubric/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText("CS Assessment Rubric")).toBeDefined();
    });
  });

  it("pre-populates existing course in Edit Rubric form and allows changing or keeping original course", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <RubricLibraryPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Elasticity Rubric")).toBeDefined();
    });

    // Click Edit on existing rubric card
    const editBtn = screen.getByRole("button", { name: /edit/i });
    await user.click(editBtn);

    expect(screen.getByRole("heading", { name: /edit rubric/i })).toBeDefined();

    // Pre-populated course in CourseSelector trigger
    const courseTrigger = screen.getByRole("button", { name: /select course/i });
    expect(courseTrigger.textContent).toContain("Economics");

    // Click trigger and verify current course is in options
    await user.click(courseTrigger);
    const options = screen.getAllByRole("option");
    expect(options.some((opt) => opt.textContent?.includes("Economics"))).toBe(true);

    // Save edit without changing course (preserves original course)
    const saveBtn = screen.getByRole("button", { name: /save changes/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText("Elasticity Rubric")).toBeDefined();
    });
  });
});
