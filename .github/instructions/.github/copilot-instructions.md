# Personal Copilot Instructions — Portfolio Builder (FastAPI + React)
## 0) Mission (what to optimize for)

Ship a **secure, boring-in-the-best-way** MVP: upload PDF/DOCX → parse to normalized JSON → preview/edit → template preview → export static site. Contracts-first, least-privilege, fast feedback.

---

## 2) Tech stack rules (updated)

- **Backend:** FastAPI + Uvicorn, Pydantic v2, SQLAlchemy 2.x async, Alembic. JSON I/O only. Swagger at `/docs`.
- **Frontend:** React + TypeScript + Vite, **Tailwind + SCSS architecture** (present in repo). Use SCSS only within existing system; do not introduce new CSS frameworks.
- **State:** Zustand.
- **Forms:** React Hook Form (preferred), Zod if schema validation needed client-side.
- **DB:** Postgres. Normalize first. JSONB allowed for parsed resume blob with Pydantic validation.
- **Containers:** docker-compose; separate `docker-compose.db.yml` exists.

---

## 1) Security guardrails (non-negotiable)

- **Uploads**: only PDF/DOCX. Validate MIME and magic bytes. Size + page limits. Parse in a **sandboxed, no-network** worker. Run AV scan hook where available.
- **Headers & CORS**: strict CSP (nonce/hash), X-Frame-Options `DENY`, X-Content-Type-Options `nosniff`, Referrer-Policy `strict-origin-when-cross-origin`, explicit CORS.
- **Auth**: short-lived JWT, refresh rotation, RBAC via dependencies, lockouts, optional CAPTCHA on sensitive routes.
- **DB**: least-privilege user, TLS to Postgres, Alembic-only schema changes, selective encryption for sensitive columns, scrub PII in logs.
- **Supply chain**: pip-audit/safety in CI, Bandit/Semgrep SAST, ZAP DAST on staging.

Copilot: when writing endpoints that accept files or free text, include validation and sanitization stubs. Prefer dependency-injected security checks over ad-hoc logic.

---
## 2) API contracts-first (what Copilot should generate by default)

For each route, produce:

1. **Pydantic v2 models**: `Request`, `Response`, `Error` with examples.
2. **FastAPI route**: status codes, tags, `responses=` with schemas, and docstrings.
3. **Service layer**: pure logic with type hints; no I/O in models.
4. **Tests**: pytest using `TestClient` for sync or httpx/async for async; AAA pattern.
5. **DB layer**: SQLAlchemy ORM or core with async, type hints, and transactions.
6. **E2E tests**: Playwright simulating user flows for critical paths.
7. **Frontend**: React components with TS types, Tailwind classes, Zustand state, and React Hook Form for forms.
8. **Docs**: update README and OpenAPI docs as needed.

Align with `backend/app/features/resumes/*` real files: `controller.py`, `service.py`, `upload_schemas.py`, `security.py`, `jsonb_models.py`.

---

## 5) Backend patterns

- **SQLAlchemy 2.0** with async sessions; `select(Model)`; keep transactions short.
- **Pydantic v2**: use `field_validator`/`field_serializer`; no legacy validators.
- **Errors**: shape via `app/core/errors.py` helpers; use `HTTPException` precisely.
- **Logging**: `app/core/logging.py` for structured JSON: `request_id`, `user_id`, `ip`, `path`, `latency`.
- **Parsing adapters**: pure functions in `features/adapters/{pdf,docx}`; cap node iterations; use defusedxml in DOCX reader; normalization in `features/parsing/*`.

---

## 6) Frontend patterns

- **Upload flow**: `src/features/UploadCV/` with `UplaodArea/` (legacy typo). When touching this folder, keep path stable but propose a **follow-up PR** to rename to `UploadArea/` with code-mod.
- **Styling**: Tailwind where quick; SCSS architecture already present under `styles/` (base, components, layout, mixins, tokens, utilities). Keep it consistent; don’t add new style systems.
- **HTTP**: `services/uploadService.ts`; central Axios instance with interceptors; handle 401/403 globally.
- **State**: `store/resumeStore.ts` via Zustand; keep stores small and per-feature.
- **Testing**: Vitest + RTL; Playwright E2E under `src/tests/e2e` and root `frontend/tests/e2e` compatibility.
- **Preview**: render `/preview/{id}` in an iframe with restrictive sandbox; never raw `innerHTML` without sanitization.

---

## 3) Tests and coverage

- **Backend**: pytest unit + integration under `app/tests/`; use factories/fixtures; include file upload tests with small synthetic PDFs/DOCX; assert headers and status codes.
- **Frontend**: Vitest + RTL unit tests for components and file validation; Playwright E2E for full happy path: upload → edit → template preview → export.

Copilot: default to AAA (Arrange, Act, Assert) and meaningful test names.

---

## 4) PR checklist (fail fast)

- [ ] Tests added/updated and passing locally
- [ ] Types pass (Py + TS)
- [ ] Lint passes (ruff/flake8, ESLint)
- [ ] Security: input validated, headers set, secrets not logged
- [ ] OpenAPI examples updated
- [ ] Alembic migration included if DB changed
- [ ] No new top-level folders; files placed per feature slice

---

## 5) Things Copilot must not do

- Suggest accepting file types other than PDF/DOCX
- Add libraries that change our stack without explicit approval
- Generate code that bypasses service layer or tests
- Store secrets in code or logs
- Use unsafe DOM APIs or raw HTML without sanitization

---

## 6) PR description template (auto-generate)

```
### What
Brief summary.

### Why
User story / acceptance criteria.

### How
Key changes, migrations, feature flags.

### Security
Input validation, headers, auth/RBAC, secrets handled.

### Tests
Unit/integration/E2E notes and coverage deltas.

### Screenshots / Swagger
Links or images.

### Checklist
- [ ] Tests pass
- [ ] Types/lint pass
- [ ] OpenAPI updated
- [ ] Migrations included (if any)
```

---

## 7) House rules for Copilot Chat prompts

When I ask for code:
- Assume the file location and create the right imports relative to the structure above.
- Output runnable snippets, not just fragments.
- Include minimal docs and examples in OpenAPI.
- Propose tests in the same message.

When I ask for reviews:
- Flag security issues, missing validation, or incorrect paths.
- Enforce Conventional Commits and our merge policy.

That’s it. If in doubt, prefer safety, tests, and simplicity.

