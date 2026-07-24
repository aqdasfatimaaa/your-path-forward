import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  categoryLabel: z.string().min(1),
  details: z.record(z.string(), z.string()),
  clarifyAnswers: z.record(z.string(), z.string()).optional(),
  clarifyQuestions: z
    .array(z.object({ id: z.string(), question: z.string() }))
    .optional(),
  timePerWeek: z.string().optional(),
  timeframe: z.string().optional(),
  update: z.string().optional(),
  existingRoadmap: z
    .object({
      note: z.string().default(""),
      milestones: z.array(
        z.object({
          title: z.string(),
          tasks: z.array(z.object({ task: z.string(), done: z.boolean().default(false) })),
        })
      ),
      gaps: z.array(z.object({ item: z.string(), why: z.string() })).default([]),
    })
    .optional(),
});

const TaskSchema = z.object({ task: z.string(), done: z.boolean().default(false) });
const MilestoneSchema = z.object({
  title: z.string(),
  tasks: z.array(TaskSchema).min(1),
});
const GapSchema = z.object({ item: z.string(), why: z.string() });

const RoadmapSchema = z.object({
  note: z.string().default(""),
  milestones: z.array(MilestoneSchema).min(1),
  gaps: z.array(GapSchema).default([]),
});

export type Roadmap = z.infer<typeof RoadmapSchema>;

const SYSTEM_TEMPLATE = `You are an expert strategist for the goal category: {category}. Given the user's full context (their category-specific details, clarifying question answers, available weekly time, and timeframe), generate a realistic, personalized roadmap specific to this category's real-world process (e.g. a Study Abroad roadmap should reflect actual stages like research/shortlisting, standardized tests, applications, funding, visa — a Business roadmap should reflect validation, initial setup, first customers, growth — do not use generic "learn a skill" language unless the category is genuinely skill-based).
Break the roadmap into 4-8 milestones in chronological order. For each milestone, list 2-5 specific, actionable tasks. Identify concrete gaps between where the person is now and their goal — these could be skills, documents, savings, test scores, connections, or anything relevant to THIS category — and briefly explain why each gap matters. Be realistic about the given timeframe and weekly time — if unrealistic, say so honestly in a "note" field. Keep tone encouraging and clear, never vague.
Respond ONLY in valid JSON with this shape:
{
  "note": "...",
  "milestones": [
    { "title": "...", "tasks": [ { "task": "...", "done": false } ] }
  ],
  "gaps": [ { "item": "...", "why": "..." } ]
}`;

export const generateRoadmap = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("Missing GROQ_API_KEY");

    const system = SYSTEM_TEMPLATE.replace("{category}", data.categoryLabel);
    const systemWithUpdate = data.update
      ? `${system}\n\nThe user's circumstances have changed as follows: ${data.update}. Adjust the existing roadmap to reflect this, keeping completed tasks marked done where still applicable, and note what changed and why.`
      : system;

    const clarify = (data.clarifyQuestions ?? []).map((q) => ({
      question: q.question,
      answer: data.clarifyAnswers?.[q.id] ?? "",
    }));

    const userContext = {
      category: data.categoryLabel,
      details: data.details,
      clarifyingAnswers: clarify,
      availableTimePerWeek: data.timePerWeek ?? null,
      timeframe: data.timeframe ?? null,
      existingRoadmap: data.existingRoadmap ?? null,
      circumstanceUpdate: data.update ?? null,
    };

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemWithUpdate },
          {
            role: "user",
            content: `User context:\n${JSON.stringify(userContext, null, 2)}\n\nGenerate the roadmap now.`,
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
    return RoadmapSchema.parse(parsed);
  });