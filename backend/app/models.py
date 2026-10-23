from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field, Column, JSON


def now() -> datetime:
    return datetime.now(timezone.utc)


class AgentBase(SQLModel):
    name: str
    role: str
    description: str = ""
    status: str = "idle"  # idle | active | error | disabled
    avatar: Optional[str] = None
    color: str = "#8b5cf6"
    config: dict = Field(default_factory=dict, sa_column=Column(JSON))


class Agent(AgentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime = Field(default_factory=now)


class AgentUpdate(SQLModel):
    name: Optional[str] = None
    role: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    avatar: Optional[str] = None
    color: Optional[str] = None
    config: Optional[dict] = None


class TaskBase(SQLModel):
    title: str
    description: str = ""
    status: str = "pending"  # pending | in_progress | review | done | blocked
    priority: str = "medium"  # low | medium | high | urgent
    assigned_agent_id: Optional[int] = Field(default=None, foreign_key="agent.id")
    channel_id: Optional[int] = Field(default=None, foreign_key="channel.id")
    requires_approval: bool = False


class Task(TaskBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime = Field(default_factory=now)


class TaskUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_agent_id: Optional[int] = None
    channel_id: Optional[int] = None
    requires_approval: Optional[bool] = None


class ApprovalBase(SQLModel):
    title: str
    task_id: Optional[int] = Field(default=None, foreign_key="task.id")
    requested_by: Optional[int] = Field(default=None, foreign_key="agent.id")
    details: str = ""
    risk: str = "low"  # low | medium | high


class Approval(ApprovalBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    status: str = "pending"  # pending | approved | rejected | changes_requested
    decided_by: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=now)
    decided_at: Optional[datetime] = None


class Decision(SQLModel):
    decision: str  # approve | reject | request_changes
    notes: Optional[str] = None
    decided_by: str = "you"


class ChannelBase(SQLModel):
    name: str
    description: str = ""
    type: str = "general"  # general | project | agent


class Channel(ChannelBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=now)


class MessageBase(SQLModel):
    content: str
    channel_id: Optional[int] = Field(default=None, foreign_key="channel.id")
    agent_id: Optional[int] = Field(default=None, foreign_key="agent.id")
    type: str = "user"  # system | user | agent


class Message(MessageBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=now)
