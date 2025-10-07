Resumes feature (slim)

This folder is intentionally thin and focused on API orchestration:

- controller.py, routes.py: FastAPI wiring
- service.py: orchestrates document reading and parsing
- schemas.py, jsonb_models.py, security.py: request/response models and validation

Where the logic lives now

- Document adapters: app/features/adapters/
  - pdf/reader.py -> read_pdf_text(Path) -> str
  - docx/reader.py -> read_docx_text(Path) -> str
- Parsing pipeline: app/features/parsing/
  - normalizers.py: text normalization
  - sections.py: section splitting
  - contact.py: email/phone and name heuristics
  - education.py: structured education extraction
  - skills.py: curated skills detection
  - parser_core.py: orchestrator returning ResumeParsedJSON

Deprecated modules

- cv_parser.py, text_extractors.py are Deleted

Rationale

This separation improves readability, testability, and maintainability. Adapters handle I/O and formats; parsing handles text-to-JSON logic; resumes layer stays a thin boundary.
