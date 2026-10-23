"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useHub } from "@/lib/store";
import { post } from "@/lib/api";
import { Avatar, PageHeader, ago } from "@/components/ui";

function MessagesInner() {
  const { channels, messages, agents, refresh } = useHub();
  const sp = useSearchParams(); const router = useRouter();
  const cid = Number(sp.get("channel")) || channels[0]?.id;
  const ch = channels.find((c) => c.id === cid);
  const [text, setText] = useState("");
  const [newCh, setNewCh] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const list = messages.filter((m) => m.channel_id === cid);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [list.length]);
  const send = async () => { if (!text.trim()) return; await post("/api/messages", { content: text, channel_id: cid, type: "user" }); setText(""); refresh(); };
  const addChannel = async () => { if (!newCh.trim()) return; const c = await post<{ id: number }>("/api/channels", { name: newCh.trim().toLowerCase().replace(/\s+/g, "-"), type: "project" }); setNewCh(""); await refresh(); router.push(`/messages?channel=${c.id}`); };
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Messages" sub="Channel activity from agents, tasks, and you." />
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <div className="panel h-fit p-3">
          {channels.map((c) => <button key={c.id} onClick={() => router.push(`/messages?channel=${c.id}`)} className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${c.id === cid ? "bg-violet-500/15 text-white" : "text-slate-400 hover:bg-white/5"}`}># {c.name}</button>)}
          <div className="mt-3 flex gap-1.5"><input className="input py-1.5" placeholder="new-channel" value={newCh} onChange={(e) => setNewCh(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addChannel()} /><button className="btn-ghost" onClick={addChannel}>+</button></div>
        </div>
        <div className="panel flex h-[calc(100vh-14rem)] flex-col">
          <div className="border-b border-white/5 px-5 py-3"><div className="font-medium text-white"># {ch?.name}</div><div className="text-xs text-slate-500">{ch?.description}</div></div>
          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {list.length === 0 && <p className="text-center text-sm text-slate-500">No activity yet.</p>}
            {list.map((m) => {
              const a = agents.find((x) => x.id === m.agent_id);
              if (m.type === "system") return <div key={m.id} className="text-center text-xs text-slate-500">— {m.content} · {ago(m.timestamp)} —</div>;
              return (
                <div key={m.id} className={`flex gap-3 ${m.type === "user" ? "flex-row-reverse" : ""}`}>
                  {m.type === "user" ? <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink-700 text-xs">KB</div> : <Avatar agent={a} size={32} />}
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${m.type === "user" ? "bg-violet-600/80 text-white" : "bg-ink-800 text-slate-200"}`}>
                    <div className="mb-0.5 text-[11px] opacity-70">{m.type === "user" ? "You" : a?.name} · {ago(m.timestamp)}</div>{m.content}
                  </div>
                </div>
              );
            })}
            <div ref={end} />
          </div>
          <div className="flex gap-2 border-t border-white/5 p-3"><input className="input" placeholder={`Message #${ch?.name ?? ""}`} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} /><button className="btn-primary" onClick={send}>Send</button></div>
        </div>
      </div>
    </div>
  );
}
export default function MessagesPage() { return <Suspense><MessagesInner /></Suspense>; }
