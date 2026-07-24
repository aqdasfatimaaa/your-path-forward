import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAppState, type CategoryId } from "@/lib/app-state";

export const Route = createFileRoute("/details")({
  head: () => ({
    meta: [
      { title: "Tell us more · AI Life Navigator" },
      { name: "description", content: "A few details so we can tailor your roadmap." },
    ],
  }),
  component: DetailsPage,
});

const FIELDS: Record<CategoryId, { key: string; label: string; placeholder?: string }[]> = {
  career: [
    { key: "goal", label: "What career or skill do you want to pursue?", placeholder: "e.g. Become an AI Engineer" },
    { key: "background", label: "What's your current job/field and relevant background?" },
  ],
  study: [
    { key: "goal", label: "What do you want to study, and where (if you have a country/university in mind)?" },
    { key: "background", label: "What's your current academic background and stage?", placeholder: "e.g. final year undergrad in Pakistan, business degree" },
  ],
  job: [
    { key: "goal", label: "What kind of role or industry are you targeting?" },
    { key: "background", label: "What's your current work situation?", placeholder: "e.g. recent graduate, no experience" },
  ],
  business: [
    { key: "goal", label: "What's your business idea or which industry?" },
    { key: "background", label: "What resources or experience do you currently have?" },
  ],
  other: [
    { key: "goal", label: "Describe your goal in your own words" },
    { key: "background", label: "Where are you starting from?" },
  ],
};

export function DetailsPage() {
  const { state, update, hydrated } = useAppState();
  const navigate = useNavigate();

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

  const fields = FIELDS[state.category];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/clarify" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-14">
        <Link to="/category" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Tell us more</h1>
        <p className="mt-2 text-muted-foreground">
          The more we know, the sharper your roadmap.
        </p>

        <form onSubmit={submit} className="mt-10 space-y-6">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-foreground">
                {f.label}
              </label>
              <textarea
                required
                rows={3}
                value={state.details[f.key] ?? ""}
                placeholder={f.placeholder}
                onChange={(e) =>
                  update({ details: { ...state.details, [f.key]: e.target.value } })
                }
                className="mt-2 w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
          ))}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Available time per week</label>
              <select
                required
                value={state.timePerWeek ?? ""}
                onChange={(e) => update({ timePerWeek: e.target.value })}
                className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent"
              >
                <option value="" disabled>Select…</option>
                <option>&lt;5 hrs</option>
                <option>5-10 hrs</option>
                <option>10-20 hrs</option>
                <option>20+ hrs</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Timeframe</label>
              <select
                required
                value={state.timeframe ?? ""}
                onChange={(e) => update({ timeframe: e.target.value })}
                className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent"
              >
                <option value="" disabled>Select…</option>
                <option>3 months</option>
                <option>6 months</option>
                <option>1 year</option>
                <option>2+ years</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}