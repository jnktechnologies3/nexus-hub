"use client";
import { useState } from "react";
import { useHub } from "@/lib/store";
import { PageHeader } from "@/components/ui";
import { ApprovalCard } from "@/components/ApprovalCard";

export default function ApprovalsPage() {
  const { approvals } = useHub();
  const [tab, setTab] = useState<"pending" | "decided">("pending");
  const list = approvals.filter((a) => (tab === "pending" ? a.status === "pending" : a.status !== "pending"));
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Approvals" sub="Gate risky actions. Approve, reject, or send back with notes." />
      <div className="mb-4 flex gap-2">
        {(["pending", "decided"] as const).map((t) => <button key={t} className={tab === t ? "btn-primary" : "btn-ghost"} onClick={() => setTab(t)}>{t === "pending" ? `Pending (${approvals.filter((a) => a.status === "pending").length})` : "History"}</button>)}
      </div>
      <div className="space-y-3">
        {list.length === 0 && <div className="panel py-12 text-center text-sm text-slate-500">{tab === "pending" ? "Nothing waiting for approval." : "No decisions yet."}</div>}
        {list.map((a) => <ApprovalCard key={a.id} ap={a} />)}
      </div>
    </div>
  );
}
