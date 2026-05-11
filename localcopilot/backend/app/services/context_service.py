"""Pack meeting context for the LLM prompt."""
from __future__ import annotations

from typing import Any, Dict

from sqlalchemy.orm import Session as DBSession

from app.models import AssistantOutput, OcrSnapshot, TranscriptChunk
from app.utils.privacy import redact_secrets

_MAX_TRANSCRIPT_CHARS = 3_000
_MAX_OCR_CHARS = 2_000
_MAX_PREV_OUTPUTS = 2


def build_context(
    db: DBSession,
    session_id: int,
    meeting_title: str,
    user_notes: str,
    user_query: str,
    privacy_mode: bool = False,
) -> Dict[str, Any]:
    # Rolling transcript — most-recent chunks first, then reversed for chronological order
    chunks = (
        db.query(TranscriptChunk)
        .filter(TranscriptChunk.session_id == session_id)
        .order_by(TranscriptChunk.created_at.desc())
        .limit(30)
        .all()
    )
    transcript = " ".join(c.text for c in reversed(chunks))
    if len(transcript) > _MAX_TRANSCRIPT_CHARS:
        transcript = "…" + transcript[-_MAX_TRANSCRIPT_CHARS:]

    # Most recent OCR snapshot
    ocr_row = (
        db.query(OcrSnapshot)
        .filter(OcrSnapshot.session_id == session_id)
        .order_by(OcrSnapshot.captured_at.desc())
        .first()
    )
    ocr_text = ocr_row.extracted_text if ocr_row else ""
    if len(ocr_text) > _MAX_OCR_CHARS:
        ocr_text = ocr_text[:_MAX_OCR_CHARS] + "…"

    # Previous assistant outputs for continuity
    prev_outputs = (
        db.query(AssistantOutput)
        .filter(AssistantOutput.session_id == session_id)
        .order_by(AssistantOutput.created_at.desc())
        .limit(_MAX_PREV_OUTPUTS)
        .all()
    )

    if privacy_mode:
        transcript = redact_secrets(transcript)
        ocr_text = redact_secrets(ocr_text)
        user_notes = redact_secrets(user_notes)
        user_query = redact_secrets(user_query)

    return {
        "meeting_title": meeting_title,
        "transcript": transcript,
        "ocr_text": ocr_text,
        "user_notes": user_notes,
        "user_query": user_query,
        "previous_outputs": [
            {
                "suggested_response": o.suggested_response,
                "meeting_recap": o.meeting_recap,
            }
            for o in reversed(prev_outputs)
        ],
    }
