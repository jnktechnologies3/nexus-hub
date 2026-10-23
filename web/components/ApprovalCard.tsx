"use client";
import { useState } from "react";
import { Approval, post } from "@/lib/api";
import { useHub } from "@/lib/store";
import { Avatar, Pill, ago } from "./ui";

const RISK: Record<string, string> = { low: "text-emerald-300", medium: "text-amber-300", high: "text-rose-300" };

export function ApprovalCard({ ap, compact }: { ap: Approval; compact?: boolean }) {
  const { agents, refresh } = useHub();
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const agent = agents.find((a) => a.id === ap.requested_by);
  const decide = async (decision: string) => { setBusy(true); try { await post(`/api/approvals/${ap.id}/decide`, { decision, notes: notes || null }); await refresh(); } finally { setBusy(false); } };
  return (
    <div className="rounded-xl border border-white/[0.07] bg-ink-850/60 p-4">
      <div className="flex items-start gap-3">
        <Avatar agent={agent} size={32} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><span className="font-medium text-white">{ap.title}</span><Pill value={ap.status} /></div>
          <div className="mt-0.5 text-xs text-slate-400">{agent?.name || "Unknown"} · <span className={RISK[ap.risk]}>{ap.risk} risk</span> · {ago(ap.created_at)}</div>
          {!compact && ap.details && <p className="mt-2 text-sm text-slate-300">{ap.details}</p>}
          {ap.notes && <p className="mt-2 text-xs italic text-slate-400">“{ap.notes}”</p>}
        </div>
      </div>
      {ap.status === "pending" && (
        <div className="mt-3 space-y-2">
          {!compact && <input className="input" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />}
          <div className="flex flex-wrap gap-2">
            <button disabled={busy} className="btn bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/25" onClick={() => decide("approve")}>Approve</button>
            <button disabled={busy} className="btn bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/30 hover:bg-amber-500/20" onClick={() => decide("request_changes")}>Request changes</button>
            <button disabled={busy} className="btn bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/30 hover:bg-rose-500/20" onClick={() => decide("reject")}>Reject</button>
          </div>
        </div>
      )}
    </div>
  );
}
