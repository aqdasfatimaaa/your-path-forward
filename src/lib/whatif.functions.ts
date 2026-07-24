import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  categoryLabel: z.string().min(1),
  details: z.record(z.string(), z.string()),
  clarifyAnswers: z.record(z.string(), z.string()).optional(),
  clarifyQuestions: z
    .array(z.object({ id: z.string(), question: z.string() }))
    .optional(),
});

const PathSchema = z.object({
  name: z.string(),
  timeframe: z.string(),
  difficulty: z.string(),
  pros: z.array(z.string()).min(1),
  tradeoffs: z.array(z.string()).min(1),
  bestFor: z.string(),
});

const OutputSchema = z.object({ paths: z.array(PathSchema).min(2).max(3) });
export type WhatIfPath = z.infer<typeof PathSchema>;

const SYSTEM_TEMPLATE = `You are a strategist comparing realistic alternate paths toward a goal in the category: {category}. Generate 2-3 distinct, realistic paths that reflect genuine real-world options for THIS category specifically (e.g. Study Abroad: direct application vs. education agent vs. scholarship route; Business: bootstrapped vs. seeking investment vs. side business first; Career Change: self-taught vs. bootcamp/course vs. formal degree; Job Search: broad applications vs. networking-focused vs. targeted niche applications). For each path give: name, estimated timeframe, difficulty (Easy/Moderate/Hard), 2-3 pros, 2-3 tradeoffs/risks, and a one-line "best for" recommendation. Be honest — no path is risk-free.
Respond ONLY in valid JSON:
{
  "paths": [
    { "name": "...", "timeframe": "...", "difficulty": "...",
      "pros": ["..."], "tradeoffs": ["..."], "bestFor": "..." }
  ]
}`;

export const generateWhatIf = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("Missing GROQ_API_KEY");

    const system = SYSTEM_TEMPLATE.replace("{category}", data.categoryLabel);
    const clarify = (data.clarifyQuestions ?? []).map((q) => ({
      question: q.question,
      answer: data.clarifyAnswers?.[q.id] ?? "",
    }));
    const userContext = {
      category: data.categoryLabel,
      details: data.details,
      clarifyingAnswers: clarify,
    };

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.6,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: `User context:\n${JSON.stringify(userContext, null, 2)}\n\nGenerate the alternate paths now.`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Groq request failed (${res.status}): ${body.slice(0, 300)}`);
    }

    const payload = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = payload.choices?.[0]?.message?.content ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("Model returned invalid JSON");
    }
    return OutputSchema.parse(parsed);
  });