import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models import Session, TranscriptChunk
from app.schemas import TranscriptionResponse
from app.services.transcription_service import TranscriptionService
from app.utils.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)
_svc = TranscriptionService()


@router.post("/audio", response_model=TranscriptionResponse)
async def transcribe_audio(
    session_id: int = Form(...),
    audio: UploadFile = File(...),
    db: DBSession = Depends(get_db),
) -> TranscriptionResponse:
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    suffix = Path(audio.filename or "audio.webm").suffix or ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name

    logger.info("Transcribing audio for session %s (%d bytes)", session_id, len(content))

    try:
        result = await _svc.transcribe(tmp_path)
    except Exception as exc:
        logger.error("Transcription error: %s", exc)
        raise HTTPException(status_code=500, detail=f"Transcription failed: {exc}")
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    chunk = TranscriptChunk(
        session_id=session_id,
        text=result["text"],
        start_time=result.get("start_time"),
        end_time=result.get("end_time"),
    )
    db.add(chunk)
    db.commit()
    db.refresh(chunk)

    return TranscriptionResponse(
        text=result["text"],
        chunks=result.get("chunks", []),
        language=result.get("language"),
        session_id=session_id,
        chunk_id=chunk.id,
    )
