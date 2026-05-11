import pytest
from app.utils.privacy import redact_secrets, contains_secrets


def test_redact_openai_key():
    text = "Key is sk-abcdefghijklmnopqrstuvwxyz123456"
    out = redact_secrets(text)
    assert "sk-abcdefghijklmnopqrstuvwxyz123456" not in out
    assert "REDACTED" in out


def test_redact_anthropic_key():
    text = "Token: sk-ant-api03-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefgh"
    out = redact_secrets(text)
    assert "sk-ant" not in out


def test_redact_credit_card():
    text = "Card: 4532 1234 5678 9012 expiry 12/25"
    out = redact_secrets(text)
    assert "4532 1234 5678 9012" not in out


def test_redact_ssn():
    text = "SSN: 123-45-6789"
    out = redact_secrets(text)
    assert "123-45-6789" not in out


def test_redact_bearer_token():
    text = "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.payload"
    out = redact_secrets(text)
    assert "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9" not in out


def test_clean_text_unchanged():
    text = "Please review the Q3 roadmap and align on the launch date."
    assert redact_secrets(text) == text


def test_contains_secrets_true():
    assert contains_secrets("sk-abcdefghijklmnopqrstuvwxyz123456")


def test_contains_secrets_false():
    assert not contains_secrets("Hello, world!")


def test_redact_password():
    text = "password: mysupersecret123"
    out = redact_secrets(text)
    assert "mysupersecret123" not in out
