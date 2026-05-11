from __future__ import annotations

from typing import Literal
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppConfig(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Server
    host: str = "127.0.0.1"
    port: int = 8787

    # Database
    database_url: str = "sqlite:///./localcopilot.db"

    # LLM
    llm_provider: Literal["claude", "openai", "ollama", "mock"] = "mock"
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    model_name: str = "claude-sonnet-4-6"
    llm_base_url: str = "http://localhost:11434"

    # Transcription
    transcription_model_size: str = "base"

    # Privacy
    privacy_mode: bool = False
    local_only_mode: bool = True

    # Hotkey
    hotkey: str = "CmdOrCtrl+Enter"


config = AppConfig()
