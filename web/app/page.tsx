"use client";
import Link from "next/link";
import { useHub } from "@/lib/store";
import { Avatar, PageHeader, Pill } from "@/components/ui";
import { ApprovalCard } from "@/components/ApprovalCard";

export default function Overview() {
  const { overview: o, agents, tasks, approvals, query } = useHub();
  const q = query.toLowerCase();
  const stats = [
    { label: "Agents", value: o?.agents ?? "–", sub: `${o?.agents_active ?? 0} active`, accent: "from-violet-500/30" },
    { label: "Active tasks", value: o?.active_tasks ?? "–", sub: `${o?.blocked ?? 0} blocked`, accent: "from-cyan-400/30" },
    { label: "Pending approvals", value: o?.pending_approvals ?? "–", sub: "awaiting you", accent: "from-fuchsia-500/30" },
    { label: "Ready for review", value: o?.ready_for_review ?? "–", sub: "tasks in review", accent: "from-amber-400/30" },
  ];
  const running = (o?.active_tasks ?? 0) > 0;
  const attention = [
    ...approvals.filter((a) => a.status === "pending").map((a) => ({ kind: "approval" as const, a })),
  ];
  const review = tasks.filter((t) => t.status === "review" || t.status === "blocked");
  const errored = agents.filter((a) => a.status === "error");
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Workspace overview" sub="Who's working on what, and what's waiting on you." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={`panel relative overflow-hidden p-5`}>
            <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${s.accent} to-transparent blur-2xl`} />
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400">{s.label}</div>
            <div className="mt-2 text-3xl font-semibold text-white">{s.value}</div>
            <div className="mt-1 text-xs text-slate-500">{s.sub}</div>
          </div>
        ))}
      </div>
      <div className={`panel mt-4 flex items-center gap-3 px-5 py-3 text-sm ${running ? "border-cyan-400/20" : ""}`}>
        <span className={`h-2.5 w-2.5 rounded-full ${running ? "animate-pulse bg-cyan-400" : "bg-slate-500"}`} />
        <span className="text-slate-200">{o?.current_activity ?? "Connecting to API…"}</span>
        {errored.length > 0 && <span className="ml-auto text-xs text-rose-300">{errored.length} agent(s) reporting errors</span>}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Agent team</h2><Link href="/agents" className="text-xs text-violet-300 hover:underline">Manage →</Link></div>
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {agents.filter((a) => !q || `${a.name} ${a.role} ${a.description}`.toLowerCase().includes(q)).map((a) => (
              <Link key={a.id} href={`/agents?id=${a.id}`} className={`panel group p-4 transition hover:border-violet-500/40 ${a.status === "disabled" ? "opacity-50" : ""}`}>
                <div className="flex items-start gap-3">
                  <Avatar agent={a} size={40} />
                  <div className="min-w-0 flex-1"><div className="font-medium text-white">{a.name}</div><div className="text-xs text-violet-300/80">{a.role}</div></div>
                  <Pill value={a.status} />
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-slate-400">{a.description}</p>
                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3 text-xs text-slate-500">
                  <span><span className="font-semibold text-slate-200">{a.active_tasks ?? 0}</span> active task{a.active_tasks === 1 ? "" : "s"}</span>
                  <span className="opacity-0 transition group-hover:opacity-100">Open →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Needs your attention</h2>
          <div className="panel space-y-3 p-4">
            {attention.length === 0 && review.length === 0 && errored.length === 0 && <p className="py-6 text-center text-sm text-slate-500">All clear. Nothing waiting on you.</p>}
            {attention.map(({ a }) => <ApprovalCard key={a.id} ap={a} compact />)}
            {review.map((t) => (
              <Link key={t.id} href="/tasks" className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-ink-850/60 p-3 text-sm hover:border-violet-500/30">
                <Avatar agent={agents.find((a) => a.id === t.assigned_agent_id)} size={28} /><span className="flex-1 truncate text-slate-200">{t.title}</span><Pill value={t.status} />
              </Link>
            ))}
            {errored.map((a) => (
              <Link key={a.id} href={`/agents?id=${a.id}`} className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm"><Avatar agent={a} size={28} /><span className="flex-1 text-rose-200">{a.name} is in an error state</span></Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
