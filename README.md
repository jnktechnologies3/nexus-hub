# Nexus Hub

A self-hosted, dark-themed workspace for a team of specialized AI agents: see who is working on what, assign tasks, approve or reject risky actions, and follow activity by channel.

**Status:** v0.1.0 — Phase 1 (UI shell) + Phase 2 MVP (persistence and core workflows). Agents are records only; nothing executes yet (see [docs/PHASES.md](docs/PHASES.md)).

| Part | Stack | Port |
|------|-------|------|
| Web UI | Next.js 15 (App Router) + Tailwind v4 | **3100** |
| API | FastAPI + SQLModel + SQLite | **8100** |

Ports 4173, 5173, 5174 and 8888 are deliberately left free for other local apps.

## Features
- **Overview:** stat cards (agents, active tasks, pending approvals, ready for review), live status banner, agent team grid (name, role, description, status, active task count), *Needs your attention* panel with inline approve / request changes / reject.
- **Sidebar:** Overview, Agents, Tasks, Approvals, Messages; search (filters agents, channels, tasks); agent quick list with status dots; channel list.
- **Top bar:** breadcrumb and connection status (Live via SSE, Polling fallback, API offline).
- **Agents:** create, edit (name, role, description, status, color, model), disable or re-enable; detail panel with tasks and conversation history.
- **Tasks:** board by status (pending, in progress, review, blocked, done); create, assign or reassign, and change status inline; priority and approval flags.
- **Approvals:** pending and history tabs; approve, reject, or request changes with notes. A decision updates the linked task and is logged to its channel.
- **Messages:** per-channel activity feed (system, agent, and user messages), posting, and channel creation.
- **Live updates:** Server-Sent Events at `/api/events`, with 5-second polling as a fallback.
- **Seed data:** 8 example agents (Developer, Homelab/Infra, Researcher, Designer, GitHub/Repo, Content/YouTube, Ideas/Planning, Manager), 4 channels, 8 tasks, and 3 approvals.

![Overview](docs/overview.png)

## Run locally (Windows PowerShell)
Requirements: Python 3.11+ and Node 20+.

```powershell
# API
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\uvicorn app.main:app --port 8100
```

```powershell
# Web (second terminal)
cd web
npm install
npm run dev        # http://localhost:3100  (or: npm run build; npm start)
```

On macOS or Linux, use `.venv/bin/...` instead.

## Docker Compose
```powershell
Copy-Item .env.example .env
docker compose up -d --build
# UI  -> http://localhost:3100
# API -> http://localhost:8100/docs
```
SQLite lives in the `nexus-data` volume. If you open the UI from another machine, set `NEXT_PUBLIC_API_URL` to an address that browser can reach (for example `http://192.168.1.50:8100`), then rebuild.

## API quick tour (PowerShell)
```powershell
curl.exe http://localhost:8100/api/health
curl.exe http://localhost:8100/api/overview
curl.exe http://localhost:8100/api/agents
curl.exe -X POST http://localhost:8100/api/tasks -H "Content-Type: application/json" -d '{\"title\":\"Try Nexus Hub\",\"assigned_agent_id\":1}'
curl.exe -X POST http://localhost:8100/api/approvals/1/decide -H "Content-Type: application/json" -d '{\"decision\":\"approve\",\"notes\":\"ok\"}'
curl.exe -N http://localhost:8100/api/events
```
If `NEXUS_API_KEY` is set, add `-H "X-API-Key: <key>"` (or `?key=` for SSE).

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health`, `/api/overview` | Health check, stats |
| GET/POST | `/api/agents` | List (with `active_tasks`) and create |
| GET/PATCH/DELETE | `/api/agents/{id}` | Read, edit, delete |
| POST | `/api/agents/{id}/disable` | Disable |
| GET/POST | `/api/tasks` (`?status=&agent_id=`) | List and create |
| PATCH/DELETE | `/api/tasks/{id}` | Assign, change status, edit |
| GET/POST | `/api/approvals` (`?status=`) | List and create |
| POST | `/api/approvals/{id}/decide` | `approve` / `reject` / `request_changes` |
| GET/POST | `/api/channels`, `/api/messages` (`?channel_id=&agent_id=`) | Channels and feed |
| GET | `/api/events` | SSE change stream |

Interactive docs are at `http://localhost:8100/docs`.

## Tests
```powershell
cd backend; .\.venv\Scripts\pytest -q
```

## Configuration
See `.env.example`: `NEXUS_API_KEY` (empty means auth is off), `NEXUS_SEED`, `NEXUS_CORS`, `NEXUS_DATABASE_URL`, `NEXT_PUBLIC_API_URL`.

## License
MIT
