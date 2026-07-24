import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageShell } from "@/components/AppHeader";
import { CATEGORIES, useAppState } from "@/lib/app-state";
import { generateRoadmap } from "@/lib/roadmap.functions";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your Roadmap · AI Life Navigator" },
      { name: "description", content: "Your personalized roadmap of milestones and tasks." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { state, update, hydrated } = useAppState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(0);
  const fetching = useRef(false);

  const categoryLabel =
    CATEGORIES.find((c) => c.id === state.category)?.label ?? "";

  const roadmap = state.roadmap;
  const allTasks = useMemo(() => {
    if (!roadmap) return [] as string[];
    return roadmap.milestones.flatMap((m, mi) =>
      m.tasks.map((_, ti) => `${mi}-${ti}`)
    );
  }, [roadmap]);

  const run = () => {
    if (!state.category || fetching.current) return;
    fetching.current = true;
    setLoading(true);
    setError(null);
    generateRoadmap({
      data: {
        categoryLabel,
        details: state.details,
        clarifyAnswers: state.clarifyAnswers,
        clarifyQuestions: state.clarifyQuestions.map((q) => ({ id: q.id, question: q.question })),
        timePerWeek: state.timePerWeek,
        timeframe: state.timeframe,
      },
    })
      .then((res) => {
        update({ roadmap: res, completedTasks: {} });
        setOpen(0);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Something went wrong."))
      .finally(() => {
        fetching.current = false;
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!hydrated || !state.category) return;
    if (!state.roadmap && !fetching.current) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  if (!hydrated) return null;

  if (!state.category) {
    return (
      <PageShell>
        <p className="text-muted-foreground">Pick a goal category first.</p>
        <Link to="/category" className="mt-4 inline-block text-accent underline">
          Go to category
        </Link>
      </PageShell>
    );
  }
  const done = allTasks.filter((id) => state.completedTasks[id]).length;
  const pct = allTasks.length ? Math.round((done / allTasks.length) * 100) : 0;

  const toggle = (id: string) =>
    update({
      completedTasks: { ...state.completedTasks, [id]: !state.completedTasks[id] },
    });

  if (loading && !roadmap) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
        <div>
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent" />
          <p className="mt-6 text-sm text-muted-foreground">Building your roadmap…</p>
        </div>
      </div>
    );
  }

  return (
    <PageShell>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your Roadmap</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {done} of {allTasks.length} tasks complete
          </p>
        </div>
        <button
          onClick={() => {
            update({ roadmap: undefined, completedTasks: {} });
            run();
          }}
          disabled={loading}
          className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-foreground/30 disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Regenerate"}
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <div className="font-medium">Couldn't generate your roadmap</div>
          <div className="mt-1 opacity-80">{error}</div>
          <button
            onClick={run}
            className="mt-3 rounded-full border border-destructive/40 px-4 py-1.5 text-xs font-medium hover:bg-destructive/10"
          >
            Try again
          </button>
        </div>
      )}

      {roadmap && (
        <>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-success transition-all" style={{ width: `${pct}%` }} />
          </div>

          {roadmap.note && (
            <p className="mt-6 rounded-2xl border border-border/70 bg-card p-4 text-sm text-muted-foreground">
              {roadmap.note}
            </p>
          )}

          <ol className="mt-8 space-y-3">
            {roadmap.milestones.map((m, i) => {
              const isOpen = open === i;
              const mDone = m.tasks.filter((_, ti) => state.completedTasks[`${i}-${ti}`]).length;
              const allDone = mDone === m.tasks.length;
              return (
                <li key={i} className="rounded-2xl border border-border/70 bg-card">
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left"
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                        allDone ? "bg-success text-success-foreground" : "bg-secondary text-foreground"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{m.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {mDone}/{m.tasks.length} tasks
                      </span>
                    </span>
                    <span className="text-muted-foreground">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <ul className="border-t border-border/70 px-5 py-4">
                      {m.tasks.map((t, ti) => {
                        const id = `${i}-${ti}`;
                        const checked = !!state.completedTasks[id];
                        return (
                          <li key={ti}>
                            <label className="flex cursor-pointer items-start gap-3 py-2 text-sm">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggle(id)}
                                className="mt-0.5 h-4 w-4 accent-[color:var(--success)]"
                              />
                              <span className={checked ? "text-muted-foreground line-through" : ""}>
                                {t.task}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>

          {roadmap.gaps.length > 0 && (
            <section className="mt-12">
              <h2 className="text-lg font-semibold tracking-tight">Gaps to Close</h2>
              <ul className="mt-4 space-y-3">
                {roadmap.gaps.map((g, gi) => (
                  <li key={gi} className="rounded-2xl border border-border/70 bg-card p-4">
                    <div className="font-medium">{g.item}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{g.why}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </PageShell>
  );
}