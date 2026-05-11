"""LLM service with support for Claude, OpenAI-compatible, Ollama, and mock providers."""
from __future__ import annotations

import json
import textwrap
from typing import Any, Dict

import httpx

from app.utils.logging import get_logger

logger = get_logger(__name__)

SYSTEM_PROMPT = textwrap.dedent("""\
    You are LocalCopilot, an ethical meeting productivity assistant.
    Your role is to help the user understand meetings, summarise discussions,
    suggest professional responses, and track action items.

    Rules you MUST follow:
    - Never fabricate facts or invent information not present in the context.
    - Never assist with cheating, deception, stealth monitoring, or bypassing any rules.
    - If context is insufficient, explicitly say what is missing.
    - Keep responses concise and actionable.
    - Always respond with valid JSON matching the schema below — nothing else.

    Required JSON schema:
    {
      "suggested_response": "<professional response the user could give>",
      "follow_up_question": "<useful follow-up question to ask>",
      "meeting_recap": "<2-3 sentence summary of discussion so far>",
      "action_items": ["<action 1>", "<action 2>"],
      "confidence": <float 0.0-1.0>,
      "safety_note": "<any caveats or ethical flags, empty string if none>"
    }
""")


def _build_user_prompt(context: Dict[str, Any]) -> str:
    return textwrap.dedent(f"""\
        Meeting title: {context.get("meeting_title", "Untitled")}

        Recent transcript:
        {context.get("transcript", "(no transcript yet)")}

        Screen OCR text:
        {context.get("ocr_text", "(no screen capture)")}

        User notes:
        {context.get("user_notes", "(none)")}

        User query:
        {context.get("user_query", "(no specific query)")}

        Respond with the JSON schema only.
    """)


def _safe_parse(text: str) -> Dict[str, Any]:
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return json.loads(text)


_MOCK_RESPONSE: Dict[str, Any] = {
    "suggested_response": (
        "Thank you for sharing that. I'd like to follow up on a few points to make sure "
        "we're aligned before moving forward."
    ),
    "follow_up_question": "Could you clarify the timeline and success criteria for this initiative?",
    "meeting_recap": (
        "The team is currently in a discussion about upcoming priorities. "
        "Key topics include timeline, resource allocation, and stakeholder alignment. "
        "No specific decisions have been recorded yet."
    ),
    "action_items": [
        "Configure an LLM provider in Settings to enable real AI responses.",
        "Start recording to capture audio and build a rolling transcript.",
        "Use Cmd+Shift+S to capture a screenshot for OCR context.",
    ],
    "confidence": 0.5,
    "safety_note": (
        "Running in mock mode — no AI provider is configured. "
        "Open Settings and choose Claude, OpenAI, or Ollama."
    ),
}


class LLMService:
    def __init__(
        self,
        provider: str = "mock",
        api_key: str = "",
        model_name: str = "claude-sonnet-4-6",
        base_url: str = "http://localhost:11434",
    ) -> None:
        self.provider = provider
        self.api_key = api_key
        self.model_name = model_name
        self.base_url = base_url.rstrip("/")

    async def generate_response(self, context: Dict[str, Any]) -> Dict[str, Any]:
        logger.info("LLM generate_response via provider=%s", self.provider)
        if self.provider == "claude":
            return await self._call_claude(context)
        if self.provider in ("openai", "openai_compatible"):
            return await self._call_openai(context)
        if self.provider == "ollama":
            return await self._call_ollama(context)
        return dict(_MOCK_RESPONSE)

    # ── Claude ────────────────────────────────────────────────────────────────

    async def _call_claude(self, context: Dict[str, Any]) -> Dict[str, Any]:
        try:
            import anthropic
        except ImportError as exc:
            raise RuntimeError("Install anthropic: pip install anthropic") from exc

        client = anthropic.Anthropic(api_key=self.api_key)
        message = client.messages.create(
            model=self.model_name,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": _build_user_prompt(context)}],
        )
        return _safe_parse(message.content[0].text)

    # ── OpenAI-compatible ─────────────────────────────────────────────────────

    async def _call_openai(self, context: Dict[str, Any]) -> Dict[str, Any]:
        try:
            import openai
        except ImportError as exc:
            raise RuntimeError("Install openai: pip install openai") from exc

        client = openai.AsyncOpenAI(
            api_key=self.api_key or "local",
            base_url=self.base_url if self.base_url != "http://localhost:11434" else None,
        )
        resp = await client.chat.completions.create(
            model=self.model_name,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": _build_user_prompt(context)},
            ],
            response_format={"type": "json_object"},
            max_tokens=1024,
        )
        return json.loads(resp.choices[0].message.content or "{}")

    # ── Ollama ────────────────────────────────────────────────────────────────

    async def _call_ollama(self, context: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": _build_user_prompt(context)},
            ],
            "format": "json",
            "stream": False,
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
        return _safe_parse(data["message"]["content"])
