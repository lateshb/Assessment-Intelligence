import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CourseSelector from "../CourseSelector";

function StatefulCourseSelector({
  existingCourses = ["Biology", "Economics", "History", "Physics"],
  initialValue = "",
  onChangeSpy,
}: {
  existingCourses?: string[];
  initialValue?: string;
  onChangeSpy?: (val: string) => void;
}) {
  const [val, setVal] = useState(initialValue);
  return (
    <CourseSelector
      existingCourses={existingCourses}
      value={val}
      onChange={(newVal) => {
        setVal(newVal);
        onChangeSpy?.(newVal);
      }}
    />
  );
}

describe("CourseSelector Component", () => {
  const sampleCourses = ["Biology", "Economics", "History", "Physics"];

  // 1. Existing courses appear in selector
  it("renders trigger button with value and lists existing courses in alphabetical order when opened", async () => {
    const user = userEvent.setup();

    render(
      <CourseSelector
        existingCourses={["Physics", "Biology", "Economics"]}
        value="Economics"
        onChange={vi.fn()}
      />
    );

    const trigger = screen.getByRole("button", { name: /select course/i });
    expect(trigger.textContent).toContain("Economics");

    await user.click(trigger);

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0].textContent).toContain("Biology");
    expect(options[1].textContent).toContain("Economics");
    expect(options[2].textContent).toContain("Physics");
  });

  // 2. Duplicate course values are deduplicated
  it("deduplicates duplicate course values passed in existingCourses", async () => {
    const user = userEvent.setup();

    render(
      <CourseSelector
        existingCourses={["Economics", "Economics", "Biology", "Biology"]}
        value="Economics"
        onChange={vi.fn()}
      />
    );

    const trigger = screen.getByRole("button", { name: /select course/i });
    await user.click(trigger);

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0].textContent).toContain("Biology");
    expect(options[1].textContent).toContain("Economics");
  });

  // 3. Empty library behavior
  it("renders empty state 'No courses yet' and '+ Create new course' when no courses exist", async () => {
    const user = userEvent.setup();

    render(
      <CourseSelector
        existingCourses={[]}
        value=""
        onChange={vi.fn()}
      />
    );

    const trigger = screen.getByRole("button", { name: /select course/i });
    expect(trigger.textContent).toContain("Select course");

    await user.click(trigger);

    expect(screen.getByText("No courses yet")).toBeDefined();
    expect(screen.getByRole("button", { name: /create new course/i })).toBeDefined();
  });

  // 4. Selecting an existing course populates the field
  it("calls onChange when an existing course option is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <CourseSelector
        existingCourses={sampleCourses}
        value="Economics"
        onChange={onChange}
      />
    );

    const trigger = screen.getByRole("button", { name: /select course/i });
    await user.click(trigger);

    const options = screen.getAllByRole("option");
    const biologyOption = options.find((opt) => opt.textContent?.includes("Biology"));
    expect(biologyOption).toBeDefined();
    await user.click(biologyOption!);

    expect(onChange).toHaveBeenCalledWith("Biology");
  });

  // 5. Create new course switches to text-entry mode
  it("switches to text-entry mode when 'Create new course' is clicked", async () => {
    const user = userEvent.setup();

    render(
      <CourseSelector
        existingCourses={sampleCourses}
        value="Economics"
        onChange={vi.fn()}
      />
    );

    const trigger = screen.getByRole("button", { name: /select course/i });
    await user.click(trigger);

    const createOption = screen.getByRole("button", { name: /create new course/i });
    await user.click(createOption);

    const textInput = screen.getByPlaceholderText(/enter course name/i);
    expect(textInput).toBeDefined();

    const backBtn = screen.getByRole("button", { name: /back to course list/i });
    expect(backBtn).toBeDefined();
  });

  // 6. New course can be entered
  it("allows typing a new course name in create mode", async () => {
    const user = userEvent.setup();
    const onChangeSpy = vi.fn();

    render(
      <StatefulCourseSelector
        existingCourses={sampleCourses}
        initialValue=""
        onChangeSpy={onChangeSpy}
      />
    );

    await user.click(screen.getByRole("button", { name: /select course/i }));
    await user.click(screen.getByRole("button", { name: /create new course/i }));

    const textInput = screen.getByPlaceholderText(/enter course name/i) as HTMLInputElement;
    await user.type(textInput, "Computer Science");

    expect(textInput.value).toBe("Computer Science");
    expect(onChangeSpy).toHaveBeenLastCalledWith("Computer Science");
  });

  // 7. Back to course list switches back to select mode
  it("switches back to select mode when 'Back to course list' is clicked", async () => {
    const user = userEvent.setup();

    render(
      <CourseSelector
        existingCourses={sampleCourses}
        value="Economics"
        onChange={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /select course/i }));
    await user.click(screen.getByRole("button", { name: /create new course/i }));

    const backBtn = screen.getByRole("button", { name: /back to course list/i });
    await user.click(backBtn);

    const trigger = screen.getByRole("button", { name: /select course/i });
    expect(trigger).toBeDefined();
  });

  // 8. Filtering works in search input
  it("filters courses when typing in search input", async () => {
    const user = userEvent.setup();

    render(
      <CourseSelector
        existingCourses={["Algebra", "AP Biology", "AP Chemistry", "Calculus"]}
        value="Algebra"
        onChange={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /select course/i }));

    const searchInput = screen.getByPlaceholderText(/search courses…/i);
    await user.type(searchInput, "AP");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0].textContent).toContain("AP Biology");
    expect(options[1].textContent).toContain("AP Chemistry");
  });
});
