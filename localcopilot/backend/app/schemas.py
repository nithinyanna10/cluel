from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


# ── Sessions ──────────────────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    title: str = "Untitled Meeting"


class SessionResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class SessionDetail(SessionResponse):
    transcript_chunks: List[TranscriptChunkResponse] = []
    ocr_snapshots: List[OcrSnapshotResponse] = []
    assistant_outputs: List[AssistantOutputResponse] = []


# ── Transcript ────────────────────────────────────────────────────────────────

class TranscriptChunkResponse(BaseModel):
    id: int
    session_id: int
    text: str
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    speaker: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TranscriptionResponse(BaseModel):
    text: str
    chunks: List[Dict[str, Any]] = []
    language: Optional[str] = None
    session_id: int
    chunk_id: int


# ── OCR ───────────────────────────────────────────────────────────────────────

class OcrSnapshotResponse(BaseModel):
    id: int
    session_id: int
    extracted_text: str
    captured_at: datetime

    model_config = {"from_attributes": True}


class OcrResponse(BaseModel):
    extracted_text: str
    word_count: int
    session_id: int
    snapshot_id: int


# ── Assistant ─────────────────────────────────────────────────────────────────

class AssistantRequest(BaseModel):
    session_id: int
    meeting_title: str = "Untitled Meeting"
    user_notes: str = ""
    user_query: str = ""


class AssistantResponseSchema(BaseModel):
    suggested_response: str
    follow_up_question: str
    meeting_recap: str
    action_items: List[str]
    confidence: float = Field(ge=0.0, le=1.0)
    safety_note: str


class AssistantOutputResponse(BaseModel):
    id: int
    session_id: int
    suggested_response: Optional[str] = None
    follow_up_question: Optional[str] = None
    meeting_recap: Optional[str] = None
    action_items: Optional[List[str]] = None
    confidence: float = 0.0
    safety_note: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Settings ──────────────────────────────────────────────────────────────────

class SettingsUpdate(BaseModel):
    llm_provider: Optional[Literal["claude", "openai", "ollama", "mock"]] = None
    api_key: Optional[str] = None
    model_name: Optional[str] = None
    llm_base_url: Optional[str] = None
    transcription_model_size: Optional[str] = None
    hotkey: Optional[str] = None
    privacy_mode: Optional[bool] = None
    local_only_mode: Optional[bool] = None


class SettingsResponse(BaseModel):
    llm_provider: str
    api_key_set: bool
    model_name: str
    llm_base_url: str
    transcription_model_size: str
    hotkey: str
    privacy_mode: bool
    local_only_mode: bool


# ── Health ────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    version: str
    services: Dict[str, str]


# ── Export ────────────────────────────────────────────────────────────────────

class ExportResponse(BaseModel):
    session_id: int
    title: str
    markdown: str


# Forward references
SessionDetail.model_rebuild()
