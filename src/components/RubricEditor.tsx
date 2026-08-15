"use client";

import type { Rubric } from "@/lib/types";

/**
 * Reusable rubric criteria editor.
 * Used both in QuestionCard (inline editing) and Rubric Library (create/edit forms).
 */
export default function RubricEditor({
  criteria,
  onChange,
  maxCriteria = 5,
  minCriteria = 2,
  showHeader = false,
}: {
  criteria: Rubric[];
  onChange: (criteria: Rubric[]) => void;
  maxCriteria?: number;
  minCriteria?: number;
  showHeader?: boolean;
}) {
  const totalMarks = criteria.reduce((sum, c) => sum + (Number(c.maxMarks) || 0), 0);

  return (
    <div className="space-y-3">
      {showHeader && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-[#565C82]">
            Rubric criteria ({criteria.length}) · {totalMarks} total marks
          </p>
        </div>
      )}
      {criteria.map((r, i) => (
        <div
          key={i}
          className="group rounded-xl border border-[#EDEFF6] bg-[#F4F6FC] p-3.5 transition-all hover:border-[#D5DAEC]"
        >
          <div className="flex items-center gap-2">
            <input
              value={r.name}
              onChange={(e) => {
                const next = criteria.map((x, j) =>
                  j === i ? { ...x, name: e.target.value } : x
                );
                onChange(next);
              }}
              placeholder={`Criterion ${i + 1} name`}
              className="min-w-0 flex-1 rounded-lg border border-[#D5DAEC] bg-white px-3 py-2 text-sm text-[#141834] placeholder:text-[#8B92B5] focus:border-[#3A4A9F] focus:outline-none"
            />
            <div className="flex shrink-0 items-center gap-1 rounded-lg border border-[#D5DAEC] bg-white px-2 py-1">
              <input
                type="number"
                min={1}
                max={10}
                value={r.maxMarks}
                onChange={(e) => {
                  const next = criteria.map((x, j) =>
                    j === i ? { ...x, maxMarks: Number(e.target.value) || 1 } : x
                  );
                  onChange(next);
                }}
                title="Max marks"
                className="w-8 text-center text-sm font-semibold text-[#141834] focus:outline-none"
              />
              <span className="text-xs text-[#565C82]">pts</span>
            </div>
            {criteria.length > minCriteria && (
              <button
                onClick={() => onChange(criteria.filter((_, j) => j !== i))}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#B23A1B] hover:bg-[#FBE9E3] transition-colors"
                title="Remove criterion"
                aria-label={`Remove criterion ${i + 1}`}
              >
                ✕
              </button>
            )}
          </div>
          <input
            value={r.description}
            onChange={(e) => {
              const next = criteria.map((x, j) =>
                j === i ? { ...x, description: e.target.value } : x
              );
              onChange(next);
            }}
            placeholder="What does full marks look like for this criterion?"
            className="mt-2 w-full rounded-lg border border-[#D5DAEC] bg-white px-3 py-2 text-sm text-[#1D2140] placeholder:text-[#8B92B5] focus:border-[#3A4A9F] focus:outline-none"
          />
        </div>
      ))}
      {criteria.length < maxCriteria && (
        <button
          onClick={() => onChange([...criteria, { name: "", description: "", maxMarks: 2 }])}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#D5DAEC] px-3.5 py-1.5 text-xs font-semibold text-[#3A4A9F] hover:border-[#3A4A9F] hover:bg-[#E9ECF9] transition-all"
        >
          <span>+ Add criterion</span>
          <span className="text-[10px] text-[#8B92B5]">({criteria.length}/{maxCriteria})</span>
        </button>
      )}
    </div>
  );
}
