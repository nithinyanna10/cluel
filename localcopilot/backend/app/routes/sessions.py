from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models import Session
from app.schemas import ExportResponse, SessionCreate, SessionResponse
from app.services.summary_service import build_markdown_export
from app.utils.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.post("", response_model=SessionResponse, status_code=201)
def create_session(body: SessionCreate, db: DBSession = Depends(get_db)) -> Session:
    session = Session(title=body.title)
    db.add(session)
    db.commit()
    db.refresh(session)
    logger.info("Created session %s: %s", session.id, session.title)
    return session


@router.get("", response_model=List[SessionResponse])
def list_sessions(db: DBSession = Depends(get_db)) -> List[Session]:
    return db.query(Session).order_by(Session.created_at.desc()).all()


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: int, db: DBSession = Depends(get_db)) -> Session:
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete("/{session_id}", status_code=204)
def delete_session(session_id: int, db: DBSession = Depends(get_db)) -> None:
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    logger.info("Deleted session %s", session_id)


@router.post("/{session_id}/export", response_model=ExportResponse)
def export_session(session_id: int, db: DBSession = Depends(get_db)) -> ExportResponse:
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    markdown = build_markdown_export(db, session)
    return ExportResponse(session_id=session.id, title=session.title, markdown=markdown)
