"""Speech-to-text via faster-whisper, with mock fallback."""
from __future__ import annotations

import asyncio
from typing import Any, Dict, List

from app.config import config
from app.utils.logging import get_logger

logger = get_logger(__name__)


class TranscriptionService:
    _model: Any = None
    _model_size: str = ""

    def _load_model(self) -> bool:
        model_size = config.transcription_model_size
        if self._model and self._model_size == model_size:
            return True
        try:
            from faster_whisper import WhisperModel  # type: ignore

            logger.info("Loading faster-whisper model: %s", model_size)
            self._model = WhisperModel(model_size, device="cpu", compute_type="int8")
            self._model_size = model_size
            logger.info("faster-whisper model loaded")
            return True
        except ImportError:
            logger.warning("faster-whisper not installed — using mock transcription")
            return False

    async def transcribe(self, audio_path: str) -> Dict[str, Any]:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._transcribe_sync, audio_path)

    def _transcribe_sync(self, audio_path: str) -> Dict[str, Any]:
        if not self._load_model():
            return self._mock_result(audio_path)

        try:
            segments_gen, info = self._model.transcribe(audio_path, beam_size=5)
            segments: List[Dict[str, Any]] = []
            full_text_parts: List[str] = []

            for seg in segments_gen:
                segments.append(
                    {"text": seg.text.strip(), "start": seg.start, "end": seg.end}
                )
                full_text_parts.append(seg.text.strip())

            return {
                "text": " ".join(full_text_parts),
                "chunks": segments,
                "language": info.language,
                "start_time": segments[0]["start"] if segments else None,
                "end_time": segments[-1]["end"] if segments else None,
            }
        except Exception as exc:
            logger.error("Transcription error: %s", exc)
            raise

    @staticmethod
    def _mock_result(audio_path: str) -> Dict[str, Any]:
        return {
            "text": "[Mock transcript] Audio received but faster-whisper is not installed. "
                    "Install it with: pip install faster-whisper",
            "chunks": [],
            "language": "en",
            "start_time": 0.0,
            "end_time": 5.0,
        }
