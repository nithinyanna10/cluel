"""Redact secrets from text before sending to LLM providers."""
from __future__ import annotations

import re
from typing import List, Tuple

# Each tuple: (label, compiled_regex)
_PATTERNS: List[Tuple[str, re.Pattern[str]]] = [
    # Generic key=value or key: value patterns
    (
        "API_KEY",
        re.compile(
            r"(?:api[_\-]?key|apikey|secret[_\-]?key)\s*[:=]\s*['\"]?([A-Za-z0-9_\-\.]{16,})['\"]?",
            re.IGNORECASE,
        ),
    ),
    # Anthropic / OpenAI style keys
    (
        "SK_KEY",
        re.compile(r"\bsk-[A-Za-z0-9]{32,}\b"),
    ),
    (
        "ANTHROPIC_KEY",
        re.compile(r"\bsk-ant-[A-Za-z0-9_\-]{32,}\b"),
    ),
    # Bearer tokens
    (
        "BEARER_TOKEN",
        re.compile(r"Bearer\s+[A-Za-z0-9_\-\.]{20,}", re.IGNORECASE),
    ),
    # Passwords
    (
        "PASSWORD",
        re.compile(
            r"(?:password|passwd|pwd)\s*[:=]\s*['\"]?(\S{6,})['\"]?",
            re.IGNORECASE,
        ),
    ),
    # Credit card (Luhn-ish: 13-19 digits with optional spaces/dashes)
    (
        "CREDIT_CARD",
        re.compile(r"\b(?:\d[ \-]?){13,18}\d\b"),
    ),
    # US SSN
    (
        "SSN",
        re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
    ),
    # AWS access key
    (
        "AWS_KEY",
        re.compile(r"\b(?:AKIA|ASIA|AROA|ANPA|ANVA|AIDA)[A-Z0-9]{16}\b"),
    ),
    # GitHub personal access token
    (
        "GH_TOKEN",
        re.compile(r"\bgh[pousr]_[A-Za-z0-9]{36,}\b"),
    ),
]


def redact_secrets(text: str) -> str:
    for label, pattern in _PATTERNS:
        text = pattern.sub(f"[REDACTED:{label}]", text)
    return text


def contains_secrets(text: str) -> bool:
    return any(p.search(text) for _, p in _PATTERNS)
