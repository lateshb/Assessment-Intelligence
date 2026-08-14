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
}: {
  criteria: Rubric[];
  onChange: (criteria: Rubric[]) => void;
  maxCriteria?: number;
  minCriteria?: number;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wide text-[#565C82]">
        Rubric criteria ({criteria.length})
      </p>
      {criteria.map((r, i) => (
        <div key={i} className="rounded-xl border border-[#EDEFF6] bg-[#F4F6FC] p-3">
          <div className="flex gap-2">
            <input
              value={r.name}
              onChange={(e) => {
                const next = criteria.map((x, j) =>
                  j === i ? { ...x, name: e.target.value } : x
                );
                onChange(next);
              }}
              placeholder={`Criterion ${i + 1} name`}
              className="w-full rounded-lg border border-[#D5DAEC] px-3 py-2 text-sm focus:border-[#3A4A9F] focus:outline-none"
            />
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
              className="w-20 rounded-lg border border-[#D5DAEC] px-2 py-2 text-sm focus:border-[#3A4A9F] focus:outline-none"
            />
            {criteria.length > minCriteria && (
              <button
                onClick={() => onChange(criteria.filter((_, j) => j !== i))}
                className="rounded-lg px-2 text-[#B23A1B] hover:bg-[#FBE9E3]"
                title="Remove criterion"
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
            className="mt-2 w-full rounded-lg border border-[#D5DAEC] px-3 py-2 text-sm focus:border-[#3A4A9F] focus:outline-none"
          />
        </div>
      ))}
      {criteria.length < maxCriteria && (
        <button
          onClick={() => onChange([...criteria, { name: "", description: "", maxMarks: 2 }])}
          className="text-sm font-semibold text-[#3A4A9F] hover:underline"
        >
          + Add criterion
        </button>
      )}
    </div>
  );
}
