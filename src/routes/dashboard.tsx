import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageShell } from "@/components/AppHeader";
import { CATEGORIES, useAppState } from "@/lib/app-state";
import { generateRoadmap } from "@/lib/roadmap.functions";
import jsPDF from "jspdf";

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
  const [refreshOpen, setRefreshOpen] = useState(false);
  const [refreshText, setRefreshText] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const run = (updateText?: string) => {
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
        update: updateText,
        existingRoadmap: updateText ? state.roadmap : undefined,
      },
    })
      .then((res) => {
        if (updateText) {
          // Preserve completed tasks whose text still exists in the new roadmap
          const preserved: Record<string, boolean> = {};
          res.milestones.forEach((m, mi) =>
            m.tasks.forEach((t, ti) => {
              const wasDone =
                t.done ||
                state.roadmap?.milestones.some((om) =>
                  om.tasks.some(
                    (ot, oti) =>
                      ot.task === t.task &&
                      state.completedTasks[`${state.roadmap!.milestones.indexOf(om)}-${oti}`]
                  )
                );
              if (wasDone) preserved[`${mi}-${ti}`] = true;
            })
          );
          update({ roadmap: res, completedTasks: preserved });
        } else {
          update({ roadmap: res, completedTasks: {} });
        }
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

  const buildSummary = () => {
    if (!roadmap) return "";
    const lines: string[] = [];
    lines.push(`AI Life Navigator — Roadmap`);
    lines.push(`Category: ${categoryLabel}`);
    if (state.timeframe) lines.push(`Timeframe: ${state.timeframe}`);
    if (state.timePerWeek) lines.push(`Time/week: ${state.timePerWeek}`);
    lines.push(`Progress: ${done}/${allTasks.length} tasks (${pct}%)`);
    lines.push("");
    if (roadmap.note) {
      lines.push(`Note: ${roadmap.note}`);
      lines.push("");
    }
    lines.push(`MILESTONES`);
    roadmap.milestones.forEach((m, i) => {
      lines.push(`\n${i + 1}. ${m.title}`);
      m.tasks.forEach((t, ti) => {
        const mark = state.completedTasks[`${i}-${ti}`] ? "[x]" : "[ ]";
        lines.push(`   ${mark} ${t.task}`);
      });
    });
    if (roadmap.gaps.length) {
      lines.push(`\nGAPS TO CLOSE`);
      roadmap.gaps.forEach((g) => {
        lines.push(`\n• ${g.item}`);
        lines.push(`   ${g.why}`);
      });
    }
    return lines.join("\n");
  };

  const downloadPdf = () => {
    if (!roadmap) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const marginX = 48;
    const marginY = 56;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const maxW = pageW - marginX * 2;
    let y = marginY;

    const ensure = (h: number) => {
      if (y + h > pageH - marginY) {
        doc.addPage();
        y = marginY;
      }
    };
    const write = (text: string, size: number, bold = false, indent = 0) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text, maxW - indent) as string[];
      lines.forEach((ln) => {
        ensure(size + 4);
        doc.text(ln, marginX + indent, y);
        y += size + 4;
      });
    };

    doc.setTextColor(27, 36, 48);
    write("AI Life Navigator", 20, true);
    write("Your Roadmap", 14, false);
    y += 6;
    write(`Category: ${categoryLabel}`, 11);
    if (state.timeframe) write(`Timeframe: ${state.timeframe}`, 11);
    if (state.timePerWeek) write(`Time per week: ${state.timePerWeek}`, 11);
    write(`Progress: ${done}/${allTasks.length} tasks (${pct}%)`, 11);
    y += 8;

    if (roadmap.note) {
      write(roadmap.note, 10.5);
      y += 6;
    }

    write("Milestones", 14, true);
    y += 2;
    roadmap.milestones.forEach((m, i) => {
      y += 4;
      write(`${i + 1}. ${m.title}`, 12, true);
      m.tasks.forEach((t, ti) => {
        const mark = state.completedTasks[`${i}-${ti}`] ? "[x]" : "[ ]";
        write(`${mark} ${t.task}`, 11, false, 16);
      });
    });

    if (roadmap.gaps.length) {
      y += 10;
      write("Gaps to Close", 14, true);
      roadmap.gaps.forEach((g) => {
        y += 4;
        write(`• ${g.item}`, 12, true);
        write(g.why, 11, false, 16);
      });
    }

    doc.save("ai-life-navigator-roadmap.pdf");
  };

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(buildSummary());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your Roadmap</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {done} of {allTasks.length} tasks complete
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShareOpen(true)}
            disabled={!roadmap}
            className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-foreground/30 disabled:opacity-50"
          >
            Share
          </button>
          <button
            onClick={() => setRefreshOpen(true)}
            disabled={loading || !roadmap}
            className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-foreground/30 disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh My Roadmap"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <div className="font-medium">Couldn't generate your roadmap</div>
          <div className="mt-1 opacity-80">{error}</div>
          <button
            onClick={() => run()}
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

      {refreshOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 px-4"
          onClick={() => !loading && setRefreshOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">Refresh My Roadmap</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              What's changed? Share any new circumstances, priorities, or constraints — your roadmap will adjust while keeping completed work.
            </p>
            <textarea
              autoFocus
              value={refreshText}
              onChange={(e) => setRefreshText(e.target.value)}
              rows={5}
              placeholder="e.g. I got a new job offer, or my timeline changed to 3 months…"
              className="mt-4 w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-foreground/40"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setRefreshOpen(false)}
                disabled={loading}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const t = refreshText.trim();
                  if (!t) return;
                  setRefreshOpen(false);
                  setRefreshText("");
                  run(t);
                }}
                disabled={loading || !refreshText.trim()}
                className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Updating…" : "Update roadmap"}
              </button>
            </div>
          </div>
        </div>
      )}

      {shareOpen && roadmap && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 px-4"
          onClick={() => setShareOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Share your roadmap</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Download a clean PDF or copy a text summary to share.
                </p>
              </div>
              <button
                onClick={() => setShareOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-background p-3 text-xs text-muted-foreground">
{buildSummary()}
            </pre>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                onClick={copySummary}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-foreground/30"
              >
                {copied ? "Copied!" : "Copy summary"}
              </button>
              <button
                onClick={downloadPdf}
                className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}