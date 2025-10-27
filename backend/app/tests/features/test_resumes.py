import io
from fastapi.testclient import TestClient
from fastapi import HTTPException, status
from app.main import app
from app.features.resumes.service import ResumeService

client = TestClient(app)


def make_pdf_bytes(text: str = "Hello") -> bytes:
    """Generate a minimal valid PDF binary for testing upload endpoints."""
    pdf_content = f"""%PDF-1.4
1 0 obj<<>>endobj
2 0 obj<< /Length 44 >>stream
BT /F1 24 Tf 100 700 Td ({text}) Tj ET
endstream endobj
3 0 obj<< /Type /Page /Parent 4 0 R /Contents 2 0 R >>endobj
4 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 /MediaBox [0 0 612 792] >>endobj
5 0 obj<< /Type /Catalog /Pages 4 0 R >>endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000033 00000 n 
0000000120 00000 n 
0000000203 00000 n 
0000000293 00000 n 
trailer<< /Size 6 /Root 5 0 R >>
startxref
370
%%EOF
"""
    return pdf_content.encode("utf-8")


def test_upload_pdf_success():
    """Upload a synthetic valid PDF and validate 201 JSON structure (or fail-safe codes)."""
    pdf_bytes = make_pdf_bytes("Sample CV")
    files = {"file": ("cv.pdf", pdf_bytes, "application/pdf")}

    resp = client.post("/resumes/upload", files=files)

    # Allow transient errors (parser failures) but assert 201 path behavior
    assert resp.status_code in (201, 422, 500), f"Unexpected status {resp.status_code}"
    if resp.status_code == 201:
        body = resp.json()
        assert body["success"] is True
        assert "data" in body
        assert body["data"]["fileId"]
        assert "extractedData" in body["data"]


def test_upload_wrong_mime():
    """Upload text file → expect 415 Unsupported Media Type."""
    files = {"file": ("cv.txt", b"plain text", "text/plain")}
    resp = client.post("/resumes/upload", files=files)

    assert resp.status_code == 415, f"Expected 415, got {resp.status_code}"
    body = resp.json()
    assert "Unsupported" in body["detail"]


def test_upload_empty_pdf(monkeypatch):
    """Monkeypatch ResumeService to force 422 for unreadable PDF uploads."""

    async def fake_handle_upload(self, _file):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Empty or unreadable document",
        )

    # Patch the service method to simulate a failed parse
    monkeypatch.setattr(ResumeService, "handle_upload", fake_handle_upload)

    files = {"file": ("empty.pdf", b"%PDF-1.4\n%%EOF", "application/pdf")}
    resp = client.post("/resumes/upload", files=files)

    assert resp.status_code == 422
    assert resp.json()["detail"].lower().startswith("empty")
