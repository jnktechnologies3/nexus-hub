import os, tempfile
os.environ["NEXUS_DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/t.db"
from fastapi.testclient import TestClient
from app.main import app

def client():
    return TestClient(app)

def test_seed_and_overview():
    with client() as c:
        assert c.get("/api/health").json()["ok"]
        assert len(c.get("/api/agents").json()) == 8
        o = c.get("/api/overview").json()
        assert o["agents"] == 8 and o["pending_approvals"] == 3

def test_agent_crud():
    with client() as c:
        a = c.post("/api/agents", json={"name": "Test", "role": "QA"}).json()
        assert c.patch(f"/api/agents/{a['id']}", json={"description": "x"}).json()["description"] == "x"
        assert c.post(f"/api/agents/{a['id']}/disable").json()["status"] == "disabled"
        assert c.delete(f"/api/agents/{a['id']}").status_code == 204

def test_task_flow():
    with client() as c:
        t = c.post("/api/tasks", json={"title": "Do it"}).json()
        t = c.patch(f"/api/tasks/{t['id']}", json={"assigned_agent_id": 1, "status": "in_progress"}).json()
        assert t["assigned_agent_id"] == 1 and t["status"] == "in_progress"

def test_approval_decide():
    with client() as c:
        ap = c.get("/api/approvals", params={"status": "pending"}).json()[0]
        r = c.post(f"/api/approvals/{ap['id']}/decide", json={"decision": "request_changes", "notes": "smaller"})
        assert r.json()["status"] == "changes_requested"
        assert c.post(f"/api/approvals/{ap['id']}/decide", json={"decision": "approve"}).status_code == 409
        assert c.post(f"/api/approvals/{ap['id']}/decide", json={"decision": "nope"}).status_code == 422

def test_messages():
    with client() as c:
        m = c.post("/api/messages", json={"content": "hi", "channel_id": 1}).json()
        assert any(x["id"] == m["id"] for x in c.get("/api/messages", params={"channel_id": 1}).json())
