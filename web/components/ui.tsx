"use client";
import { Agent } from "@/lib/api";

const STATUS: Record<string, string> = {
  idle: "bg-slate-400", active: "bg-emerald-400", error: "bg-rose-500", disabled: "bg-slate-600",
  pending: "bg-slate-400", in_progress: "bg-cyan-400", review: "bg-amber-400", done: "bg-emerald-400", blocked: "bg-rose-500",
  approved: "bg-emerald-400", rejected: "bg-rose-500", changes_requested: "bg-amber-400",
};
export function Pill({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium capitalize text-slate-300">
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS[value] || "bg-slate-500"} ${value === "active" || value === "in_progress" ? "animate-pulse" : ""}`} />
      {value.replace("_", " ")}
    </span>
  );
}
export function Avatar({ agent, size = 36 }: { agent?: Agent; size?: number }) {
  const c = agent?.color || "#64748b";
  return (
    <div className="grid shrink-0 place-items-center rounded-xl font-semibold text-white" style={{ width: size, height: size, fontSize: size * 0.4, background: `linear-gradient(135deg, ${c}, ${c}55)`, boxShadow: `0 0 18px ${c}40` }}>
      {agent ? agent.name[0] : "?"}
    </div>
  );
}
export function PageHeader({ title, sub, action }: { title: string; sub: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1><p className="mt-1 text-sm text-slate-400">{sub}</p></div>
      {action}
    </div>
  );
}
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div className="panel w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-semibold text-white">{title}</h2>{children}
      </div>
    </div>
  );
}
export const ago = (iso: string) => {
  const s = (Date.now() - new Date(iso.endsWith("Z") || iso.includes("+") ? iso : iso + "Z").getTime()) / 1000;
  if (s < 60) return "just now"; if (s < 3600) return `${Math.floor(s / 60)}m ago`; if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`;
};
