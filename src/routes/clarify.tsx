import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAppState } from "@/lib/app-state";

export const Route = createFileRoute("/clarify")({
  head: () => ({
    meta: [
      { title: "A few clarifying questions · AI Life Navigator" },
      { name: "description", content: "Quick clarifications to sharpen your roadmap." },
    ],
  }),
  component: ClarifyPage,
});

type Q =
  | { key: string; label: string; type: "text"; placeholder?: string }
  | { key: string; label: string; type: "choice"; options: string[] };

const QUESTIONS: Q[] = [
  {
    key: "motivation",
    label: "What's driving this goal right now?",
    type: "choice",
    options: ["Career growth", "More freedom", "New challenge", "Financial security"],
  },
  {
    key: "risk",
    label: "How comfortable are you with uncertainty?",
    type: "choice",
    options: ["Prefer certainty", "Somewhere in between", "Embrace the unknown"],
  },
  {
    key: "obstacle",
    label: "What's the biggest obstacle you anticipate?",
    type: "text",
    placeholder: "In a sentence or two…",
  },
];

function ClarifyPage() {
  const { state, update } = useAppState();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return <Loading label="Understanding your goal…" />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-14">
        <h1 className="text-3xl font-semibold tracking-tight">A few clarifying questions</h1>
        <p className="mt-2 text-muted-foreground">Helps us tune the roadmap to you.</p>

        <div className="mt-10 space-y-8">
          {QUESTIONS.map((q) => (
            <div key={q.key}>
              <label className="block text-sm font-medium">{q.label}</label>
              {q.type === "text" ? (
                <input
                  value={state.clarifyAnswers[q.key] ?? ""}
                  placeholder={q.placeholder}
                  onChange={(e) =>
                    update({
                      clarifyAnswers: { ...state.clarifyAnswers, [q.key]: e.target.value },
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent"
                />
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {q.options.map((opt) => {
                    const active = state.clarifyAnswers[q.key] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() =>
                          update({
                            clarifyAnswers: {
                              ...state.clarifyAnswers,
                              [q.key]: opt,
                            },
                          })
                        }
                        className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                          active
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border bg-card hover:border-foreground/30"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate({ to: "/dashboard" })}
          className="mt-10 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90"
        >
          Generate my roadmap
        </button>
      </div>
    </div>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
      <div>
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent" />
        <p className="mt-6 text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}