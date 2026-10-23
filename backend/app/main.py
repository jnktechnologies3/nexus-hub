import asyncio
import json
import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select, func

from . import db
from .models import (Agent, AgentBase, AgentUpdate, Approval, ApprovalBase, Channel, ChannelBase,
                     Decision, Message, MessageBase, Task, TaskBase, TaskUpdate, now)
from .seed import seed

API_KEY = os.getenv("NEXUS_API_KEY", "")
VERSION = {"n": 0}  # bumps on every write; drives SSE


def bump():
    VERSION["n"] += 1


def auth(x_api_key: Optional[str] = Header(default=None), request: Request = None):
    if API_KEY and x_api_key != API_KEY and request.query_params.get("key") != API_KEY:
        raise HTTPException(401, "invalid or missing API key")


@asynccontextmanager
async def lifespan(app):
    db.init_db()
    if os.getenv("NEXUS_SEED", "true").lower() == "true":
        with Session(db.engine) as s:
            seed(s)
    yield


app = FastAPI(title="Nexus Hub API", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("NEXUS_CORS", "*").split(","),
                   allow_methods=["*"], allow_headers=["*"])
S = Depends(db.get_session)
A = [Depends(auth)]


def get_or_404(s, model, id):
    obj = s.get(model, id)
    if not obj:
        raise HTTPException(404, f"{model.__name__} {id} not found")
    return obj


def log(s, content, channel_id=None, agent_id=None, type="system"):
    s.add(Message(content=content, channel_id=channel_id, agent_id=agent_id, type=type))


@app.get("/api/health")
def health():
    return {"ok": True, "auth": bool(API_KEY), "version": VERSION["n"]}


# ---- Agents
@app.get("/api/agents", dependencies=A)
def list_agents(s: Session = S):
    agents = s.exec(select(Agent).order_by(Agent.id)).all()
    counts = dict(s.exec(select(Task.assigned_agent_id, func.count()).where(Task.status.in_(["in_progress", "review"])).group_by(Task.assigned_agent_id)).all())
    return [{**a.model_dump(), "active_tasks": counts.get(a.id, 0)} for a in agents]


@app.post("/api/agents", dependencies=A, status_code=201)
def create_agent(body: AgentBase, s: Session = S):
    a = Agent.model_validate(body)
    s.add(a); s.commit(); s.refresh(a)
    log(s, f"Agent {a.name} ({a.role}) added."); s.commit(); s.refresh(a); bump()
    return a


@app.get("/api/agents/{id}", dependencies=A)
def get_agent(id: int, s: Session = S):
    return get_or_404(s, Agent, id)


@app.patch("/api/agents/{id}", dependencies=A)
def update_agent(id: int, body: AgentUpdate, s: Session = S):
    a = get_or_404(s, Agent, id)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(a, k, v)
    a.updated_at = now(); s.add(a); s.commit(); s.refresh(a); bump()
    return a


@app.post("/api/agents/{id}/disable", dependencies=A)
def disable_agent(id: int, s: Session = S):
    a = get_or_404(s, Agent, id)
    a.status = "disabled"; a.updated_at = now(); s.add(a)
    log(s, f"Agent {a.name} disabled."); s.commit(); s.refresh(a); bump()
    return a


@app.delete("/api/agents/{id}", dependencies=A, status_code=204)
def delete_agent(id: int, s: Session = S):
    a = get_or_404(s, Agent, id)
    for t in s.exec(select(Task).where(Task.assigned_agent_id == id)).all():
        t.assigned_agent_id = None; s.add(t)
    s.delete(a); s.commit(); bump()


# ---- Tasks
@app.get("/api/tasks", dependencies=A)
def list_tasks(status: Optional[str] = None, agent_id: Optional[int] = None, s: Session = S):
    q = select(Task).order_by(Task.id.desc())
    if status: q = q.where(Task.status == status)
    if agent_id: q = q.where(Task.assigned_agent_id == agent_id)
    return s.exec(q).all()


@app.post("/api/tasks", dependencies=A, status_code=201)
def create_task(body: TaskBase, s: Session = S):
    t = Task.model_validate(body)
    s.add(t); s.commit(); s.refresh(t)
    log(s, f"Task created: {t.title}", channel_id=t.channel_id); s.commit(); s.refresh(t); bump()
    return t


@app.patch("/api/tasks/{id}", dependencies=A)
def update_task(id: int, body: TaskUpdate, s: Session = S):
    t = get_or_404(s, Task, id)
    changes = body.model_dump(exclude_unset=True)
    for k, v in changes.items():
        setattr(t, k, v)
    t.updated_at = now(); s.add(t)
    if "status" in changes:
        log(s, f"Task '{t.title}' → {t.status}", channel_id=t.channel_id, agent_id=t.assigned_agent_id)
    if "assigned_agent_id" in changes and t.assigned_agent_id:
        ag = s.get(Agent, t.assigned_agent_id)
        log(s, f"Task '{t.title}' assigned to {ag.name if ag else '?'}", channel_id=t.channel_id)
    s.commit(); s.refresh(t); bump()
    return t


@app.delete("/api/tasks/{id}", dependencies=A, status_code=204)
def delete_task(id: int, s: Session = S):
    s.delete(get_or_404(s, Task, id)); s.commit(); bump()


# ---- Approvals
@app.get("/api/approvals", dependencies=A)
def list_approvals(status: Optional[str] = None, s: Session = S):
    q = select(Approval).order_by(Approval.id.desc())
    if status: q = q.where(Approval.status == status)
    return s.exec(q).all()


@app.post("/api/approvals", dependencies=A, status_code=201)
def create_approval(body: ApprovalBase, s: Session = S):
    ap = Approval.model_validate(body)
    s.add(ap); s.commit(); s.refresh(ap); bump()
    return ap


@app.post("/api/approvals/{id}/decide", dependencies=A)
def decide(id: int, body: Decision, s: Session = S):
    mapping = {"approve": "approved", "reject": "rejected", "request_changes": "changes_requested"}
    if body.decision not in mapping:
        raise HTTPException(422, "decision must be approve, reject or request_changes")
    ap = get_or_404(s, Approval, id)
    if ap.status != "pending":
        raise HTTPException(409, f"already {ap.status}")
    ap.status = mapping[body.decision]; ap.notes = body.notes; ap.decided_by = body.decided_by; ap.decided_at = now()
    s.add(ap)
    if ap.task_id:
        t = s.get(Task, ap.task_id)
        if t:
            t.status = {"approved": "in_progress", "rejected": "blocked", "changes_requested": "in_progress"}[ap.status]
            t.updated_at = now(); s.add(t)
            log(s, f"Approval '{ap.title}' {ap.status.replace('_', ' ')}" + (f": {body.notes}" if body.notes else ""), channel_id=t.channel_id)
    s.commit(); s.refresh(ap); bump()
    return ap


# ---- Channels & messages
@app.get("/api/channels", dependencies=A)
def list_channels(s: Session = S):
    return s.exec(select(Channel).order_by(Channel.id)).all()


@app.post("/api/channels", dependencies=A, status_code=201)
def create_channel(body: ChannelBase, s: Session = S):
    c = Channel.model_validate(body); s.add(c); s.commit(); s.refresh(c); bump()
    return c


@app.get("/api/messages", dependencies=A)
def list_messages(channel_id: Optional[int] = None, agent_id: Optional[int] = None, limit: int = 100, s: Session = S):
    q = select(Message).order_by(Message.id.desc()).limit(limit)
    if channel_id: q = q.where(Message.channel_id == channel_id)
    if agent_id: q = q.where(Message.agent_id == agent_id)
    return list(reversed(s.exec(q).all()))


@app.post("/api/messages", dependencies=A, status_code=201)
def post_message(body: MessageBase, s: Session = S):
    m = Message.model_validate(body); s.add(m); s.commit(); s.refresh(m); bump()
    return m


# ---- Overview & live updates
@app.get("/api/overview", dependencies=A)
def overview(s: Session = S):
    tasks = s.exec(select(Task)).all()
    agents = s.exec(select(Agent)).all()
    pending = s.exec(select(Approval).where(Approval.status == "pending")).all()
    running = [t for t in tasks if t.status == "in_progress"]
    return {
        "agents": len(agents),
        "agents_active": sum(a.status == "active" for a in agents),
        "agents_error": sum(a.status == "error" for a in agents),
        "active_tasks": len(running),
        "pending_approvals": len(pending),
        "ready_for_review": sum(t.status == "review" for t in tasks),
        "blocked": sum(t.status == "blocked" for t in tasks),
        "current_activity": (f"{len(running)} task(s) running" if running else "No turn running"),
        "version": VERSION["n"],
    }


@app.get("/api/events", dependencies=A)
async def events(request: Request):
    async def gen():
        last = -1
        while not await request.is_disconnected():
            if VERSION["n"] != last:
                last = VERSION["n"]
                yield f"event: change\ndata: {json.dumps({'version': last})}\n\n"
            else:
                yield ": ping\n\n"
            await asyncio.sleep(1.5)
    return StreamingResponse(gen(), media_type="text/event-stream")
