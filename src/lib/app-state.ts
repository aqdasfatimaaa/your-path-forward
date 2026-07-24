import { useEffect, useState, useCallback } from "react";
import { supabase, getDeviceId } from "@/integrations/supabase/client";

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
  roadmap?: {
    note: string;
    milestones: { title: string; tasks: { task: string; done: boolean }[] }[];
    gaps: { item: string; why: string }[];
  };
  whatIfPaths?: {
    name: string;
    timeframe: string;
    difficulty: string;
    pros: string[];
    tradeoffs: string[];
    bestFor: string;
  }[];
  chatHistory?: { role: "user" | "assistant"; content: string }[];
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
    const local = read();
    setState(local);
    const deviceId = getDeviceId();

    // Load from Supabase; prefer remote if it exists.
    supabase
      .from("app_state")
      .select("state")
      .eq("device_id", deviceId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error("Supabase load failed:", error.message, error);
        }
        if (data?.state) {
          const merged = { ...DEFAULT, ...(data.state as AppState) };
          setState(merged);
          try {
            localStorage.setItem(KEY, JSON.stringify(merged));
          } catch {}
        }
        setHydrated(true);
      });
  }, []);

  const update = useCallback((patch: Partial<AppState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}

      const deviceId = getDeviceId();
      if (deviceId) {
        supabase
          .from("app_state")
          .upsert(
            { device_id: deviceId, state: next, updated_at: new Date().toISOString() },
            { onConflict: "device_id" },
          )
          .then(({ error }) => {
            if (error) {
              console.error("Supabase upsert failed:", error.message, error);
            } else {
              console.log("Supabase upsert succeeded for device:", deviceId);
            }
          });
      }

      return next;
    });
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    const deviceId = getDeviceId();
    if (deviceId) {
      supabase
        .from("app_state")
        .delete()
        .eq("device_id", deviceId)
        .then(({ error }) => {
          if (error) {
            console.error("Supabase delete failed:", error.message, error);
          }
        });
    }
    setState(DEFAULT);
  }, []);

  return { state, update, reset, hydrated };
}
