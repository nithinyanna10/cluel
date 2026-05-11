from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models import AssistantOutput, Session
from app.schemas import AssistantRequest, AssistantResponseSchema
from app.services.context_service import build_context
from app.services.llm_service import LLMService
from app.services.settings_loader import load_settings_dict
from app.utils.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.post("/respond", response_model=AssistantResponseSchema)
async def get_assistant_response(
    body: AssistantRequest,
    db: DBSession = Depends(get_db),
) -> AssistantResponseSchema:
    session = db.query(Session).filter(Session.id == body.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    settings = load_settings_dict(db)
    privacy_mode = settings.get("privacy_mode", "false").lower() == "true"

    context = build_context(
        db=db,
        session_id=body.session_id,
        meeting_title=body.meeting_title or session.title,
        user_notes=body.user_notes,
        user_query=body.user_query,
        privacy_mode=privacy_mode,
    )

    provider = settings.get("llm_provider", "mock")
    api_key = settings.get("api_key", "")
    model_name = settings.get("model_name", "claude-sonnet-4-6")
    llm_base_url = settings.get("llm_base_url", "http://localhost:11434")
    local_only = settings.get("local_only_mode", "true").lower() == "true"

    if local_only and provider in ("claude", "openai"):
        logger.warning("local_only_mode is enabled; overriding provider to mock")
        provider = "mock"

    llm = LLMService(
        provider=provider,
        api_key=api_key,
        model_name=model_name,
        base_url=llm_base_url,
    )

    try:
        result = await llm.generate_response(context)
    except Exception as exc:
        logger.error("LLM error: %s", exc)
        raise HTTPException(status_code=502, detail=f"LLM error: {exc}")

    # Persist output
    output = AssistantOutput(
        session_id=body.session_id,
        suggested_response=result.get("suggested_response", ""),
        follow_up_question=result.get("follow_up_question", ""),
        meeting_recap=result.get("meeting_recap", ""),
        action_items=result.get("action_items", []),
        confidence=result.get("confidence", 0.0),
        safety_note=result.get("safety_note", ""),
    )
    db.add(output)
    db.commit()

    return AssistantResponseSchema(**result)
