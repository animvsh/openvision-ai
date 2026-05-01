from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class CameraStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"


class EventSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class EventStatus(str, Enum):
    NEW = "new"
    REVIEWING = "reviewing"
    ESCALATED = "escalated"
    DISMISSED = "dismissed"


class SessionStatus(str, Enum):
    ACTIVE = "active"
    ENDED = "ended"
    PAUSED = "paused"


class Camera(BaseModel):
    id: str
    name: str
    location: str
    org_id: str
    status: CameraStatus = CameraStatus.ACTIVE
    rtsp_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class Session(BaseModel):
    id: str
    camera_id: str
    org_id: str
    user_id: str
    status: SessionStatus = SessionStatus.ACTIVE
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = 0


class Event(BaseModel):
    id: str
    session_id: str
    camera_id: str
    org_id: str
    rule_id: str
    severity: EventSeverity
    status: EventStatus = EventStatus.NEW
    description: str
    ai_summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class Rule(BaseModel):
    id: str
    org_id: str
    name: str
    description: str
    mode: str
    severity: EventSeverity
    conditions: dict
    actions: List[str]
    enabled: bool = True
    created_at: datetime
    updated_at: datetime


class AnalyticsOverview(BaseModel):
    total_events: int
    active_sessions: int
    cameras_online: int
    events_by_severity: dict
    recent_alerts: int


class CameraAnalytics(BaseModel):
    camera_id: str
    event_count: int
    session_count: int
    avg_duration_minutes: float
    top_severity: EventSeverity
    events_by_hour: dict


class SessionAnalytics(BaseModel):
    session_id: str
    event_count: int
    severity_breakdown: dict
    duration_minutes: float
    ai_summaries: List[str]
