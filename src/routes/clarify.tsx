import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES, useAppState } from "@/lib/app-state";
import { generateClarifyingQuestions } from "@/lib/clarify.functions";

export const Route = createFileRoute("/clarify")({
  head: () => ({
    meta: [
      { title: "A few clarifying questions · AI Life Navigator" },
      { name: "description", content: "Quick clarifications to sharpen your roadmap." },
    ],
  }),
  component: ClarifyPage,
});

function ClarifyPage() {
  const { state, update, hydrated } = useAppState();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetched = useRef(false);

  const categoryLabel =
    CATEGORIES.find((c) => c.id === state.category)?.label ?? "";

  useEffect(() => {
    if (!hydrated || fetched.current) return;
    if (!state.category) return;
    fetched.current = true;
    setLoading(true);
    setError(null);
    generateClarifyingQuestions({
      data: {
        category: state.category,
        categoryLabel,
        details: state.details,
        timePerWeek: state.timePerWeek,
        timeframe: state.timeframe,
      },
    })
      .then((res) => {
        update({ clarifyQuestions: res.questions, clarifyAnswers: {} });
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  if (!hydrated) return null;

  if (!state.category) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="text-muted-foreground">Pick a goal category first.</p>
        <Link to="/category" className="mt-4 inline-block text-accent underline">
          Go back
        </Link>
      </div>
    );
  }

  if (loading) {
    return <Loading label="Understanding your goal…" />;
  }

  const questions = state.clarifyQuestions;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-14">
        <h1 className="text-3xl font-semibold tracking-tight">A few clarifying questions</h1>
        <p className="mt-2 text-muted-foreground">Helps us tune the roadmap to you.</p>

        {error && (
          <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <div className="font-medium">Couldn't generate questions</div>
            <div className="mt-1 opacity-80">{error}</div>
            <button
              onClick={() => {
                fetched.current = false;
                setError(null);
                // trigger effect
                update({});
              }}
              className="mt-3 rounded-full border border-destructive/40 px-4 py-1.5 text-xs font-medium hover:bg-destructive/10"
            >
              Try again
            </button>
          </div>
        )}

        {!error && questions.length > 0 && (
          <>
            <div className="mt-10 space-y-8">
              {questions.map((q) => (
                <div key={q.id}>
                  <label className="block text-sm font-medium">{q.question}</label>
                  {q.type === "text" || !q.options ? (
                    <input
                      value={state.clarifyAnswers[q.id] ?? ""}
                      placeholder="Type your answer…"
                      onChange={(e) =>
                        update({
                          clarifyAnswers: {
                            ...state.clarifyAnswers,
                            [q.id]: e.target.value,
                          },
                        })
                      }
                      className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent"
                    />
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {q.options.map((opt) => {
                        const active = state.clarifyAnswers[q.id] === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() =>
                              update({
                                clarifyAnswers: {
                                  ...state.clarifyAnswers,
                                  [q.id]: opt,
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
              onClick={() => {
                update({ roadmap: undefined, whatIfPaths: undefined, completedTasks: {} });
                navigate({ to: "/dashboard" });
              }}
              className="mt-10 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90"
            >
              Generate my roadmap
            </button>
          </>
        )}
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