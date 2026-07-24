import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PageShell } from "@/components/AppHeader";
import { CATEGORIES, useAppState } from "@/lib/app-state";
import { askNavigator } from "@/lib/ask.functions";

export const Route = createFileRoute("/ask")({
  head: () => ({
    meta: [
      { title: "Ask Your Navigator · AI Life Navigator" },
      { name: "description", content: "Ask anything about your goal or roadmap." },
    ],
  }),
  component: AskPage,
});

type Msg = { role: "user" | "assistant"; content: string };

function AskPage() {
  const { state, update, hydrated } = useAppState();
  const GREETING: Msg = {
    role: "assistant",
    content: "Hi — I'm your Navigator. What's on your mind about your roadmap?",
  };
  const [messages, setMessages] = useState<Msg[]>([GREETING]);

  useEffect(() => {
    if (hydrated && state.chatHistory && state.chatHistory.length > 0) {
      setMessages(state.chatHistory);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const categoryLabel =
    CATEGORIES.find((c) => c.id === state.category)?.label ?? "your goal";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setError(null);
    setLoading(true);
    try {
      const res = await askNavigator({
        data: {
          categoryLabel,
          details: state.details,
          clarifyAnswers: state.clarifyAnswers,
          clarifyQuestions: state.clarifyQuestions.map((q) => ({
            id: q.id,
            question: q.question,
          })),
          roadmap: state.roadmap,
          messages: next,
        },
      });
      setMessages((m) => [...m, { role: "assistant", content: res.content }]);
      update({ chatHistory: [...next, { role: "assistant", content: res.content }] });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  if (!hydrated) return null;

  const hasRoadmap = !!state.roadmap && state.roadmap.milestones.length > 0;

  if (!hasRoadmap) {
    return (
      <PageShell>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ask Your Navigator</h1>
        <p className="mt-2 text-sm text-muted-foreground">A calm space to think out loud.</p>
        <div className="mt-10 rounded-3xl border border-border/70 bg-card p-8 text-center">
          <div className="text-2xl">🗺️</div>
          <h2 className="mt-3 text-lg font-semibold">Generate a roadmap first to start chatting</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your Navigator grounds every answer in your actual roadmap and goals. Create one to unlock the chat.
          </p>
          <a
            href="/dashboard"
            className="mt-6 inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
          >
            Go to roadmap
          </a>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ask Your Navigator</h1>
      <p className="mt-2 text-sm text-muted-foreground">A calm space to think out loud.</p>

      <div className="mt-8 flex h-[60vh] flex-col rounded-2xl border border-border/70 bg-card">
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "user" ? (
                <div className="max-w-[80%] rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                  {m.content}
                </div>
              ) : (
                <div className="max-w-[85%] whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {m.content}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-1 text-muted-foreground">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
              </div>
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2 border-t border-border/70 px-3 py-3"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask about your roadmap…"
            className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </PageShell>
  );
}