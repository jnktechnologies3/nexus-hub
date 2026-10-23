"use client";
import { useState } from "react";
import { post } from "@/lib/api";
import { useHub } from "@/lib/store";

export function TaskForm({ onDone, agentId }: { onDone: () => void; agentId?: number }) {
  const { agents, channels, refresh } = useHub();
  const [f, setF] = useState({ title: "", description: "", priority: "medium", assigned_agent_id: agentId ? String(agentId) : "", channel_id: "", requires_approval: false });
  const save = async () => {
    await post("/api/tasks", { ...f, assigned_agent_id: f.assigned_agent_id ? Number(f.assigned_agent_id) : null, channel_id: f.channel_id ? Number(f.channel_id) : null });
    await refresh(); onDone();
  };
  return (
    <div className="space-y-3">
      <input className="input" placeholder="Task title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <textarea className="input h-20" placeholder="Details" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
      <div className="grid grid-cols-3 gap-3">
        <select className="input" value={f.assigned_agent_id} onChange={(e) => setF({ ...f, assigned_agent_id: e.target.value })}>
          <option value="">Unassigned</option>{agents.filter((a) => a.status !== "disabled").map((a) => <option key={a.id} value={a.id}>{a.name} · {a.role}</option>)}
        </select>
        <select className="input" value={f.channel_id} onChange={(e) => setF({ ...f, channel_id: e.target.value })}>
          <option value="">No channel</option>{channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
        </select>
        <select className="input" value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}>
          {["low", "medium", "high", "urgent"].map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={f.requires_approval} onChange={(e) => setF({ ...f, requires_approval: e.target.checked })} /> Requires approval</label>
      <div className="flex justify-end gap-2"><button className="btn-ghost" onClick={onDone}>Cancel</button><button className="btn-primary" disabled={!f.title} onClick={save}>Create task</button></div>
    </div>
  );
}
