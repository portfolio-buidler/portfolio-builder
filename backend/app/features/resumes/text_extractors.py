"""Deprecated: use adapters.pdf.reader.read_pdf_text and adapters.docx.reader.read_docx_text.

This module re-exports the new functions for backward compatibility.
"""
from pathlib import Path
from app.features.adapters.pdf.reader import read_pdf_text as extract_text_from_pdf
from app.features.adapters.docx.reader import read_docx_text as extract_text_from_docx

