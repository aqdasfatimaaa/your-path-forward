import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/AppHeader";
import { useAppState } from "@/lib/app-state";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Next Best Step · AI Life Navigator" },
      { name: "description", content: "The single next action to move you forward." },
    ],
  }),
  component: ProgressPage,
});

const TASKS = [
  { id: "t1", label: "Write a one-sentence goal statement", why: "Clarity now saves weeks of drift later." },
  { id: "t2", label: "List 3 people already doing this", why: "Real examples reveal the real path." },
  { id: "t3", label: "Audit your current strengths & gaps", why: "You can't plan around what you don't see." },
  { id: "t4", label: "Pick 1 core learning resource", why: "One source beats a scattered ten." },
  { id: "t5", label: "Schedule 3 weekly learning blocks", why: "Consistency compounds; intensity burns out." },
];

function ProgressPage() {
  const { state, update, hydrated } = useAppState();
  if (!hydrated) return null;

  const next = TASKS.find((t) => !state.completedTasks[t.id]);

  return (
    <PageShell>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your next step</h1>
      <p className="mt-2 text-sm text-muted-foreground">One thing at a time. That's the whole secret.</p>

      {next ? (
        <div className="mt-10 rounded-3xl border border-border/70 bg-card p-8">
          <div className="text-xs font-medium uppercase tracking-wider text-accent">Next up</div>
          <h2 className="mt-3 text-2xl font-semibold leading-snug">{next.label}</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">Why now:</span> {next.why}
          </p>
          <button
            onClick={() =>
              update({
                completedTasks: { ...state.completedTasks, [next.id]: true },
              })
            }
            className="mt-8 rounded-full bg-success px-7 py-3.5 text-sm font-semibold text-success-foreground hover:opacity-90"
          >
            Mark complete
          </button>
        </div>
      ) : (
        <div className="mt-10 rounded-3xl border border-border/70 bg-card p-8 text-center">
          <div className="text-2xl">🌿</div>
          <h2 className="mt-3 text-xl font-semibold">You're all caught up.</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Check your dashboard to open the next milestone.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
          >
            Go to dashboard
          </Link>
        </div>
      )}
    </PageShell>
  );
}