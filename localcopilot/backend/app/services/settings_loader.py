"""Load settings from DB with env-var fallback."""
from __future__ import annotations

from typing import Dict

from sqlalchemy.orm import Session as DBSession

from app.config import config
from app.models import AppSettings

_DEFAULTS: Dict[str, str] = {
    "llm_provider": config.llm_provider,
    "api_key": config.anthropic_api_key or config.openai_api_key,
    "model_name": config.model_name,
    "llm_base_url": config.llm_base_url,
    "transcription_model_size": config.transcription_model_size,
    "hotkey": config.hotkey,
    "privacy_mode": str(config.privacy_mode).lower(),
    "local_only_mode": str(config.local_only_mode).lower(),
}


def load_settings_dict(db: DBSession) -> Dict[str, str]:
    rows = db.query(AppSettings).all()
    result = dict(_DEFAULTS)
    for row in rows:
        if row.value is not None:
            result[row.key] = row.value
    return result
