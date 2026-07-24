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

function ProgressPage() {
  const { state, update, hydrated } = useAppState();
  if (!hydrated) return null;

  const roadmap = state.roadmap;

  if (!roadmap || roadmap.milestones.length === 0) {
    return (
      <PageShell>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your next step</h1>
        <p className="mt-2 text-sm text-muted-foreground">One thing at a time. That's the whole secret.</p>
        <div className="mt-10 rounded-3xl border border-border/70 bg-card p-8 text-center">
          <div className="text-2xl">🗺️</div>
          <h2 className="mt-3 text-lg font-semibold">No roadmap yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Generate your roadmap to see your next best step.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
          >
            Go to roadmap
          </Link>
        </div>
      </PageShell>
    );
  }

  // Deterministic: first incomplete task in milestone order.
  let next: { id: string; label: string; why: string; milestoneTitle: string; milestoneIndex: number } | null = null;
  let totalTasks = 0;
  let doneTasks = 0;
  for (let mi = 0; mi < roadmap.milestones.length; mi++) {
    const m = roadmap.milestones[mi];
    for (let ti = 0; ti < m.tasks.length; ti++) {
      totalTasks++;
      const id = `${mi}-${ti}`;
      if (state.completedTasks[id]) {
        doneTasks++;
      } else if (!next) {
        next = {
          id,
          label: m.tasks[ti].task,
          milestoneTitle: m.title,
          milestoneIndex: mi,
          why: `This is the next open task in milestone ${mi + 1}: "${m.title}". Finishing it in order keeps your roadmap moving without skipping foundations.`,
        };
      }
    }
  }

  return (
    <PageShell>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your next step</h1>
      <p className="mt-2 text-sm text-muted-foreground">One thing at a time. That's the whole secret.</p>

      {next ? (
        <div className="mt-10 rounded-3xl border border-border/70 bg-card p-8">
          <div className="text-xs font-medium uppercase tracking-wider text-accent">
            Next up · Milestone {next.milestoneIndex + 1}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{next.milestoneTitle}</div>
          <h2 className="mt-3 text-2xl font-semibold leading-snug">{next.label}</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">Why now:</span> {next.why}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {doneTasks} of {totalTasks} tasks complete
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
          <div className="text-2xl">🎉</div>
          <h2 className="mt-3 text-xl font-semibold">Every task complete — well done.</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You've worked through all {totalTasks} tasks across your roadmap. If your circumstances have shifted, refresh the roadmap to plan what's next.
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