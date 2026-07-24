import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const InputSchema = z.object({
  categoryLabel: z.string().min(1),
  details: z.record(z.string(), z.string()).optional(),
  clarifyAnswers: z.record(z.string(), z.string()).optional(),
  clarifyQuestions: z
    .array(z.object({ id: z.string(), question: z.string() }))
    .optional(),
  roadmap: z
    .object({
      note: z.string().optional(),
      milestones: z.array(
        z.object({
          title: z.string(),
          tasks: z.array(z.object({ task: z.string(), done: z.boolean() })),
        })
      ),
      gaps: z.array(z.object({ item: z.string(), why: z.string() })).optional(),
    })
    .optional(),
  messages: z.array(MessageSchema).min(1),
});

const SYSTEM_TEMPLATE = `You are the user's personal navigator for their goal in the category: {category}. You have full context of their specific details, clarifying answers, and their generated roadmap. Answer questions specifically in relation to their actual journey and category — reference their real milestones and details rather than generic advice. Keep answers concise and actionable. If a question is outside what their context can answer confidently, say so honestly rather than guessing.`;

export const askNavigator = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("Missing GROQ_API_KEY");

    const system = SYSTEM_TEMPLATE.replace("{category}", data.categoryLabel);
    const clarify = (data.clarifyQuestions ?? []).map((q) => ({
      question: q.question,
      answer: data.clarifyAnswers?.[q.id] ?? "",
    }));
    const context = {
      category: data.categoryLabel,
      details: data.details ?? {},
      clarifyingAnswers: clarify,
      roadmap: data.roadmap ?? null,
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
        messages: [
          { role: "system", content: system },
          {
            role: "system",
            content: `User context (for grounding all replies):\n${JSON.stringify(context, null, 2)}`,
          },
          ...data.messages,
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
    return { content };
  });