import pytest
import asyncio

from app.services.llm_service import LLMService


@pytest.mark.asyncio
async def test_mock_provider_returns_all_fields():
    svc = LLMService(provider="mock")
    result = await svc.generate_response(
        {
            "meeting_title": "Test Meeting",
            "transcript": "Hello everyone, let's get started.",
            "ocr_text": "",
            "user_notes": "",
            "user_query": "",
        }
    )
    assert "suggested_response" in result
    assert "follow_up_question" in result
    assert "meeting_recap" in result
    assert "action_items" in result
    assert isinstance(result["action_items"], list)
    assert isinstance(result["confidence"], float)
    assert "safety_note" in result


@pytest.mark.asyncio
async def test_mock_confidence_in_range():
    svc = LLMService(provider="mock")
    result = await svc.generate_response({})
    assert 0.0 <= result["confidence"] <= 1.0


def test_session_create_and_respond(tmp_path):
    from fastapi.testclient import TestClient
    from app.main import app
    from app.config import config

    config.database_url = f"sqlite:///{tmp_path}/test.db"

    client = TestClient(app)
    sess = client.post("/sessions", json={"title": "Demo"}).json()
    session_id = sess["id"]

    resp = client.post(
        "/assistant/respond",
        json={
            "session_id": session_id,
            "meeting_title": "Demo",
            "user_notes": "",
            "user_query": "What should I say next?",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "suggested_response" in data
    assert "action_items" in data
