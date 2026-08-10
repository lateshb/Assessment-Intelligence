import { NextRequest, NextResponse } from "next/server";
import { buildPrompt } from "@/lib/prompt";
import { aggregate } from "@/lib/aggregate";
import { API_TIMEOUT_MS, DISCLAIMER, MODEL_ID } from "@/lib/constants";
import type { AnalyzeRequest } from "@/lib/types";

export const maxDuration = 60;

/**
 * POST /api/analyze
 * One batched LLM call, temperature 0, JSON output. The ONLY place the
 * vendor API is touched; swap MODEL_ID / this fetch to change providers.
 * All aggregate math happens in lib/aggregate.ts, never in the model.
 */
export async function POST(req: NextRequest) {
  let body: AnalyzeRequest;
  try {
    body = (await req.json()) as AnalyzeRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { question, rubric, responses } = body ?? {};
  if (
    !question?.trim() ||
    !Array.isArray(rubric) ||
    rubric.length < 2 ||
    !Array.isArray(responses) ||
    responses.length < 5
  ) {
    return NextResponse.json(
      { error: "Need a question, at least 2 rubric criteria, and at least 5 responses." },
      { status: 400 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server.", fallbackAdvised: true },
      { status: 503 }
    );
  }

  const prompt = buildPrompt(
    question,
    rubric,
    responses.map((r) => ({ id: r.id, text: r.text }))
  );

  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
          },
        }),
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Model call failed (${res.status}).`, detail: detail.slice(0, 300), fallbackAdvised: true },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

    // Defensive parse: strip accidental code fences, then JSON.parse.
    const cleaned = text.replace(/^```(?:json)?/m, "").replace(/```\s*$/m, "").trim();
    let raw: unknown;
    try {
      raw = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Model returned unparseable output.", fallbackAdvised: true },
        { status: 502 }
      );
    }

    const analysis = aggregate(
      raw,
      rubric,
      responses.map((r) => r.id),
      { model: MODEL_ID, latencyMs: Date.now() - started, source: "live" },
      DISCLAIMER
    );
    return NextResponse.json(analysis);
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return NextResponse.json(
      {
        error: aborted ? "Model call timed out." : "Model call errored.",
        fallbackAdvised: true,
      },
      { status: 504 }
    );
  } finally {
    clearTimeout(timer);
  }
}
