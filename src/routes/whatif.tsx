import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { PageShell } from "@/components/AppHeader";
import { CATEGORIES, useAppState } from "@/lib/app-state";
import { generateWhatIf } from "@/lib/whatif.functions";

export const Route = createFileRoute("/whatif")({
  head: () => ({
    meta: [
      { title: "What-If Scenarios · AI Life Navigator" },
      { name: "description", content: "Compare alternate paths toward the same goal." },
    ],
  }),
  component: WhatIfPage,
});

function WhatIfPage() {
  const { state, update, hydrated } = useAppState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetching = useRef(false);

  const categoryLabel =
    CATEGORIES.find((c) => c.id === state.category)?.label ?? "";

  const run = () => {
    if (!state.category || fetching.current) return;
    fetching.current = true;
    setLoading(true);
    setError(null);
    generateWhatIf({
      data: {
        categoryLabel,
        details: state.details,
        clarifyAnswers: state.clarifyAnswers,
        clarifyQuestions: state.clarifyQuestions.map((q) => ({ id: q.id, question: q.question })),
      },
    })
      .then((res) => update({ whatIfPaths: res.paths }))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Something went wrong."))
      .finally(() => {
        fetching.current = false;
        setLoading(false);
      });
  };

  if (!hydrated) return null;

  if (!state.category) {
    return (
      <PageShell>
        <p className="text-muted-foreground">Pick a goal category first.</p>
        <Link to="/category" className="mt-4 inline-block text-accent underline">Go to category</Link>
      </PageShell>
    );
  }

  const paths = state.whatIfPaths;

  return (
    <PageShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">What-If Scenarios</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Explore alternate paths toward the same outcome.
          </p>
        </div>
        {paths && (
          <button
            onClick={run}
            disabled={loading}
            className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-foreground/30 disabled:opacity-50"
          >
            {loading ? "Regenerating…" : "Regenerate"}
          </button>
        )}
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <div className="font-medium">Couldn't generate comparison</div>
          <div className="mt-1 opacity-80">{error}</div>
          <button
            onClick={run}
            className="mt-3 rounded-full border border-destructive/40 px-4 py-1.5 text-xs font-medium hover:bg-destructive/10"
          >
            Try again
          </button>
        </div>
      )}

      {!paths && !loading && !error && (
        <button
          onClick={run}
          className="mt-8 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
        >
          Generate comparison
        </button>
      )}

      {loading && !paths && (
        <div className="mt-16 grid place-items-center text-center">
          <div>
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent" />
            <p className="mt-6 text-sm text-muted-foreground">Comparing paths…</p>
          </div>
        </div>
      )}

      {paths && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map((p, i) => (
            <div key={i} className="flex flex-col rounded-2xl border border-border/70 bg-card p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium text-muted-foreground">{p.timeframe}</div>
                <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                  {p.difficulty}
                </span>
              </div>
              <h3 className="mt-1 text-lg font-semibold">{p.name}</h3>
              <div className="mt-4">
                <div className="text-xs font-medium uppercase tracking-wider text-success">Pros</div>
                <ul className="mt-2 space-y-1 text-sm">
                  {p.pros.map((x, xi) => <li key={xi}>• {x}</li>)}
                </ul>
              </div>
              <div className="mt-4">
                <div className="text-xs font-medium uppercase tracking-wider text-accent">Trade-offs</div>
                <ul className="mt-2 space-y-1 text-sm">
                  {p.tradeoffs.map((x, xi) => <li key={xi}>• {x}</li>)}
                </ul>
              </div>
              <div className="mt-5 rounded-xl bg-secondary/60 p-3 text-sm">
                <span className="font-medium">Best for: </span>
                <span className="text-muted-foreground">{p.bestFor}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}