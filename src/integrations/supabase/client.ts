import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bffnhuuthkogztrddsce.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZm5odXV0aGtvZ3p0cmRkc2NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NzYzMTYsImV4cCI6MjEwMDQ1MjMxNn0.k1baQe_gWfFrrBs2wnP0A4BwViXC8oVwvFPtgoGisZc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEVICE_KEY = "ai-life-navigator-device-id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id =
      (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}