import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import Results from "../Results";
import type { Analysis } from "@/lib/types";

const analysis: Analysis = {
  perResponse: [
    {
      id: "R01",
      category: "correct",
      modelCategory: "correct",
      misconception: null,
      evidence: "PED is the percentage change",
      confidence: 0.92,
      criterionScores: [1, 1, 0.5],
      draftMark: 8.5,
    },
    {
      id: "R02",
      category: "partial",
      modelCategory: "partial",
      misconception: null,
      evidence: "Elasticity means demand falls",
      confidence: 0.75,
      criterionScores: [0.5, 0.5, 0],
      draftMark: 3.5,
    },
    {
      id: "R03",
      category: "misconception",
      modelCategory: "misconception",
      misconception: "Confuses elasticity with slope",
      evidence: "It is the slope of the demand curve",
      confidence: 0.85,
      criterionScores: [0, 0, 0],
      draftMark: 0,
    },
    {
      id: "R04",
      category: "needs_review",
      modelCategory: "partial",
      misconception: null,
      evidence: "",
      confidence: 0.3,
      criterionScores: [0, 0, 0],
      draftMark: 0,
    },
  ],
  clusters: [
    {
      label: "Confuses elasticity with slope",
      explanation: "Students wrongly believe PED is the slope of the demand curve.",
      responseIds: ["R03"],
      avgConfidence: 0.85,
    },
  ],
  gapMap: [
    { criterion: "Definition", masteryPct: 38, level: "critical" },
    { criterion: "Interpretation", masteryPct: 38, level: "critical" },
    { criterion: "Application", masteryPct: 13, level: "critical" },
  ],
  recommendation: {
    type: "Targeted revision session",
    durationMin: 15,
    targetDescription: "Students with misconceptions",
    targetIds: ["R02", "R03", "R04"],
    rationale: "Application is the weakest criterion at 13% mastery.",
    followUp: "Run a 5-question diagnostic within 3 days.",
  },
  meta: {
    model: "test-model",
    latencyMs: 100,
    disclaimer: "AI-generated analysis. All marks are drafts.",
    source: "live",
  },
};

describe("Results component", () => {
  it("renders the total response count", () => {
    render(<Results analysis={analysis} />);
    expect(screen.getByText(/4 responses analysed/i)).toBeInTheDocument();
  });

  it("displays category counts in summary strip", () => {
    render(<Results analysis={analysis} />);
    // The component renders counts for each category
    expect(screen.getByText(/1 Correct/)).toBeInTheDocument();
    expect(screen.getByText(/1 Partially correct/)).toBeInTheDocument();
    expect(screen.getByText(/1 Misconception/)).toBeInTheDocument();
    expect(screen.getByText(/1 Needs teacher review/)).toBeInTheDocument();
  });

  it("renders gap map with criterion names and mastery percentages", () => {
    render(<Results analysis={analysis} />);
    expect(screen.getByText("Definition")).toBeInTheDocument();
    expect(screen.getByText("Application")).toBeInTheDocument();
    // 38% appears twice (Definition + Interpretation), 13% once
    expect(screen.getAllByText("38%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("13%")).toBeInTheDocument();
  });

  it("shows 'Critical gap' badge for critical-level criteria", () => {
    render(<Results analysis={analysis} />);
    const criticalBadges = screen.getAllByText("Critical gap");
    expect(criticalBadges.length).toBeGreaterThan(0);
  });

  it("renders misconception cluster cards", () => {
    render(<Results analysis={analysis} />);
    expect(screen.getByText("Confuses elasticity with slope")).toBeInTheDocument();
    expect(screen.getByText(/wrongly believe PED is the slope/)).toBeInTheDocument();
  });

  it("renders evidence quotes in cluster cards", () => {
    render(<Results analysis={analysis} />);
    expect(screen.getByText(/It is the slope of the demand curve/)).toBeInTheDocument();
  });

  it("shows response detail table when toggle is clicked", async () => {
    const user = userEvent.setup();
    render(<Results analysis={analysis} />);

    // Table should be hidden initially
    expect(screen.queryByText("R01")).not.toBeInTheDocument();

    // Click the toggle button
    const toggle = screen.getByText(/Response-level detail/);
    await user.click(toggle);

    // Now table content should be visible
    expect(screen.getByText("R01")).toBeInTheDocument();
    expect(screen.getByText("R02")).toBeInTheDocument();
  });

  it("labels marks as 'draft'", async () => {
    const user = userEvent.setup();
    render(<Results analysis={analysis} />);

    const toggle = screen.getByText(/Response-level detail/);
    await user.click(toggle);

    const draftLabels = screen.getAllByText("draft");
    expect(draftLabels.length).toBeGreaterThan(0);
  });

  it("shows confidence note about 60% threshold", () => {
    render(<Results analysis={analysis} />);
    expect(screen.getByText(/60% classification confidence/)).toBeInTheDocument();
  });
});
