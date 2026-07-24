import { Link } from "@tanstack/react-router";

const nav = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/whatif", label: "What-If" },
  { to: "/ask", label: "Ask" },
  { to: "/progress", label: "Progress" },
] as const;

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
        <Link to="/" className="text-base font-semibold tracking-tight text-foreground">
          AI Life Navigator
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-5 py-10">{children}</main>
    </div>
  );
}