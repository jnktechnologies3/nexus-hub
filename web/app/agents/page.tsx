"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useHub } from "@/lib/store";
import { Agent, patch, post } from "@/lib/api";
import { Avatar, Modal, PageHeader, Pill, ago } from "@/components/ui";
import { AgentForm } from "@/components/AgentForm";
import { TaskForm } from "@/components/TaskForm";

function AgentsInner() {
  const { agents, tasks, messages, refresh, query } = useHub();
  const sp = useSearchParams(); const router = useRouter();
  const [edit, setEdit] = useState<Agent | "new" | null>(null);
  const [assign, setAssign] = useState<number | null>(null);
  const selected = agents.find((a) => a.id === Number(sp.get("id")));
  const q = query.toLowerCase();
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Agents" sub="Register, edit, and disable the specialists in your workspace." action={<button className="btn-primary" onClick={() => setEdit("new")}>+ New agent</button>} />
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="panel divide-y divide-white/5">
          {agents.filter((a) => !q || `${a.name} ${a.role}`.toLowerCase().includes(q)).map((a) => (
            <div key={a.id} onClick={() => router.push(`/agents?id=${a.id}`)} className={`flex cursor-pointer items-center gap-4 p-4 hover:bg-white/[0.03] ${selected?.id === a.id ? "bg-violet-500/10" : ""}`}>
              <Avatar agent={a} />
              <div className="min-w-0 flex-1"><div className="font-medium text-white">{a.name} <span className="text-xs font-normal text-violet-300/80">· {a.role}</span></div><div className="truncate text-sm text-slate-400">{a.description}</div></div>
              <span className="hidden text-xs text-slate-500 sm:block">{a.active_tasks ?? 0} active</span>
              <Pill value={a.status} />
            </div>
          ))}
        </div>
        <div className="panel h-fit p-5">
          {!selected ? <p className="py-10 text-center text-sm text-slate-500">Select an agent to see details and history.</p> : (
            <div>
              <div className="flex items-center gap-3"><Avatar agent={selected} size={48} /><div className="flex-1"><div className="text-lg font-semibold text-white">{selected.name}</div><div className="text-sm text-violet-300/80">{selected.role}</div></div><Pill value={selected.status} /></div>
              <p className="mt-3 text-sm text-slate-300">{selected.description}</p>
              <div className="mt-2 text-xs text-slate-500">Model: {String(selected.config?.model || "unset")}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn-ghost" onClick={() => setEdit(selected)}>Edit</button>
                <button className="btn-ghost" onClick={() => setAssign(selected.id)}>Assign task</button>
                {selected.status === "disabled"
                  ? <button className="btn-ghost" onClick={async () => { await patch(`/api/agents/${selected.id}`, { status: "idle" }); refresh(); }}>Enable</button>
                  : <button className="btn bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/30" onClick={async () => { await post(`/api/agents/${selected.id}/disable`, {}); refresh(); }}>Disable</button>}
              </div>
              <h3 className="mt-6 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Tasks</h3>
              <div className="space-y-1.5">{tasks.filter((t) => t.assigned_agent_id === selected.id).map((t) => <div key={t.id} className="flex items-center gap-2 text-sm"><span className="flex-1 truncate text-slate-300">{t.title}</span><Pill value={t.status} /></div>)}</div>
              <h3 className="mt-6 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Conversation history</h3>
              <div className="max-h-64 space-y-2 overflow-y-auto">{messages.filter((m) => m.agent_id === selected.id).map((m) => <div key={m.id} className="rounded-lg bg-white/[0.03] p-2 text-sm text-slate-300">{m.content}<div className="text-[11px] text-slate-500">{ago(m.timestamp)}</div></div>)}</div>
            </div>
          )}
        </div>
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === "new" ? "New agent" : "Edit agent"}>{edit && <AgentForm agent={edit === "new" ? undefined : edit} onDone={() => setEdit(null)} />}</Modal>
      <Modal open={!!assign} onClose={() => setAssign(null)} title="Assign a task">{assign && <TaskForm agentId={assign} onDone={() => setAssign(null)} />}</Modal>
    </div>
  );
}
export default function AgentsPage() { return <Suspense><AgentsInner /></Suspense>; }
