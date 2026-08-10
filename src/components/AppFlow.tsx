"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Analysis, AnalyzeRequest, Rubric, StudentResponse } from "@/lib/types";
import Results from "./Results";
import Recommendation from "./Recommendation";
import { SectionTitle } from "./ui";

const LOADING_STAGES = [
  "Reading the rubric…",
  "Classifying responses by the belief behind them…",
  "Clustering misconceptions…",
  "Building the learning-gap map…",
  "Drafting one intervention for your review…",
];

type Phase = "setup" | "loading" | "results";

export default function AppFlow() {
  const [question, setQuestion] = useState("");
  const [rubric, setRubric] = useState<Rubric[]>([
    { name: "", description: "", maxMarks: 2 },
    { name: "", description: "", maxMarks: 2 },
    { name: "", description: "", maxMarks: 2 },
  ]);
  const [tab, setTab] = useState<"paste" | "csv">("paste");
  const [pasteText, setPasteText] = useState("");
  const [csvRows, setCsvRows] = useState<StudentResponse[] | null>(null);
  const [csvName, setCsvName] = useState<string>("");

  const [phase, setPhase] = useState<Phase>("setup");
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [demoFlag, setDemoFlag] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDemoFlag(new URLSearchParams(window.location.search).get("demo") === "1");
    }
  }, []);

  // staged loading text
  useEffect(() => {
    if (phase !== "loading") return;
    setStage(0);
    const t = setInterval(() => setStage((s) => Math.min(s + 1, LOADING_STAGES.length - 1)), 2500);
    return () => clearInterval(t);
  }, [phase]);

  const responses: StudentResponse[] = useMemo(() => {
    if (tab === "csv" && csvRows) return csvRows;
    const parts = pasteText.includes("---")
      ? pasteText.split(/^\s*---\s*$/m)
      : pasteText.split(/\n/);
    return parts
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text, i) => ({ id: `R${String(i + 1).padStart(2, "0")}`, text }));
  }, [tab, pasteText, csvRows]);

  const loadDemo = useCallback(async () => {
    setError(null);
    const res = await fetch("/demo-data.json");
    const d = (await res.json()) as {
      question: string;
      rubric: Rubric[];
      responses: StudentResponse[];
    };
    setQuestion(d.question);
    setRubric(d.rubric);
    setTab("paste");
    setPasteText(d.responses.map((r) => r.text).join("\n"));
    setCsvRows(null);
    setCsvName("");
  }, []);

  function onCsv(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      const start = /^id\s*,/i.test(lines[0] ?? "") ? 1 : 0;
      const rows: StudentResponse[] = [];
      for (let i = start; i < lines.length; i++) {
        const line = lines[i];
        const comma = line.indexOf(",");
        if (comma === -1) continue;
        const id = line.slice(0, comma).trim() || `R${String(rows.length + 1).padStart(2, "0")}`;
        let resp = line.slice(comma + 1).trim();
        if (resp.startsWith('"') && resp.endsWith('"')) resp = resp.slice(1, -1).replace(/""/g, '"');
        if (resp) rows.push({ id, text: resp });
      }
      setCsvRows(rows);
      setCsvName(`${file.name} · ${rows.length} responses`);
    };
    reader.readAsText(file);
  }

  async function loadCached(reason: string | null) {
    const res = await fetch("/demo-results.json");
    const cached = (await res.json()) as Analysis;
    setAnalysis(cached);
    setNotice(reason);
    setPhase("results");
  }

  async function analyze() {
    setError(null);
    setNotice(null);
    if (!question.trim()) return setError("Please enter the question.");
    if (rubric.some((r) => !r.name.trim())) return setError("Every rubric criterion needs a name.");
    if (responses.length < 5)
      return setError(`Need at least 5 responses (currently ${responses.length}).`);

    setPhase("loading");

    if (demoFlag) {
      await loadCached(null);
      return;
    }

    const body: AnalyzeRequest = { question, rubric, responses };
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.fallbackAdvised) {
          await loadCached(
            "Live model unavailable — showing a cached analysis of the standard demo dataset."
          );
          return;
        }
        setError(data?.error ?? "Analysis failed.");
        setPhase("setup");
        return;
      }
      setAnalysis(data as Analysis);
      setPhase("results");
    } catch {
      await loadCached(
        "Live model unavailable — showing a cached analysis of the standard demo dataset."
      );
    }
  }

  function reset() {
    setPhase("setup");
    setAnalysis(null);
    setNotice(null);
  }

  /* ---------------- render ---------------- */

  if (phase === "loading") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#E9ECF9] border-t-[#26306A]" />
        <p className="mt-6 text-lg font-bold text-[#141834]">{LOADING_STAGES[stage]}</p>
        <p className="mt-2 text-sm text-[#565C82]">
          One batched model call, temperature 0. Aggregates are recomputed on the server.
        </p>
      </main>
    );
  }

  if (phase === "results" && analysis) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        {notice && (
          <div className="mb-6 rounded-xl border border-[#F5A623] bg-[#FDF3E1] px-4 py-3 text-sm font-medium text-[#8A5A00]">
            {notice}
          </div>
        )}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#B45309]">
              Analysis · source: {analysis.meta.source} · model: {analysis.meta.model}
            </p>
            <h1 className="text-2xl font-bold text-[#141834]">Diagnosis for: “{question.slice(0, 80)}{question.length > 80 ? "…" : ""}”</h1>
          </div>
          <button
            onClick={reset}
            className="rounded-xl border border-[#D5DAEC] bg-white px-4 py-2 text-sm font-semibold text-[#26306A] hover:bg-[#E9ECF9]"
          >
            ← New analysis
          </button>
        </div>
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <Results analysis={analysis} />
          <div className="lg:sticky lg:top-20 lg:self-start">
            <Recommendation analysis={analysis} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Hero */}
      <section className="mb-8 rounded-2xl bg-[#26306A] p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#F5A623]">
          Assess → Diagnose → Recommend → Intervene → Measure
        </p>
        <h1 className="mt-2 max-w-3xl text-2xl font-bold leading-snug md:text-3xl">
          Turn a pile of graded answers into one specific teaching decision.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#C3CAEC] md:text-base">
          Upload a question, its rubric, and student responses. The engine finds the misconception
          behind each answer, maps the class learning gap, and proposes one intervention — which you
          approve, modify, or reject. AI never grades on its own.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={loadDemo}
            className="rounded-xl bg-[#F5A623] px-5 py-2.5 text-sm font-bold text-[#141834] shadow hover:brightness-95"
          >
            ⚡ Load demo data (50 responses)
          </button>
          <a
            href="/how-to-use"
            className="rounded-xl border border-[#5B67A8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3A4A9F]"
          >
            How to use →
          </a>
        </div>
      </section>

      {error && (
        <div className="mb-6 rounded-xl border border-[#E4572E] bg-[#FBE9E3] px-4 py-3 text-sm font-medium text-[#B23A1B]">
          {error}
        </div>
      )}
      {demoFlag && (
        <div className="mb-6 rounded-xl border border-[#3A4A9F] bg-[#E9ECF9] px-4 py-3 text-sm font-medium text-[#26306A]">
          Demo mode is on (?demo=1): Analyze will use the cached analysis and skip the live model.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Question + rubric */}
        <section className="rounded-2xl border border-[#D5DAEC] bg-white p-5 shadow-sm">
          <SectionTitle kicker="Step 1 · Assess" title="Question &amp; marking rubric" />
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#565C82]">
            Exam question
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            placeholder="e.g. Explain price elasticity of demand. Illustrate with an example."
            className="w-full rounded-xl border border-[#D5DAEC] p-3 text-sm focus:border-[#3A4A9F] focus:outline-none"
          />
          <div className="mt-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[#565C82]">
              Rubric criteria ({rubric.length})
            </p>
            {rubric.map((r, i) => (
              <div key={i} className="rounded-xl border border-[#EDEFF6] bg-[#F4F6FC] p-3">
                <div className="flex gap-2">
                  <input
                    value={r.name}
                    onChange={(e) =>
                      setRubric(rubric.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
                    }
                    placeholder={`Criterion ${i + 1} name`}
                    className="w-full rounded-lg border border-[#D5DAEC] px-3 py-2 text-sm focus:border-[#3A4A9F] focus:outline-none"
                  />
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={r.maxMarks}
                    onChange={(e) =>
                      setRubric(
                        rubric.map((x, j) =>
                          j === i ? { ...x, maxMarks: Number(e.target.value) || 1 } : x
                        )
                      )
                    }
                    title="Max marks"
                    className="w-20 rounded-lg border border-[#D5DAEC] px-2 py-2 text-sm focus:border-[#3A4A9F] focus:outline-none"
                  />
                  {rubric.length > 2 && (
                    <button
                      onClick={() => setRubric(rubric.filter((_, j) => j !== i))}
                      className="rounded-lg px-2 text-[#B23A1B] hover:bg-[#FBE9E3]"
                      title="Remove criterion"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <input
                  value={r.description}
                  onChange={(e) =>
                    setRubric(
                      rubric.map((x, j) => (j === i ? { ...x, description: e.target.value } : x))
                    )
                  }
                  placeholder="What does full marks look like for this criterion?"
                  className="mt-2 w-full rounded-lg border border-[#D5DAEC] px-3 py-2 text-sm focus:border-[#3A4A9F] focus:outline-none"
                />
              </div>
            ))}
            {rubric.length < 5 && (
              <button
                onClick={() => setRubric([...rubric, { name: "", description: "", maxMarks: 2 }])}
                className="text-sm font-semibold text-[#3A4A9F] hover:underline"
              >
                + Add criterion
              </button>
            )}
          </div>
        </section>

        {/* Responses */}
        <section className="flex flex-col rounded-2xl border border-[#D5DAEC] bg-white p-5 shadow-sm">
          <SectionTitle kicker="Student work" title="Responses" />
          <div className="mb-3 flex gap-1 rounded-xl bg-[#EDEFF6] p-1 text-sm font-semibold">
            <button
              onClick={() => setTab("paste")}
              className={`flex-1 rounded-lg px-3 py-1.5 ${tab === "paste" ? "bg-white text-[#26306A] shadow" : "text-[#565C82]"}`}
            >
              Paste
            </button>
            <button
              onClick={() => setTab("csv")}
              className={`flex-1 rounded-lg px-3 py-1.5 ${tab === "csv" ? "bg-white text-[#26306A] shadow" : "text-[#565C82]"}`}
            >
              Upload CSV
            </button>
          </div>
          {tab === "paste" ? (
            <>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={12}
                placeholder={"One response per line, or separate longer answers with a line containing ---"}
                className="w-full flex-1 rounded-xl border border-[#D5DAEC] p-3 text-sm focus:border-[#3A4A9F] focus:outline-none"
              />
            </>
          ) : (
            <label className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#D5DAEC] bg-[#F4F6FC] p-8 text-center hover:border-[#3A4A9F]">
              <span className="text-3xl">📄</span>
              <span className="mt-2 text-sm font-semibold text-[#26306A]">
                {csvName || "Click to choose a CSV (columns: id,response)"}
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onCsv(e.target.files[0])}
              />
            </label>
          )}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-[#565C82]">
              {responses.length} response{responses.length === 1 ? "" : "s"} ready
              {responses.length > 0 && responses.length < 5 ? " (min 5)" : ""}
            </span>
            <button
              onClick={analyze}
              className="rounded-xl bg-[#26306A] px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-[#3A4A9F]"
            >
              Analyze →
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
