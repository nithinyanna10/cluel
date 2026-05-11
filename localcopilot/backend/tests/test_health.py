import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_ok():
    resp = client.get("/health")
    assert resp.status_code == 200


def test_health_schema():
    data = client.get("/health").json()
    assert data["status"] == "ok"
    assert "version" in data
    assert isinstance(data["services"], dict)


def test_health_services_keys():
    data = client.get("/health").json()
    assert "faster_whisper" in data["services"]
    assert "easyocr" in data["services"]
