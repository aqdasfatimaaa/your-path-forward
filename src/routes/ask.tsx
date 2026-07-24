import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PageShell } from "@/components/AppHeader";

export const Route = createFileRoute("/ask")({
  head: () => ({
    meta: [
      { title: "Ask Your Navigator · AI Life Navigator" },
      { name: "description", content: "Ask anything about your goal or roadmap." },
    ],
  }),
  component: AskPage,
});

type Msg = { role: "user" | "assistant"; text: string };

function AskPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Hi — I'm your Navigator. What's on your mind about your roadmap?",
    },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "Good question. I'll think that through against your current roadmap and share a specific answer.",
        },
      ]);
    }, 600);
  };

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
                  {m.text}
                </div>
              ) : (
                <div className="max-w-[85%] text-sm leading-relaxed text-foreground">
                  {m.text}
                </div>
              )}
            </div>
          ))}
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your roadmap…"
            className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
          >
            Send
          </button>
        </form>
      </div>
    </PageShell>
  );
}