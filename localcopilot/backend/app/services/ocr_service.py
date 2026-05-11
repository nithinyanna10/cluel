"""OCR via EasyOCR, with mock fallback."""
from __future__ import annotations

import asyncio
from typing import Any, List

from app.utils.logging import get_logger

logger = get_logger(__name__)


class OcrService:
    _reader: Any = None

    def _load_reader(self) -> bool:
        if self._reader:
            return True
        try:
            import easyocr  # type: ignore

            logger.info("Initialising EasyOCR reader (first run downloads models ~200 MB)")
            self._reader = easyocr.Reader(["en"], gpu=False, verbose=False)
            logger.info("EasyOCR ready")
            return True
        except ImportError:
            logger.warning("easyocr not installed — using mock OCR")
            return False

    async def extract_text(self, image_path: str) -> str:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._extract_sync, image_path)

    def _extract_sync(self, image_path: str) -> str:
        if not self._load_reader():
            return self._mock_text(image_path)
        try:
            results: List[Any] = self._reader.readtext(image_path)
            lines = [item[1] for item in results if item[2] > 0.3]
            return "\n".join(lines)
        except Exception as exc:
            logger.error("OCR error for %s: %s", image_path, exc)
            raise

    @staticmethod
    def _mock_text(image_path: str) -> str:
        return (
            "[Mock OCR] Image received but EasyOCR is not installed. "
            "Install it with: pip install easyocr\n"
            f"File: {image_path}"
        )
