from __future__ import annotations

import logging
import zipfile
from pathlib import Path
from typing import Final

from fastapi import HTTPException, status

# Security logger for audit trail of rejected uploads
security_logger = logging.getLogger("security.file_validation")

# Signatures
PDF_MAGIC: Final[bytes] = b"%PDF"
DOCX_MAGIC_ZIP: Final[bytes] = b"PK\x03\x04"  # DOCX is a ZIP

SUPPORTED_MIME: Final[set[str]] = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
ALLOWED_EXTENSIONS: Final[set[str]] = {".pdf", ".docx"}

# Known malicious/executable extensions for double-extension attack detection
MALICIOUS_EXTENSIONS: Final[set[str]] = {
    ".exe", ".php", ".sh", ".bat", ".js", ".vbs", ".cmd", ".ps1", ".pif", ".scr"
}


def verify_extension(filename: str) -> str:
    """
    Validates the file extension and checks for double extensions.
    Returns the sanitized extension (e.g., '.pdf').
    Raises HTTP 415 if extension is not allowed or double-extension attack detected.
    """
    if not filename or "." not in filename:
        security_logger.warning(f"REJECTED: File has no extension - {filename}")
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="File name has no extension",
        )

    parts = filename.lower().split(".")
    ext = f".{parts[-1]}"

    if ext not in ALLOWED_EXTENSIONS:
        security_logger.warning(f"REJECTED: Unsupported extension '{ext}' - {filename}")
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file extension: {ext}",
        )

    # Double extension check (e.g., script.php.pdf, malware.exe.docx)
    if len(parts) > 2:
        for part in parts[1:-1]:  # Check all parts except first (name) and last (valid ext)
            potential_ext = f".{part}"
            if potential_ext in MALICIOUS_EXTENSIONS:
                security_logger.warning(
                    f"REJECTED: Double extension attack detected '{potential_ext}' in - {filename}"
                )
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail="Potential double-extension detected, file rejected",
                )

    return ext


def verify_magic_bytes(header: bytes, content_type: str, filename: str = "unknown") -> None:
    """
    Verifies the file's magic bytes match the claimed content type.
    Raises HTTP 415 for unsupported MIME, HTTP 422 for signature mismatch.
    """
    if content_type not in SUPPORTED_MIME:
        security_logger.warning(f"REJECTED: Unsupported MIME '{content_type}' - {filename}")
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported content type: {content_type or '(missing)'}",
        )

    if len(header) < 4:
        security_logger.warning(f"REJECTED: File too small for signature check - {filename}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="File content too short to verify type",
        )

    if content_type == "application/pdf":
        if not header.startswith(PDF_MAGIC):
            security_logger.warning(f"REJECTED: PDF magic bytes mismatch - {filename}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Invalid PDF signature - file may be corrupted or mislabeled",
            )
    else:
        if not header.startswith(DOCX_MAGIC_ZIP):
            security_logger.warning(f"REJECTED: DOCX magic bytes mismatch - {filename}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Invalid DOCX signature - file may be corrupted or mislabeled",
            )


def check_docx_for_macros(file_path: Path, filename: str = "unknown") -> None:
    """
    Checks a DOCX file for embedded macros (VBA projects).
    Macro-enabled documents are rejected as a security risk.
    Raises HTTP 422 if macros are detected or file is corrupted.
    """
    if not str(file_path).lower().endswith(".docx"):
        return

    try:
        with zipfile.ZipFile(file_path, "r") as zf:
            # Check for macro indicators in DOCX (Office Open XML)
            macro_indicators = [
                "word/vbaProject.bin",  # VBA macro binary
                "word/vbaData.xml",     # VBA data
                "xl/vbaProject.bin",    # Excel macros (shouldn't be in DOCX but check anyway)
            ]
            
            file_list = zf.namelist()
            for indicator in macro_indicators:
                if indicator in file_list:
                    security_logger.warning(
                        f"REJECTED: Macro-enabled DOCX detected (found {indicator}) - {filename}"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                        detail="Macro-enabled documents are not allowed for security reasons",
                    )

    except zipfile.BadZipFile:
        security_logger.warning(f"REJECTED: Invalid DOCX (corrupted ZIP) - {filename}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="File is corrupted or not a valid DOCX document",
        )
    except HTTPException:
        raise
    except Exception as e:
        security_logger.error(f"REJECTED: Error checking DOCX for macros - {filename}: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Failed to validate document structure",
        )


def check_docx_for_encryption(file_path: Path, filename: str = "unknown") -> None:
    """
    Checks if a DOCX file is password-protected/encrypted.
    Encrypted documents cannot be processed and are rejected.
    Raises HTTP 422 if encryption is detected.
    """
    if not str(file_path).lower().endswith(".docx"):
        return

    try:
        with zipfile.ZipFile(file_path, "r") as zf:
            file_list = zf.namelist()
            
            # Check 1: Encrypted DOCX has EncryptedPackage instead of normal structure
            if "EncryptedPackage" in file_list:
                security_logger.warning(f"REJECTED: Encrypted DOCX detected - {filename}")
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail="Password-protected documents are not allowed",
                )
            
            # Check 2: Missing standard DOCX structure might indicate encryption
            # A valid DOCX must have [Content_Types].xml
            if "[Content_Types].xml" not in file_list:
                security_logger.warning(
                    f"REJECTED: Invalid DOCX structure (possibly encrypted) - {filename}"
                )
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail="Document structure invalid - possibly encrypted or corrupted",
                )

    except zipfile.BadZipFile:
        # Already handled in check_docx_for_macros, skip here
        pass
    except HTTPException:
        raise
    except Exception as e:
        security_logger.error(
            f"REJECTED: Error checking DOCX for encryption - {filename}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Failed to validate document encryption status",
        )
