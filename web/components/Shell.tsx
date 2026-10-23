"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useHub } from "@/lib/store";
import { Avatar } from "./ui";

const NAV = [
  { href: "/", label: "Overview", icon: "◈" },
  { href: "/agents", label: "Agents", icon: "◉" },
  { href: "/tasks", label: "Tasks", icon: "▤" },
  { href: "/approvals", label: "Approvals", icon: "✓" },
  { href: "/messages", label: "Messages", icon: "✉" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { agents, channels, overview, status, query, setQuery } = useHub();
  const [open, setOpen] = useState(false);
  const q = query.toLowerCase();
  const visibleAgents = agents.filter((a) => !q || `${a.name} ${a.role}`.toLowerCase().includes(q));
  const visibleChannels = channels.filter((c) => !q || c.name.includes(q));
  const conn = { live: ["bg-emerald-400", "Live"], polling: ["bg-amber-400", "Polling"], connecting: ["bg-slate-400", "Connecting"], offline: ["bg-rose-500", "API offline"] }[status];

  const sidebar = (
    <aside className="flex h-full w-64 flex-col gap-5 border-r border-white/[0.06] bg-ink-950/80 p-4 backdrop-blur">
      <Link href="/" className="flex items-center gap-2.5 px-1">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-lg font-black text-ink-950">N</div>
        <div><div className="text-sm font-semibold text-white">Nexus Hub</div><div className="text-[11px] text-slate-500">agent workspace</div></div>
      </Link>
      <nav className="space-y-0.5">
        {NAV.map((n) => {
          const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
          const badge = n.href === "/approvals" ? overview?.pending_approvals : n.href === "/tasks" ? overview?.active_tasks : undefined;
          return (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${active ? "bg-violet-500/15 text-white ring-1 ring-violet-500/30" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}>
              <span className="w-4 text-center text-violet-300">{n.icon}</span>{n.label}
              {!!badge && <span className="ml-auto rounded-full bg-violet-500/25 px-1.5 text-[11px] text-violet-200">{badge}</span>}
            </Link>
          );
        })}
      </nav>
      <input className="input" placeholder="Search agents, channels…" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto">
        <div>
          <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Agents</div>
          {visibleAgents.map((a) => (
            <Link key={a.id} href={`/agents?id=${a.id}`} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-slate-300 hover:bg-white/5">
              <Avatar agent={a} size={22} /><span className="truncate">{a.name}</span>
              <span className={`ml-auto h-1.5 w-1.5 rounded-full ${a.status === "active" ? "bg-emerald-400" : a.status === "error" ? "bg-rose-500" : "bg-slate-600"}`} />
            </Link>
          ))}
        </div>
        <div>
          <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Channels</div>
          {visibleChannels.map((c) => (
            <Link key={c.id} href={`/messages?channel=${c.id}`} className="block rounded-lg px-2 py-1.5 text-sm text-slate-400 hover:bg-white/5 hover:text-slate-200"># {c.name}</Link>
          ))}
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:block">{sidebar}</div>
      {open && <div className="fixed inset-0 z-40 flex md:hidden" onClick={() => setOpen(false)}><div onClick={(e) => e.stopPropagation()}>{sidebar}</div></div>}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-ink-950/60 px-4 backdrop-blur md:px-8">
          <button className="btn-ghost md:hidden" onClick={() => setOpen(true)}>☰</button>
          <div className="text-sm text-slate-400"><span className="text-slate-200">Nexus Hub</span> / {NAV.find((n) => (n.href === "/" ? path === "/" : path.startsWith(n.href)))?.label}</div>
          <div className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300"><span className={`h-2 w-2 rounded-full ${conn[0]}`} />{conn[1]}</span>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-ink-700 text-xs font-semibold text-slate-200">KB</div>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
