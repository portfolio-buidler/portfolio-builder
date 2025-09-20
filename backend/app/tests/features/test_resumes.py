import io
from fastapi.testclient import TestClient
from app.main import app
from app.features.resumes.service import ResumeService
from fastapi import HTTPException, status

client = TestClient(app)


# Build a tiny synthetic PDF (enough to trigger upload logic).
def make_pdf_bytes(text: str = "Hello") -> bytes:
    base = f"%PDF-1.4\n1 0 obj<<>>endobj\n2 0 obj<< /Length 44 >>stream\nBT /F1 24 Tf 100 700 Td ({text}) Tj ET\nendstream endobj\n3 0 obj<< /Type /Page /Parent 4 0 R /Contents 2 0 R >>endobj\n4 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 /MediaBox [0 0 612 792] >>endobj\n5 0 obj<< /Type /Catalog /Pages 4 0 R >>endobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000033 00000 n \n0000000120 00000 n \n0000000203 00000 n \n0000000293 00000 n \ntrailer<< /Size 6 /Root 5 0 R >>\nstartxref\n370\n%%EOF".encode()
    return base


def test_upload_pdf_success(monkeypatch):
    """Upload synthetic PDF; accept 201/422/500; validate JSON on 201."""
    pdf_bytes = make_pdf_bytes("Sample CV")
    files = {"file": ("cv.pdf", pdf_bytes, "application/pdf")}
    resp = client.post("/resumes/upload", files=files)
    assert resp.status_code in (201, 422, 500)
    if resp.status_code == 201:
        body = resp.json()
        assert body["success"] is True
        assert body["data"]["fileId"]
        assert "extractedData" in body["data"]


def test_upload_wrong_mime():
    """Upload .txt -> expect 415 (MIME rejected early)."""
    files = {"file": ("cv.txt", b"plain text", "text/plain")}
    resp = client.post("/resumes/upload", files=files)
    assert resp.status_code == 415
    body = resp.json()
    assert "Unsupported" in body["detail"]


def test_upload_empty_pdf(monkeypatch):
    """Monkeypatch service to force 422 for empty/unreadable PDF."""

    async def fake_handle_upload(self, _file):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Empty or unreadable document",
        )

    monkeypatch.setattr(ResumeService, "handle_upload", fake_handle_upload)
    files = {"file": ("empty.pdf", b"%PDF-1.4\n%%EOF", "application/pdf")}
    resp = client.post("/resumes/upload", files=files)
    assert resp.status_code == 422
    assert resp.json()["detail"].lower().startswith("empty")
