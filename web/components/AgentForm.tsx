"use client";
import { useState } from "react";
import { Agent, patch, post } from "@/lib/api";
import { useHub } from "@/lib/store";

export function AgentForm({ agent, onDone }: { agent?: Agent; onDone: () => void }) {
  const { refresh } = useHub();
  const [f, setF] = useState({ name: agent?.name || "", role: agent?.role || "", description: agent?.description || "", status: agent?.status || "idle", color: agent?.color || "#8b5cf6", model: String(agent?.config?.model ?? "") });
  const [err, setErr] = useState("");
  const save = async () => {
    try {
      const body = { name: f.name, role: f.role, description: f.description, status: f.status, color: f.color, config: { ...(agent?.config || {}), model: f.model } };
      agent ? await patch(`/api/agents/${agent.id}`, body) : await post("/api/agents", body);
      await refresh(); onDone();
    } catch (e) { setErr(String(e)); }
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input className="input" placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className="input" placeholder="Role" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} />
      </div>
      <textarea className="input h-20" placeholder="Short description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
      <div className="grid grid-cols-3 gap-3">
        <select className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
          {["idle", "active", "error", "disabled"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <input className="input" placeholder="Model (e.g. ollama/llama3)" value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} />
        <input className="input h-[38px] p-1" type="color" value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} />
      </div>
      {err && <p className="text-xs text-rose-400">{err}</p>}
      <div className="flex justify-end gap-2"><button className="btn-ghost" onClick={onDone}>Cancel</button><button className="btn-primary" disabled={!f.name || !f.role} onClick={save}>{agent ? "Save" : "Create agent"}</button></div>
    </div>
  );
}
