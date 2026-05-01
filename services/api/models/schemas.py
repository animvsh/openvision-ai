from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    data: Optional[Any] = None


class SuccessResponse(BaseModel):
    success: bool = True
    data: Any
    error: Optional[str] = None


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)


class CameraCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    location: str = Field(..., min_length=1, max_length=500)
    rtsp_url: Optional[str] = None


class CameraUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    location: Optional[str] = Field(None, min_length=1, max_length=500)
    status: Optional[str] = None
    rtsp_url: Optional[str] = None


class SessionStart(BaseModel):
    camera_id: str = Field(..., min_length=1)


class EventListParams(PaginationParams):
    camera_id: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class EventEscalate(BaseModel):
    event_id: str = Field(..., min_length=1)
    notes: Optional[str] = None


class EventDismiss(BaseModel):
    event_id: str = Field(..., min_length=1)
    reason: Optional[str] = None


class RuleCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., max_length=1000)
    mode: str = Field(..., min_length=1)
    severity: str = Field(..., min_length=1)
    conditions: Dict[str, Any]
    actions: List[str]
    enabled: bool = True


class RuleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    severity: Optional[str] = None
    conditions: Optional[Dict[str, Any]] = None
    actions: Optional[List[str]] = None
    enabled: Optional[bool] = None


class AISummarizeEvent(BaseModel):
    event_id: str = Field(..., min_length=1)
    include_video: bool = False


class AISummarizeSession(BaseModel):
    session_id: str = Field(..., min_length=1)
    highlights_only: bool = True
