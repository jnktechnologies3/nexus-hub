from sqlmodel import Session, select
from .models import Agent, Task, Approval, Channel, Message

AGENTS = [
    ("Forge", "Developer", "Full-stack web, backend and frontend builds.", "active", "#8b5cf6"),
    ("Rack", "Homelab / Infra", "Docker, Hetzner boxes, tunnels and backups.", "active", "#22d3ee"),
    ("Scout", "Researcher", "Digs up docs, compares options, writes briefs.", "idle", "#34d399"),
    ("Pixel", "Designer / UI", "Layouts, themes, and component polish.", "idle", "#f472b6"),
    ("Branch", "GitHub / Repo", "PRs, issues, forks, releases and CI.", "active", "#fbbf24"),
    ("Reel", "Content / YouTube", "Scripts, thumbnails and upload schedules.", "idle", "#fb7185"),
    ("Spark", "Ideas / Planning", "Turns rough ideas into phased plans.", "idle", "#a78bfa"),
    ("Helm", "Manager / Coordinator", "Routes work between agents and tracks progress.", "error", "#60a5fa"),
]


def seed(session: Session) -> None:
    if session.exec(select(Agent)).first():
        return
    agents = [Agent(name=n, role=r, description=d, status=s, color=c, config={"model": "unset", "tools": []}) for n, r, d, s, c in AGENTS]
    session.add_all(agents)
    chans = [Channel(name="general", description="Workspace-wide chatter", type="general"),
             Channel(name="movie-nexus", description="MovieNexus site work", type="project"),
             Channel(name="homelab", description="Servers, Docker and networking", type="project"),
             Channel(name="content", description="YouTube and socials", type="project")]
    session.add_all(chans)
    session.commit()
    a = {x.role.split(" ")[0]: x.id for x in agents}
    c = {x.name: x.id for x in chans}
    tasks = [
        Task(title="Add search to MovieNexus admin", status="in_progress", priority="high", assigned_agent_id=a["Developer"], channel_id=c["movie-nexus"]),
        Task(title="Rotate expired GitHub token", status="review", priority="urgent", assigned_agent_id=a["GitHub"], channel_id=c["general"], requires_approval=True),
        Task(title="Set up nightly Postgres backups", status="in_progress", priority="medium", assigned_agent_id=a["Homelab"], channel_id=c["homelab"]),
        Task(title="Compare self-hosted LLM runtimes", status="pending", priority="medium", assigned_agent_id=a["Researcher"], channel_id=c["general"]),
        Task(title="Refresh dashboard color tokens", status="review", priority="low", assigned_agent_id=a["Designer"], channel_id=c["general"]),
        Task(title="Script next channel trailer", status="pending", priority="medium", assigned_agent_id=a["Content"], channel_id=c["content"]),
        Task(title="Phase plan for Nexus Hub v0.3", status="done", priority="low", assigned_agent_id=a["Ideas"], channel_id=c["general"]),
        Task(title="Merge stale fork cleanup PR", status="blocked", priority="medium", assigned_agent_id=a["GitHub"], channel_id=c["general"], requires_approval=True),
    ]
    session.add_all(tasks)
    session.commit()
    session.add_all([
        Approval(title="Delete 21 stale forks in jnktechnologies3", task_id=tasks[7].id, requested_by=a["GitHub"], details="Permanent repo deletion.", risk="high"),
        Approval(title="Deploy MovieNexus admin search to prod", task_id=tasks[0].id, requested_by=a["Developer"], details="Build passed; preview at staging.", risk="medium"),
        Approval(title="Open port 443 via Cloudflare Tunnel", task_id=tasks[2].id, requested_by=a["Homelab"], details="Expose backup dashboard.", risk="medium"),
    ])
    session.add_all([
        Message(channel_id=c["general"], type="system", content="Workspace created. 8 agents online."),
        Message(channel_id=c["general"], agent_id=a["Manager"], type="agent", content="Morning. Routing today's queue now."),
        Message(channel_id=c["movie-nexus"], agent_id=a["Developer"], type="agent", content="Admin search branch is green; requesting deploy approval."),
        Message(channel_id=c["homelab"], agent_id=a["Homelab"], type="agent", content="Backup cron drafted, testing restore."),
        Message(channel_id=c["content"], type="user", content="Trailer should be under 60 seconds."),
    ])
    session.commit()
