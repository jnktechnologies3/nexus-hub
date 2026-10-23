"use client";
import { useState } from "react";
import { useHub } from "@/lib/store";
import { patch } from "@/lib/api";
import { Avatar, Modal, PageHeader, Pill, ago } from "@/components/ui";
import { TaskForm } from "@/components/TaskForm";

const COLS = ["pending", "in_progress", "review", "blocked", "done"];
const PRI: Record<string, string> = { low: "text-slate-400", medium: "text-cyan-300", high: "text-amber-300", urgent: "text-rose-300" };

export default function TasksPage() {
  const { tasks, agents, refresh, query } = useHub();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const q = query.toLowerCase();
  const list = tasks.filter((t) => (!filter || t.assigned_agent_id === Number(filter)) && (!q || t.title.toLowerCase().includes(q)));
  const update = async (id: number, body: object) => { await patch(`/api/tasks/${id}`, body); refresh(); };
  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader title="Tasks" sub="Create, assign, and move work through its lifecycle." action={
        <div className="flex gap-2">
          <select className="input w-48" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">All agents</option>{agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
          <button className="btn-primary whitespace-nowrap" onClick={() => setOpen(true)}>+ New task</button>
        </div>} />
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        {COLS.map((col) => (
          <div key={col} className="panel p-3">
            <div className="mb-3 flex items-center justify-between px-1"><Pill value={col} /><span className="text-xs text-slate-500">{list.filter((t) => t.status === col).length}</span></div>
            <div className="space-y-2">
              {list.filter((t) => t.status === col).map((t) => {
                const a = agents.find((x) => x.id === t.assigned_agent_id);
                return (
                  <div key={t.id} className="rounded-xl border border-white/[0.07] bg-ink-850/70 p-3">
                    <div className="text-sm font-medium text-slate-100">{t.title}</div>
                    <div className="mt-1 flex items-center gap-2 text-[11px]"><span className={PRI[t.priority]}>{t.priority}</span>{t.requires_approval && <span className="text-fuchsia-300">needs approval</span>}<span className="ml-auto text-slate-500">{ago(t.updated_at)}</span></div>
                    <div className="mt-2 flex items-center gap-2">
                      <Avatar agent={a} size={20} />
                      <select className="flex-1 rounded-md border border-white/10 bg-ink-950 px-1.5 py-1 text-xs text-slate-300" value={t.assigned_agent_id ?? ""} onChange={(e) => update(t.id, { assigned_agent_id: e.target.value ? Number(e.target.value) : null })}>
                        <option value="">Unassigned</option>{agents.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                      </select>
                      <select className="rounded-md border border-white/10 bg-ink-950 px-1.5 py-1 text-xs text-slate-300" value={t.status} onChange={(e) => update(t.id, { status: e.target.value })}>
                        {COLS.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="New task">{open && <TaskForm onDone={() => setOpen(false)} />}</Modal>
    </div>
  );
}
