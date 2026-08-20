import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RubricLibraryProvider, useRubricLibrary } from "../use-rubric-library";
import CourseSelector from "@/components/CourseSelector";

// In-memory mock database for round-trip verification
let mockDatabase: any[] = [];
let insertPayloadSpy: any = null;
let updatePayloadSpy: any = null;
let createShouldFail = false;
let updateShouldFail = false;

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => {
  return {
    createClient: vi.fn(() => ({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({ data: { user: { id: "user-123" } }, error: null })
        ),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: { institution_id: "inst-1" }, error: null })
                ),
              })),
            })),
          };
        }

        if (table === "rubric_library") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn((field: string, val: string) => ({
                eq: vi.fn(() => ({
                  neq: vi.fn(() => ({
                    order: vi.fn(() =>
                      Promise.resolve({
                        data: mockDatabase.filter(
                          (r) => r.institution_id === val && r.visibility === "institution" && r.owner_id !== "user-123"
                        ),
                        error: null,
                      })
                    ),
                  })),
                })),
                order: vi.fn(() =>
                  Promise.resolve({
                    data: mockDatabase.filter((r) => r.owner_id === val),
                    error: null,
                  })
                ),
              })),
            })),
            insert: vi.fn((payload: any) => {
              insertPayloadSpy = payload;
              if (createShouldFail) {
                return {
                  select: vi.fn(() => ({
                    single: vi.fn(() =>
                      Promise.resolve({
                        data: null,
                        error: { message: "Database insert error" },
                      })
                    ),
                  })),
                };
              }
              const newRow = {
                id: `rubric-${Date.now()}-${Math.random()}`,
                ...payload,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              mockDatabase.push(newRow);
              return {
                select: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({ data: newRow, error: null })),
                })),
              };
            }),
            update: vi.fn((payload: any) => {
              updatePayloadSpy = payload;
              return {
                eq: vi.fn((idField: string, idVal: string) => {
                  if (updateShouldFail) {
                    return {
                      select: vi.fn(() => ({
                        single: vi.fn(() =>
                          Promise.resolve({
                            data: null,
                            error: { message: "Database update error" },
                          })
                        ),
                      })),
                    };
                  }
                  const index = mockDatabase.findIndex((r) => r.id === idVal);
                  if (index !== -1) {
                    mockDatabase[index] = {
                      ...mockDatabase[index],
                      ...payload,
                    };
                  }
                  return {
                    select: vi.fn(() => ({
                      single: vi.fn(() =>
                        Promise.resolve({
                          data: mockDatabase[index] || null,
                          error: null,
                        })
                      ),
                    })),
                  };
                }),
              };
            }),
          };
        }

        return {};
      }),
    })),
  };
});

function PersistenceHarness({
  onStateChange,
}: {
  onStateChange?: (state: ReturnType<typeof useRubricLibrary>) => void;
}) {
  const lib = useRubricLibrary();

  if (onStateChange) {
    onStateChange(lib);
  }

  const existingCourses = Array.from(new Set(lib.rubrics.map((r) => r.course))).sort();

  return (
    <div>
      <div data-testid="rubrics-count">{lib.rubrics.length}</div>
      <div data-testid="error-message">{lib.error || ""}</div>

      {/* CourseSelector to test course discovery after reload */}
      <CourseSelector
        existingCourses={existingCourses}
        value=""
        onChange={() => {}}
        id="harness-course-selector"
      />

      <ul>
        {lib.rubrics.map((r) => (
          <li key={r.id} data-testid={`rubric-item-${r.id}`}>
            <span data-testid={`name-${r.id}`}>{r.name}</span>
            <span data-testid={`course-${r.id}`}>{r.course}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() =>
          lib.dispatch({
            type: "CREATE_RUBRIC",
            rubric: {
              name: "Microeconomics Midterm Rubric",
              course: "Economics",
              description: "",
              visibility: "private",
              criteria: [
                { name: "C1", description: "", maxMarks: 2 },
                { name: "C2", description: "", maxMarks: 3 },
              ],
            },
          })
        }
        data-testid="create-economics-btn"
      >
        Create Economics Rubric
      </button>

      <button
        onClick={() =>
          lib.dispatch({
            type: "CREATE_RUBRIC",
            rubric: {
              name: "Quantum Mechanics Quiz",
              course: "  Quantum Computing  ",
              description: "",
              visibility: "private",
              criteria: [
                { name: "C1", description: "", maxMarks: 2 },
                { name: "C2", description: "", maxMarks: 3 },
              ],
            },
          })
        }
        data-testid="create-quantum-btn"
      >
        Create Quantum Rubric
      </button>

      <button onClick={() => lib.reload()} data-testid="reload-btn">
        Reload Library
      </button>
    </div>
  );
}

describe("Supabase Course Persistence & Round-Trip Verification", () => {
  beforeEach(() => {
    mockDatabase = [
      {
        id: "r-existing-1",
        owner_id: "user-123",
        institution_id: "inst-1",
        name: "Baseline Elasticity",
        course: "Economics",
        description: "Initial course",
        criteria: [
          { name: "C1", description: "", maxMarks: 2 },
          { name: "C2", description: "", maxMarks: 2 },
        ],
        visibility: "private",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ];
    insertPayloadSpy = null;
    updatePayloadSpy = null;
    createShouldFail = false;
    updateShouldFail = false;
  });

  // ─── CREATE RUBRIC: Existing Course Persistence ──────────────────────────
  it("persists selected existing course in Supabase INSERT payload and round-trips via reload()", async () => {
    const user = userEvent.setup();

    render(
      <RubricLibraryProvider>
        <PersistenceHarness />
      </RubricLibraryProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("rubrics-count").textContent).toBe("1");
    });

    // 1. Click Create Economics Rubric button
    await user.click(screen.getByTestId("create-economics-btn"));

    // 2. Verify Supabase INSERT payload contains selected course
    expect(insertPayloadSpy).toBeDefined();
    expect(insertPayloadSpy.course).toBe("Economics");

    // 3. Verify returned/saved rubric in state contains course
    await waitFor(() => {
      expect(screen.getByTestId("rubrics-count").textContent).toBe("2");
    });
    expect(screen.getByText("Microeconomics Midterm Rubric")).toBeDefined();

    // 4. Reload from Supabase
    await user.click(screen.getByTestId("reload-btn"));

    // 5. Verify rubric still has the same course after reload
    await waitFor(() => {
      expect(screen.getByTestId("rubrics-count").textContent).toBe("2");
    });
    const loadedRow = mockDatabase.find((r) => r.name === "Microeconomics Midterm Rubric");
    expect(loadedRow).toBeDefined();
    expect(loadedRow.course).toBe("Economics");
  });

  // ─── CREATE NEW COURSE Persistence & Discovery ─────────────────────────────
  it("trims whitespace, preserves capitalization, persists new course, and lists it in CourseSelector after reload()", async () => {
    const user = userEvent.setup();

    render(
      <RubricLibraryProvider>
        <PersistenceHarness />
      </RubricLibraryProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("rubrics-count").textContent).toBe("1");
    });

    // 1. Create rubric with new course "  Quantum Computing  "
    await user.click(screen.getByTestId("create-quantum-btn"));

    // 2. Verify INSERT payload contains exact trimmed course string with preserved capitalization
    expect(insertPayloadSpy.course).toBe("Quantum Computing");

    // 3. Reload library from Supabase
    await user.click(screen.getByTestId("reload-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("rubrics-count").textContent).toBe("2");
    });

    // 4. Verify new course is present in loaded rubric data
    const quantumRow = mockDatabase.find((r) => r.course === "Quantum Computing");
    expect(quantumRow).toBeDefined();
    expect(quantumRow.course).toBe("Quantum Computing");

    // 5. Verify new course appears in CourseSelector dropdown options afterward
    const courseTrigger = screen.getByRole("button", { name: /select course/i });
    await user.click(courseTrigger);

    const options = screen.getAllByRole("option");
    const optionTexts = options.map((opt) => opt.textContent);
    expect(optionTexts.some((txt) => txt?.includes("Quantum Computing"))).toBe(true);
    expect(optionTexts.some((txt) => txt?.includes("Economics"))).toBe(true);
  });

  // ─── EDIT RUBRIC Persistence & Round-Trip ──────────────────────────────────
  it("persists UPDATE payload when course is changed to another course and reloads cleanly", async () => {
    let capturedLib: ReturnType<typeof useRubricLibrary> | null = null;

    render(
      <RubricLibraryProvider>
        <PersistenceHarness
          onStateChange={(lib) => {
            capturedLib = lib;
          }}
        />
      </RubricLibraryProvider>
    );

    await waitFor(() => {
      expect(capturedLib?.rubrics.length).toBe(1);
    });

    const targetRubric = capturedLib!.rubrics[0];
    expect(targetRubric.course).toBe("Economics");

    // 1. Change course to another existing course "Advanced Chemistry"
    await act(async () => {
      await capturedLib!.dispatch({
        type: "UPDATE_RUBRIC",
        id: targetRubric.id,
        updates: {
          course: "  Advanced Chemistry  ",
        },
      });
    });

    // 2. Verify UPDATE payload received trimmed course "Advanced Chemistry"
    expect(updatePayloadSpy).toBeDefined();
    expect(updatePayloadSpy.course).toBe("Advanced Chemistry");

    // 3. Reload from Supabase
    await act(async () => {
      await capturedLib!.reload();
    });

    // 4. Verify rubric retains new course in database and reloaded state
    const updatedDbRow = mockDatabase.find((r) => r.id === targetRubric.id);
    expect(updatedDbRow.course).toBe("Advanced Chemistry");
    expect(capturedLib!.rubrics[0].course).toBe("Advanced Chemistry");
  });

  // ─── EDIT RUBRIC WITHOUT CHANGING COURSE ───────────────────────────────────
  it("preserves original course value when editing rubric without changing course", async () => {
    let capturedLib: ReturnType<typeof useRubricLibrary> | null = null;

    render(
      <RubricLibraryProvider>
        <PersistenceHarness
          onStateChange={(lib) => {
            capturedLib = lib;
          }}
        />
      </RubricLibraryProvider>
    );

    await waitFor(() => {
      expect(capturedLib?.rubrics.length).toBe(1);
    });

    const targetRubric = capturedLib!.rubrics[0];

    // Update name without changing course
    await act(async () => {
      await capturedLib!.dispatch({
        type: "UPDATE_RUBRIC",
        id: targetRubric.id,
        updates: {
          name: "Updated Baseline Name",
          course: "Economics",
        },
      });
    });

    expect(updatePayloadSpy.course).toBe("Economics");
    expect(mockDatabase[0].course).toBe("Economics");
    expect(mockDatabase[0].name).toBe("Updated Baseline Name");
  });

  // ─── FAILED SUPABASE CREATE / UPDATE HANDLING ─────────────────────────────
  it("does NOT falsely update local state or show success if Supabase CREATE or UPDATE fails", async () => {
    let capturedLib: ReturnType<typeof useRubricLibrary> | null = null;

    render(
      <RubricLibraryProvider>
        <PersistenceHarness
          onStateChange={(lib) => {
            capturedLib = lib;
          }}
        />
      </RubricLibraryProvider>
    );

    await waitFor(() => {
      expect(capturedLib?.rubrics.length).toBe(1);
    });

    // Simulate Supabase insert failure
    createShouldFail = true;

    let result = false;
    await act(async () => {
      result = await capturedLib!.dispatch({
        type: "CREATE_RUBRIC",
        rubric: {
          name: "Unpersisted Rubric",
          course: "Economics",
          description: "",
          visibility: "private",
          criteria: [
            { name: "C1", description: "", maxMarks: 1 },
            { name: "C2", description: "", maxMarks: 1 },
          ],
        },
      });
    });

    // Dispatch returned false
    expect(result).toBe(false);

    // Error recorded in context state
    expect(capturedLib!.error).toBe("Database insert error");

    // Local state rubrics count is UNCHANGED (did not add unpersisted rubric)
    expect(capturedLib!.rubrics.length).toBe(1);
    expect(capturedLib!.rubrics.some((r) => r.name === "Unpersisted Rubric")).toBe(false);

    // Database count is UNCHANGED
    expect(mockDatabase.length).toBe(1);

    // Simulate Supabase update failure
    updateShouldFail = true;
    let updateResult = false;
    await act(async () => {
      updateResult = await capturedLib!.dispatch({
        type: "UPDATE_RUBRIC",
        id: "r-existing-1",
        updates: {
          course: "Non-Existent Course",
        },
      });
    });

    expect(updateResult).toBe(false);
    expect(capturedLib!.error).toBe("Database update error");
    expect(mockDatabase[0].course).toBe("Economics");
  });
});
