import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-between px-6 py-12">
        <div className="text-sm font-medium tracking-tight text-foreground/70">
          AI Life Navigator
        </div>

        <section className="py-16">
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
            Turn any goal into a clear path forward
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            AI Life Navigator turns confusing, complex goals — career changes,
            studying abroad, job searches, starting a business — into a
            personalized, step-by-step roadmap.
          </p>

          <ol className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              { n: "1", icon: "🎯", t: "Tell us your goal" },
              { n: "2", icon: "🗺️", t: "Get a personalized roadmap" },
              { n: "3", icon: "📈", t: "Track progress and adapt" },
            ].map((s) => (
              <li
                key={s.n}
                className="rounded-2xl border border-border/70 bg-card p-5"
              >
                <div className="text-2xl">{s.icon}</div>
                <div className="mt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Step {s.n}
                </div>
                <div className="mt-1 text-sm font-medium text-foreground">
                  {s.t}
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-12">
            <Link
              to="/category"
              className="inline-flex items-center justify-center rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-accent/90"
            >
              Start Your Journey
            </Link>
          </div>
        </section>

        <footer className="text-xs text-muted-foreground">
          A calmer way to plan what matters.
        </footer>
      </div>
    </div>
  );
}
