# Basic smoke tests for the FastAPI app.
# Verifies that the app starts and key endpoints respond correctly.

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health():
    response =client.get("/api/v1/health")
    assert response.status_code==200
    assert response.json()=={"status":"ok"}

def test_root():
    response=client.get("/")
    assert response.status_code==200
    assert response.json()=={"message":"Portfolio Builder!"}
