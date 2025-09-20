# Basic smoke tests for the FastAPI app.
# Verifies that the app starts and key endpoints respond correctly.

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "portfolio-builder"
