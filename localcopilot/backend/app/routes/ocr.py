import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models import OcrSnapshot, Session
from app.schemas import OcrResponse
from app.services.ocr_service import OcrService
from app.utils.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)
_svc = OcrService()


@router.post("/image", response_model=OcrResponse)
async def process_image(
    session_id: int = Form(...),
    image: UploadFile = File(...),
    db: DBSession = Depends(get_db),
) -> OcrResponse:
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    suffix = Path(image.filename or "screenshot.png").suffix or ".png"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        content = await image.read()
        tmp.write(content)
        tmp_path = tmp.name

    logger.info("Running OCR for session %s on %s", session_id, image.filename)

    try:
        extracted_text = await _svc.extract_text(tmp_path)
    except Exception as exc:
        logger.error("OCR error: %s", exc)
        raise HTTPException(status_code=500, detail=f"OCR failed: {exc}")
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    snapshot = OcrSnapshot(
        session_id=session_id,
        extracted_text=extracted_text,
    )
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)

    return OcrResponse(
        extracted_text=extracted_text,
        word_count=len(extracted_text.split()),
        session_id=session_id,
        snapshot_id=snapshot.id,
    )
