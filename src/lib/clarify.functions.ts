import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  category: z.string().min(1),
  categoryLabel: z.string().min(1),
  details: z.record(z.string(), z.string()),
  timePerWeek: z.string().optional(),
  timeframe: z.string().optional(),
});

const QuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  type: z.enum(["text", "choice"]),
  options: z.array(z.string()).nullable(),
});

export type ClarifyingQuestion = z.infer<typeof QuestionSchema>;

const SYSTEM_TEMPLATE = `You are an intake specialist for a life/goal planning tool. The user has already told you their goal category is exactly: {category}. Generate 2-4 short, highly specific follow-up questions appropriate ONLY to this category. Follow these category rules strictly and do not blend them:
- If category is "Career Change or New Skill": ask about specific transferable experience, target seniority/entry level, and the biggest perceived obstacle (e.g. lack of a portfolio, no formal credential).
- If category is "Study Abroad": ask about target country/countries (or openness to multiple), budget range or funding plan, language proficiency/test status (e.g. IELTS/TOEFL), and degree level.
- If category is "Job Search": ask about target industry/role, work authorization/location constraints, and current resume/portfolio readiness.
- If category is "Start a Business": ask about available starting capital, whether they plan to work solo or find co-founders, and whether they have an existing customer/audience.
- If category is "Something Else": infer 2-4 sensible clarifying questions from their free-text goal description, but keep them concrete and specific to what they actually wrote, not generic.

For each question, specify whether it's best answered as short free text or as 3-5 multiple-choice options (list them if choice type). Respond ONLY in valid JSON with this shape:
{
  "questions": [
    { "id": "q1", "question": "...", "type": "text", "options": null },
    { "id": "q2", "question": "...", "type": "choice", "options": ["...", "...", "..."] }
  ]
}`;

export const generateClarifyingQuestions = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("Missing GROQ_API_KEY");

    const system = SYSTEM_TEMPLATE.replace("{category}", data.categoryLabel);
    const userContext = {
      category: data.categoryLabel,
      answers: data.details,
      availableTimePerWeek: data.timePerWeek ?? null,
      timeframe: data.timeframe ?? null,
    };

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: `Here is the user's context so far:\n${JSON.stringify(userContext, null, 2)}\n\nGenerate the clarifying questions now.`,
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

    const shape = z.object({ questions: z.array(QuestionSchema).min(1).max(6) }).parse(parsed);
    return shape;
  });