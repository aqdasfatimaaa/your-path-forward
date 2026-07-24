import { useEffect, useState, useCallback } from "react";

export type CategoryId =
  | "career"
  | "study"
  | "job"
  | "business"
  | "other";

export const CATEGORIES: { id: CategoryId; label: string; icon: string }[] = [
  { id: "career", label: "Career Change or New Skill", icon: "🧭" },
  { id: "study", label: "Study Abroad", icon: "🎓" },
  { id: "job", label: "Job Search", icon: "💼" },
  { id: "business", label: "Start a Business", icon: "💡" },
  { id: "other", label: "Something Else", icon: "✨" },
];

export interface AppState {
  category?: CategoryId;
  details: Record<string, string>;
  timePerWeek?: string;
  timeframe?: string;
  clarifyQuestions: {
    id: string;
    question: string;
    type: "text" | "choice";
    options: string[] | null;
  }[];
  clarifyAnswers: Record<string, string>;
  completedTasks: Record<string, boolean>;
}

const KEY = "ai-life-navigator-state";
const DEFAULT: AppState = {
  details: {},
  clarifyQuestions: [],
  clarifyAnswers: {},
  completedTasks: {},
};

function read(): AppState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT;
  }
}

export function useAppState() {
  const [state, setState] = useState<AppState>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(read());
    setHydrated(true);
  }, []);

  const update = useCallback((patch: Partial<AppState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    setState(DEFAULT);
  }, []);

  return { state, update, reset, hydrated };
}