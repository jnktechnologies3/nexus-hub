export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8100";
const KEY = process.env.NEXT_PUBLIC_API_KEY || "";

export type Agent = { id: number; name: string; role: string; description: string; status: string; color: string; active_tasks?: number; config?: Record<string, unknown> };
export type Task = { id: number; title: string; description: string; status: string; priority: string; assigned_agent_id: number | null; channel_id: number | null; requires_approval: boolean; updated_at: string };
export type Approval = { id: number; title: string; task_id: number | null; requested_by: number | null; details: string; risk: string; status: string; notes: string | null; created_at: string };
export type Channel = { id: number; name: string; description: string; type: string };
export type Message = { id: number; content: string; channel_id: number | null; agent_id: number | null; type: string; timestamp: string };
export type Overview = { agents: number; agents_active: number; agents_error: number; active_tasks: number; pending_approvals: number; ready_for_review: number; blocked: number; current_activity: string; version: number };

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(KEY ? { "X-API-Key": KEY } : {}), ...(init.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.status === 204 ? (undefined as T) : res.json();
}
export const post = <T,>(p: string, body: unknown) => api<T>(p, { method: "POST", body: JSON.stringify(body) });
export const patch = <T,>(p: string, body: unknown) => api<T>(p, { method: "PATCH", body: JSON.stringify(body) });
export const eventsUrl = () => `${API_URL}/api/events${KEY ? `?key=${encodeURIComponent(KEY)}` : ""}`;
