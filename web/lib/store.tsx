"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, eventsUrl, Agent, Approval, Channel, Message, Overview, Task } from "./api";

type Hub = {
  agents: Agent[]; tasks: Task[]; approvals: Approval[]; channels: Channel[]; messages: Message[]; overview: Overview | null;
  status: "connecting" | "live" | "polling" | "offline"; refresh: () => Promise<void>; query: string; setQuery: (q: string) => void;
};
const Ctx = createContext<Hub | null>(null);

export function HubProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState({ agents: [] as Agent[], tasks: [] as Task[], approvals: [] as Approval[], channels: [] as Channel[], messages: [] as Message[], overview: null as Overview | null });
  const [status, setStatus] = useState<Hub["status"]>("connecting");
  const [query, setQuery] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [agents, tasks, approvals, channels, messages, overview] = await Promise.all([
        api<Agent[]>("/api/agents"), api<Task[]>("/api/tasks"), api<Approval[]>("/api/approvals"),
        api<Channel[]>("/api/channels"), api<Message[]>("/api/messages?limit=300"), api<Overview>("/api/overview"),
      ]);
      setData({ agents, tasks, approvals, channels, messages, overview });
      setStatus((s) => (s === "live" ? s : s === "offline" || s === "connecting" ? "polling" : s));
    } catch { setStatus("offline"); }
  }, []);

  useEffect(() => {
    refresh();
    let es: EventSource | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    try {
      es = new EventSource(eventsUrl());
      es.addEventListener("change", () => { setStatus("live"); refresh(); });
      es.onerror = () => { setStatus((s) => (s === "live" ? "polling" : s)); };
    } catch { /* fall back to polling */ }
    poll = setInterval(() => { if (!es || es.readyState !== 1) refresh(); }, 5000);
    return () => { es?.close(); if (poll) clearInterval(poll); };
  }, [refresh]);

  return <Ctx.Provider value={{ ...data, status, refresh, query, setQuery }}>{children}</Ctx.Provider>;
}
export const useHub = () => useContext(Ctx)!;
