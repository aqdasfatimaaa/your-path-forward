import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CATEGORIES, useAppState, type CategoryId } from "@/lib/app-state";

export const Route = createFileRoute("/category")({
  head: () => ({
    meta: [
      { title: "Choose your goal · AI Life Navigator" },
      { name: "description", content: "Pick the category that best fits what you're working toward." },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { state, update, hydrated } = useAppState();
  const navigate = useNavigate();
  const selected = state.category;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
          What are you working toward?
        </h1>
        <p className="mt-3 text-muted-foreground">Pick the one that fits best.</p>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {CATEGORIES.map((c) => {
            const active = selected === c.id;
            return (
              <button
                key={c.id}
                onClick={() => update({ category: c.id as CategoryId })}
                disabled={!hydrated}
                className={`group flex items-center gap-4 rounded-2xl border p-5 text-left transition-all ${
                  active
                    ? "border-accent bg-accent/10 shadow-sm"
                    : "border-border/70 bg-card hover:border-foreground/30"
                }`}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-xl">
                  {c.icon}
                </span>
                <span className="min-w-0 text-base font-medium">{c.label}</span>
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="mt-10">
            <button
              onClick={() => navigate({ to: "/details" })}
              className="rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-accent/90"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}