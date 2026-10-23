# Nexus Hub — Roadmap

| Phase | Scope | Status |
|---|---|---|
| 0 | Planning, name (Nexus Hub), stack decisions | ✅ Done |
| 1 | UI shell: sidebar, top bar, stat cards, status banner, agent grid, attention panel, dark navy/purple theme, responsive | ✅ Done (v0.1.0) |
| 2 | FastAPI + SQLite; agent CRUD; task create/assign/status; approvals; channel feed; SSE + polling; per-agent history | ✅ MVP done (v0.1.0) |
| 3 | Core workflow depth | ⏭ Next |
| 4 | Agent execution | Planned |
| 5 | Polish and deploy | Partly done (Compose, optional API key) |

## Phase 3: Workflow depth
- Task dependencies and multi-agent handoffs (`blocked_by`, handoff events)
- Auto-create an approval when a `requires_approval` task enters review
- Task comments and threaded messages; @mentions of agents
- Audit log table (who changed what, when) and decision history view
- Filters, sorting, and saved views on Tasks; drag-and-drop board
- WebSocket option alongside SSE; per-entity change payloads instead of full refetches

## Phase 4: Agent execution
- Per-agent LLM backend config (Ollama, Claude, Grok, OpenAI, and others) with secrets kept server-side
- Simple runner: an agent picks up an assigned task, posts progress to its channel, and requests approval before risky tools
- Tool integrations: GitHub (issues and PRs), Docker (container status), HTTP webhooks
- Run logs and token or cost tracking per agent

## Phase 5: Polish and deploy
- Real auth (sessions, or Authentik/Keycloak via OIDC) to replace the shared API key
- Postgres option and Alembic migrations
- Traefik labels and Cloudflare Tunnel example
- Notifications (ntfy, Discord, or email) for new approvals
- Mobile refinements, keyboard shortcuts, light theme
- Playwright end-to-end tests and CI
