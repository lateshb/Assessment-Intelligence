"use client";

import { useEffect, useState } from "react";
import type { Analysis, Decision } from "@/lib/types";
import { AIBadge, SectionTitle } from "./ui";
import { saveTeacherDecision } from "@/lib/teacher-decisions-db";
import { createClient } from "@/lib/supabase/client";

const LOG_KEY = "ai-decision-log-v1";
const REJECT_REASONS = ["Not the real gap", "No class time", "Will handle differently", "Other"];

export default function Recommendation({ analysis }: { analysis: Analysis }) {
  const rec = analysis.recommendation;
  const total = analysis.perResponse.length;

  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [state, setState] = useState<"idle" | "modifying" | "rejecting" | "done">("idle");
  const [modText, setModText] = useState("");
  const [outcome, setOutcome] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOG_KEY);
      if (raw) setDecisions(JSON.parse(raw) as Decision[]);
    } catch {
      /* ignore */
    }
  }, []);

  function log(action: Decision["action"], summary: string, reason?: string) {
    const d: Decision = { at: new Date().toLocaleTimeString(), action, summary, reason };
    const next = [d, ...decisions].slice(0, 25);
    setDecisions(next);
    try {
      localStorage.setItem(LOG_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  async function persistDecisionToDb(
    action: 'approve' | 'modify' | 'reject',
    summary: string,
    reason?: string,
    modifiedText?: string
  ) {
    if (!analysis.id) {
      console.warn('Analysis has no ID, skipping DB persistence');
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('No authenticated user, skipping DB persistence');
        return;
      }

      await saveTeacherDecision(
        analysis.id,
        user.id,
        action,
        summary,
        reason,
        modifiedText
      );
    } catch (error) {
      console.error('Failed to persist decision:', error);
    } finally {
      setSaving(false);
    }
  }

  const impact = `Targeted ${rec.targetIds.length} of ${total} students instead of reteaching all ${total}.`;

  function approve() {
    const summary = `${rec.type} · ${rec.durationMin} min · ${rec.targetIds.length} students`;
    log("approve", summary);
    persistDecisionToDb('approve', summary);
    setOutcome(`Intervention approved for ${rec.targetIds.length} students · ${impact}`);
    setState("done");
  }
  function saveModify() {
    const summary = modText.trim() || rec.type;
    log("modify", summary);
    persistDecisionToDb('modify', summary, 'Teacher edited the recommendation before accepting', modText.trim());
    setOutcome(`Modified intervention saved and logged · ${impact}`);
    setState("done");
  }
  function reject(reason: string) {
    log("reject", rec.type, reason);
    persistDecisionToDb('reject', rec.type, reason);
    setOutcome(`Recommendation rejected ("${reason}") and logged. Nothing was applied to students.`);
    setState("done");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border-2 border-[#26306A] bg-white p-5 shadow-md">
        <SectionTitle kicker="Step 3 · Recommend → Intervene" title="One decision, ready for you" />
        <AIBadge />

        <div className="mt-4 rounded-xl border border-[#D5DAEC] bg-[#F4F6FC] p-4">
          <p className="text-sm font-bold text-[#141834]">{rec.type}</p>
          <p className="mt-1 text-sm text-[#1D2140]">
            <span className="font-semibold">Duration:</span> {rec.durationMin} minutes ·{" "}
            <span className="font-semibold">For:</span> {rec.targetDescription} ({rec.targetIds.length} students)
          </p>
          <p className="mt-2 text-sm text-[#1D2140]">
            <span className="font-semibold">Rationale:</span> {rec.rationale}
          </p>
          <p className="mt-2 text-sm text-[#1D2140]">
            <span className="font-semibold">Follow-up:</span> {rec.followUp}
          </p>
        </div>

        {state === "idle" && (
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={approve}
              disabled={saving}
              className="rounded-xl bg-[#0F766E] px-5 py-2.5 text-sm font-bold text-white shadow hover:brightness-95 disabled:opacity-50"
            >
              ✓ Approve
            </button>
            <button
              onClick={() => {
                setModText(
                  `${rec.type} · ${rec.durationMin} min · ${rec.targetDescription}\nFollow-up: ${rec.followUp}`
                );
                setState("modifying");
              }}
              disabled={saving}
              className="rounded-xl bg-[#F5A623] px-5 py-2.5 text-sm font-bold text-[#141834] shadow hover:brightness-95 disabled:opacity-50"
            >
              ✎ Modify
            </button>
            <button
              onClick={() => setState("rejecting")}
              disabled={saving}
              className="rounded-xl border-2 border-[#B23A1B] px-5 py-2.5 text-sm font-bold text-[#B23A1B] hover:bg-[#FBE9E3] disabled:opacity-50"
            >
              ✕ Reject
            </button>
          </div>
        )}

        {state === "modifying" && (
          <div className="mt-4">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#565C82]">
              Edit the intervention, then save
            </label>
            <textarea
              value={modText}
              onChange={(e) => setModText(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-[#D5DAEC] p-3 text-sm focus:border-[#3A4A9F] focus:outline-none"
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={saveModify}
                disabled={saving}
                className="rounded-xl bg-[#0F766E] px-5 py-2 text-sm font-bold text-white shadow hover:brightness-95 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Modified'}
              </button>
              <button
                onClick={() => setState("idle")}
                disabled={saving}
                className="rounded-xl border border-[#D5DAEC] px-5 py-2 text-sm font-semibold text-[#565C82] hover:bg-[#EDEFF6] disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {state === "rejecting" && (
          <div className="mt-4">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#565C82]">
              Why are you rejecting this?
            </label>
            <div className="space-y-2">
              {REJECT_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => reject(r)}
                  disabled={saving}
                  className="block w-full rounded-lg border border-[#D5DAEC] px-4 py-2 text-left text-sm font-medium text-[#141834] hover:bg-[#EDEFF6] disabled:opacity-50"
                >
                  {r}
                </button>
              ))}
              <button
                onClick={() => setState("idle")}
                disabled={saving}
                className="w-full rounded-lg border border-[#D5DAEC] px-4 py-2 text-sm font-semibold text-[#565C82] hover:bg-[#EDEFF6] disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {state === "done" && outcome && (
          <div className="mt-4 rounded-xl border border-[#0F766E] bg-[#D1FAE5] px-4 py-3 text-sm font-medium text-[#065F46]">
            {outcome}
          </div>
        )}
      </section>

      {decisions.length > 0 && (
        <section className="rounded-2xl border border-[#D5DAEC] bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#565C82]">
            Decision log (last 25)
          </h3>
          <ul className="space-y-2">
            {decisions.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span
                  className={`mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase text-white ${
                    d.action === "approve"
                      ? "bg-[#0F766E]"
                      : d.action === "modify"
                        ? "bg-[#B45309]"
                        : "bg-[#B23A1B]"
                  }`}
                >
                  {d.action}
                </span>
                <span className="text-[#1D2140]">
                  {d.summary}
                  {d.reason ? ` — reason: ${d.reason}` : ""}
                  <span className="ml-2 text-xs text-[#565C82]">{d.at}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[#565C82]">
            Stored locally and in Supabase. In production this feedback
            signal retrains the classifier — see Build &amp; scale.
          </p>
        </section>
      )}
    </div>
  );
}
