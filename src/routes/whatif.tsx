import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/AppHeader";

export const Route = createFileRoute("/whatif")({
  head: () => ({
    meta: [
      { title: "What-If Scenarios · AI Life Navigator" },
      { name: "description", content: "Compare alternate paths toward the same goal." },
    ],
  }),
  component: WhatIfPage,
});

const SCENARIOS = [
  {
    title: "The Fast Path",
    horizon: "3–6 months",
    pros: ["Momentum quickly", "Clear near-term wins"],
    cons: ["Higher intensity", "Less room to explore"],
  },
  {
    title: "The Balanced Path",
    horizon: "6–12 months",
    pros: ["Sustainable pace", "Room for feedback"],
    cons: ["Slower external signals"],
  },
  {
    title: "The Deep Path",
    horizon: "12–24 months",
    pros: ["Stronger foundations", "Broader options later"],
    cons: ["Delayed payoff", "Requires patience"],
  },
];

function WhatIfPage() {
  const [shown, setShown] = useState(false);
  return (
    <PageShell>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">What-If Scenarios</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Explore alternate paths toward the same outcome.
      </p>

      {!shown ? (
        <button
          onClick={() => setShown(true)}
          className="mt-8 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
        >
          Generate comparison
        </button>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {SCENARIOS.map((s) => (
            <div key={s.title} className="rounded-2xl border border-border/70 bg-card p-5">
              <div className="text-sm font-medium text-muted-foreground">{s.horizon}</div>
              <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
              <div className="mt-4">
                <div className="text-xs font-medium uppercase tracking-wider text-success">
                  Upsides
                </div>
                <ul className="mt-2 space-y-1 text-sm">
                  {s.pros.map((p) => (
                    <li key={p}>• {p}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-4">
                <div className="text-xs font-medium uppercase tracking-wider text-accent">
                  Trade-offs
                </div>
                <ul className="mt-2 space-y-1 text-sm">
                  {s.cons.map((c) => (
                    <li key={c}>• {c}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}