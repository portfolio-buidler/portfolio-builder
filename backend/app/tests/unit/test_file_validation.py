"""
Unit tests for file validation security module.
Tests cover:
- Extension validation (with double-extension detection)
- Magic byte validation
- DOCX macro detection
- Size enforcement (via service integration)
"""

import io
import tempfile
import zipfile
from pathlib import Path

import pytest
from fastapi import HTTPException

from app.features.resumes.security import (
    verify_extension,
    verify_magic_bytes,
    check_docx_for_macros,
    check_docx_for_encryption,
    ALLOWED_EXTENSIONS,
    MALICIOUS_EXTENSIONS,
    PDF_MAGIC,
    DOCX_MAGIC_ZIP,
)


# =============================================================================
# EXTENSION VALIDATION TESTS (6 tests)
# =============================================================================


class TestVerifyExtension:
    """Tests for verify_extension() function."""

    def test_valid_pdf_extension(self):
        """Should accept .pdf extension and return it."""
        result = verify_extension("resume.pdf")
        assert result == ".pdf"

    def test_valid_docx_extension(self):
        """Should accept .docx extension and return it."""
        result = verify_extension("resume.docx")
        assert result == ".docx"

    def test_valid_extension_case_insensitive(self):
        """Should accept uppercase extensions."""
        result = verify_extension("RESUME.PDF")
        assert result == ".pdf"
        
        result = verify_extension("Resume.DOCX")
        assert result == ".docx"

    def test_reject_unsupported_extension(self):
        """Should reject unsupported file types with 415."""
        with pytest.raises(HTTPException) as exc_info:
            verify_extension("document.txt")
        assert exc_info.value.status_code == 415
        assert "Unsupported file extension" in exc_info.value.detail

    def test_reject_no_extension(self):
        """Should reject files without extension with 415."""
        with pytest.raises(HTTPException) as exc_info:
            verify_extension("resume")
        assert exc_info.value.status_code == 415
        assert "no extension" in exc_info.value.detail.lower()

    def test_reject_empty_filename(self):
        """Should reject empty filename with 415."""
        with pytest.raises(HTTPException) as exc_info:
            verify_extension("")
        assert exc_info.value.status_code == 415


class TestDoubleExtensionDetection:
    """Tests for double-extension attack prevention."""

    def test_reject_php_pdf_double_extension(self):
        """Should reject .php.pdf double extension attack."""
        with pytest.raises(HTTPException) as exc_info:
            verify_extension("malware.php.pdf")
        assert exc_info.value.status_code == 415
        assert "double-extension" in exc_info.value.detail.lower()

    def test_reject_exe_docx_double_extension(self):
        """Should reject .exe.docx double extension attack."""
        with pytest.raises(HTTPException) as exc_info:
            verify_extension("virus.exe.docx")
        assert exc_info.value.status_code == 415
        assert "double-extension" in exc_info.value.detail.lower()

    def test_reject_sh_pdf_double_extension(self):
        """Should reject .sh.pdf double extension attack."""
        with pytest.raises(HTTPException) as exc_info:
            verify_extension("script.sh.pdf")
        assert exc_info.value.status_code == 415

    def test_reject_bat_docx_double_extension(self):
        """Should reject .bat.docx double extension attack."""
        with pytest.raises(HTTPException) as exc_info:
            verify_extension("script.bat.docx")
        assert exc_info.value.status_code == 415

    def test_accept_multiple_dots_safe(self):
        """Should accept safe multi-dot filenames like 'my.resume.v2.pdf'."""
        # This should pass - dots in name but no malicious extensions
        result = verify_extension("my.resume.v2.pdf")
        assert result == ".pdf"

    def test_accept_dotted_name_docx(self):
        """Should accept safe filenames with dots like 'john.doe.cv.docx'."""
        result = verify_extension("john.doe.cv.docx")
        assert result == ".docx"


# =============================================================================
# MAGIC BYTE VALIDATION TESTS (4 tests)
# =============================================================================


class TestVerifyMagicBytes:
    """Tests for verify_magic_bytes() function."""

    def test_valid_pdf_magic_bytes(self):
        """Should accept valid PDF signature."""
        header = PDF_MAGIC + b"-1.4\n"
        # Should not raise
        verify_magic_bytes(header, "application/pdf", "test.pdf")

    def test_valid_docx_magic_bytes(self):
        """Should accept valid DOCX (ZIP) signature."""
        header = DOCX_MAGIC_ZIP + b"\x14\x00\x06\x00"
        # Should not raise
        verify_magic_bytes(
            header,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "test.docx",
        )

    def test_reject_invalid_pdf_signature(self):
        """Should reject PDF with invalid magic bytes with 422."""
        header = b"NOTPDF\x00\x00"
        with pytest.raises(HTTPException) as exc_info:
            verify_magic_bytes(header, "application/pdf", "fake.pdf")
        assert exc_info.value.status_code == 422
        assert "signature" in exc_info.value.detail.lower()

    def test_reject_invalid_docx_signature(self):
        """Should reject DOCX with invalid magic bytes with 422."""
        header = b"NOTZIP\x00\x00"
        with pytest.raises(HTTPException) as exc_info:
            verify_magic_bytes(
                header,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "fake.docx",
            )
        assert exc_info.value.status_code == 422
        assert "signature" in exc_info.value.detail.lower()

    def test_reject_unsupported_mime_type(self):
        """Should reject unsupported MIME type with 415."""
        with pytest.raises(HTTPException) as exc_info:
            verify_magic_bytes(b"anything", "text/plain", "file.txt")
        assert exc_info.value.status_code == 415

    def test_reject_too_short_header(self):
        """Should reject files with header too short to verify."""
        with pytest.raises(HTTPException) as exc_info:
            verify_magic_bytes(b"PD", "application/pdf", "short.pdf")
        assert exc_info.value.status_code == 422
        assert "too short" in exc_info.value.detail.lower()


# =============================================================================
# DOCX MACRO DETECTION TESTS (4 tests)
# =============================================================================


class TestCheckDocxForMacros:
    """Tests for check_docx_for_macros() function."""

    def test_accept_clean_docx(self):
        """Should accept DOCX without macros."""
        # Create a minimal valid DOCX (it's a ZIP file)
        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as f:
            with zipfile.ZipFile(f, "w") as zf:
                # Minimal DOCX structure
                zf.writestr("[Content_Types].xml", '<?xml version="1.0"?><Types></Types>')
                zf.writestr("word/document.xml", '<?xml version="1.0"?><document></document>')
            temp_path = Path(f.name)

        try:
            # Should not raise
            check_docx_for_macros(temp_path, "clean.docx")
        finally:
            temp_path.unlink(missing_ok=True)

    def test_reject_docx_with_vba_project(self):
        """Should reject DOCX containing word/vbaProject.bin (macro)."""
        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as f:
            with zipfile.ZipFile(f, "w") as zf:
                zf.writestr("[Content_Types].xml", '<?xml version="1.0"?><Types></Types>')
                zf.writestr("word/document.xml", '<?xml version="1.0"?><document></document>')
                # This is the macro indicator
                zf.writestr("word/vbaProject.bin", b"\x00\x01\x02\x03")
            temp_path = Path(f.name)

        try:
            with pytest.raises(HTTPException) as exc_info:
                check_docx_for_macros(temp_path, "macro.docx")
            assert exc_info.value.status_code == 422
            assert "macro" in exc_info.value.detail.lower()
        finally:
            temp_path.unlink(missing_ok=True)

    def test_reject_corrupted_docx(self):
        """Should reject corrupted DOCX (invalid ZIP) with 422."""
        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as f:
            f.write(b"This is not a valid ZIP file content")
            temp_path = Path(f.name)

        try:
            with pytest.raises(HTTPException) as exc_info:
                check_docx_for_macros(temp_path, "corrupted.docx")
            assert exc_info.value.status_code == 422
            assert "corrupted" in exc_info.value.detail.lower() or "valid" in exc_info.value.detail.lower()
        finally:
            temp_path.unlink(missing_ok=True)

    def test_skip_non_docx_files(self):
        """Should skip macro check for non-DOCX files."""
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            f.write(b"%PDF-1.4 content here")
            temp_path = Path(f.name)

        try:
            # Should not raise - function should skip for non-DOCX
            check_docx_for_macros(temp_path, "document.pdf")
        finally:
            temp_path.unlink(missing_ok=True)


# =============================================================================
# DOCX ENCRYPTION DETECTION TESTS (3 tests)
# =============================================================================


class TestCheckDocxForEncryption:
    """Tests for check_docx_for_encryption() function."""

    def test_reject_encrypted_docx(self):
        """Should reject DOCX with EncryptedPackage (password-protected)."""
        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as f:
            with zipfile.ZipFile(f, "w") as zf:
                # Encrypted DOCX structure
                zf.writestr("EncryptedPackage", b"\x00\x01\x02\x03encrypted_content")
            temp_path = Path(f.name)

        try:
            with pytest.raises(HTTPException) as exc_info:
                check_docx_for_encryption(temp_path, "encrypted.docx")
            assert exc_info.value.status_code == 422
            assert "password" in exc_info.value.detail.lower() or "protected" in exc_info.value.detail.lower()
        finally:
            temp_path.unlink(missing_ok=True)

    def test_reject_missing_content_types(self):
        """Should reject DOCX missing [Content_Types].xml (invalid/encrypted structure)."""
        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as f:
            with zipfile.ZipFile(f, "w") as zf:
                # Missing [Content_Types].xml - invalid DOCX structure
                zf.writestr("word/document.xml", '<?xml version="1.0"?><document></document>')
            temp_path = Path(f.name)

        try:
            with pytest.raises(HTTPException) as exc_info:
                check_docx_for_encryption(temp_path, "invalid_structure.docx")
            assert exc_info.value.status_code == 422
            assert "invalid" in exc_info.value.detail.lower() or "encrypted" in exc_info.value.detail.lower()
        finally:
            temp_path.unlink(missing_ok=True)

    def test_accept_normal_docx(self):
        """Should accept valid unencrypted DOCX with proper structure."""
        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as f:
            with zipfile.ZipFile(f, "w") as zf:
                # Valid DOCX structure
                zf.writestr("[Content_Types].xml", '<?xml version="1.0"?><Types></Types>')
                zf.writestr("word/document.xml", '<?xml version="1.0"?><document></document>')
            temp_path = Path(f.name)

        try:
            # Should not raise
            check_docx_for_encryption(temp_path, "valid.docx")
        finally:
            temp_path.unlink(missing_ok=True)


# =============================================================================
# INTEGRATION / EDGE CASE TESTS (3 tests)
# =============================================================================


class TestEdgeCases:
    """Edge case and integration tests."""

    def test_all_malicious_extensions_covered(self):
        """Verify all known malicious extensions are in the blocklist."""
        expected_malicious = {".exe", ".php", ".sh", ".bat", ".js", ".vbs"}
        assert expected_malicious.issubset(MALICIOUS_EXTENSIONS)

    def test_allowed_extensions_are_safe(self):
        """Verify only PDF and DOCX are allowed."""
        assert ALLOWED_EXTENSIONS == {".pdf", ".docx"}

    def test_magic_bytes_constants_correct(self):
        """Verify magic byte constants are correct."""
        assert PDF_MAGIC == b"%PDF"
        assert DOCX_MAGIC_ZIP == b"PK\x03\x04"


    def test_special_characters_in_filename(self):
        """Should handle special characters in filenames."""
        result = verify_extension("resume (2) - copy.pdf")
        assert result == ".pdf"
        
        result = verify_extension("John's CV [2024].docx")
        assert result == ".docx"

