import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/AppHeader";
import { useAppState } from "@/lib/app-state";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your Roadmap · AI Life Navigator" },
      { name: "description", content: "Your personalized roadmap of milestones and tasks." },
    ],
  }),
  component: DashboardPage,
});

const MILESTONES = [
  {
    id: "m1",
    title: "Clarify direction & baseline",
    tasks: [
      { id: "t1", label: "Write a one-sentence goal statement" },
      { id: "t2", label: "List 3 people already doing this" },
      { id: "t3", label: "Audit your current strengths & gaps" },
    ],
  },
  {
    id: "m2",
    title: "Build foundational knowledge",
    tasks: [
      { id: "t4", label: "Pick 1 core learning resource" },
      { id: "t5", label: "Schedule 3 weekly learning blocks" },
      { id: "t6", label: "Complete the first module" },
    ],
  },
  {
    id: "m3",
    title: "Apply through a small real project",
    tasks: [
      { id: "t7", label: "Define a mini project scope" },
      { id: "t8", label: "Ship a first version publicly" },
    ],
  },
  {
    id: "m4",
    title: "Network & get feedback",
    tasks: [
      { id: "t9", label: "Reach out to 3 practitioners" },
      { id: "t10", label: "Collect feedback on your project" },
    ],
  },
  {
    id: "m5",
    title: "Make the move",
    tasks: [
      { id: "t11", label: "Update your profiles & materials" },
      { id: "t12", label: "Take the first concrete external action" },
    ],
  },
];

const GAPS = [
  { label: "A finished portfolio piece", why: "Concrete proof of work matters more than credentials." },
  { label: "Consistent weekly time block", why: "Compounding beats intensity for long goals." },
  { label: "One person already inside", why: "Direct guidance shortens the path meaningfully." },
];

function DashboardPage() {
  const { state, update } = useAppState();
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>("m1");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  const allTasks = useMemo(() => MILESTONES.flatMap((m) => m.tasks), []);
  const done = allTasks.filter((t) => state.completedTasks[t.id]).length;
  const pct = Math.round((done / allTasks.length) * 100);

  const toggle = (id: string) =>
    update({
      completedTasks: {
        ...state.completedTasks,
        [id]: !state.completedTasks[id],
      },
    });

  if (loading) {
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
          onClick={() => setLoading(true) || setTimeout(() => setLoading(false), 700)}
          className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-foreground/30"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-success transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ol className="mt-10 space-y-3">
        {MILESTONES.map((m, i) => {
          const isOpen = open === m.id;
          const mDone = m.tasks.filter((t) => state.completedTasks[t.id]).length;
          const allDone = mDone === m.tasks.length;
          return (
            <li key={m.id} className="rounded-2xl border border-border/70 bg-card">
              <button
                onClick={() => setOpen(isOpen ? null : m.id)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left"
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                    allDone
                      ? "bg-success text-success-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{m.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {mDone}/{m.tasks.length} tasks
                  </span>
                </span>
                <span className="text-muted-foreground">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <ul className="border-t border-border/70 px-5 py-4">
                  {m.tasks.map((t) => {
                    const checked = !!state.completedTasks[t.id];
                    return (
                      <li key={t.id}>
                        <label className="flex cursor-pointer items-start gap-3 py-2 text-sm">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(t.id)}
                            className="mt-0.5 h-4 w-4 accent-[color:var(--success)]"
                          />
                          <span className={checked ? "text-muted-foreground line-through" : ""}>
                            {t.label}
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

      <section className="mt-12">
        <h2 className="text-lg font-semibold tracking-tight">Gaps to Close</h2>
        <ul className="mt-4 space-y-3">
          {GAPS.map((g) => (
            <li key={g.label} className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="font-medium">{g.label}</div>
              <p className="mt-1 text-sm text-muted-foreground">{g.why}</p>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}