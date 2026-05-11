from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models import AppSettings
from app.schemas import SettingsResponse, SettingsUpdate
from app.services.settings_loader import load_settings_dict
from app.utils.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)


def _upsert(db: DBSession, key: str, value: str) -> None:
    row = db.query(AppSettings).filter(AppSettings.key == key).first()
    if row:
        row.value = value
    else:
        db.add(AppSettings(key=key, value=value))


@router.get("", response_model=SettingsResponse)
def get_settings(db: DBSession = Depends(get_db)) -> SettingsResponse:
    s = load_settings_dict(db)
    return SettingsResponse(
        llm_provider=s.get("llm_provider", "mock"),
        api_key_set=bool(s.get("api_key", "")),
        model_name=s.get("model_name", "claude-sonnet-4-6"),
        llm_base_url=s.get("llm_base_url", "http://localhost:11434"),
        transcription_model_size=s.get("transcription_model_size", "base"),
        hotkey=s.get("hotkey", "CmdOrCtrl+Enter"),
        privacy_mode=s.get("privacy_mode", "false").lower() == "true",
        local_only_mode=s.get("local_only_mode", "true").lower() == "true",
    )


@router.post("", response_model=SettingsResponse)
def update_settings(
    body: SettingsUpdate, db: DBSession = Depends(get_db)
) -> SettingsResponse:
    updates: dict[str, str] = {}
    if body.llm_provider is not None:
        updates["llm_provider"] = body.llm_provider
    if body.api_key is not None:
        updates["api_key"] = body.api_key
    if body.model_name is not None:
        updates["model_name"] = body.model_name
    if body.llm_base_url is not None:
        updates["llm_base_url"] = body.llm_base_url
    if body.transcription_model_size is not None:
        updates["transcription_model_size"] = body.transcription_model_size
    if body.hotkey is not None:
        updates["hotkey"] = body.hotkey
    if body.privacy_mode is not None:
        updates["privacy_mode"] = str(body.privacy_mode).lower()
    if body.local_only_mode is not None:
        updates["local_only_mode"] = str(body.local_only_mode).lower()

    for k, v in updates.items():
        _upsert(db, k, v)
    db.commit()

    logger.info("Settings updated: %s", list(updates.keys()))
    return get_settings(db)
