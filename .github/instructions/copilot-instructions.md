---
description: 'Portfolio Builder - Master instruction file for AI assistants and developers'
applyTo: '**/*'
---

# GitHub Copilot Instructions — Portfolio Builder

> **Version**: 4.0  
> **Last Updated**: November 2025  
> **Maintained By**: Amir (Team Lead), Israel, Ido, Yarin (Backend), Netanel (Frontend), Yarin (DevOps)

---

## 🎯 Mission Statement

Build a **secure, production-ready MVP** that transforms CVs into professional portfolio websites with AI-powered parsing, structured data validation, and static site generation.

**Input** → CV upload (PDF/DOCX)  
**Process** → AI parsing → JSON validation → Preview/edit  
**Output** → Template selection → Static portfolio export

---

## 🚨 CRITICAL: Instruction File Access Protocol

**All AI assistants and developers MUST follow this protocol before generating any code:**

### Mandatory Pre-Code Review Process

Before writing **any code**, AI assistants MUST:

1. **Identify the task domain** (backend/frontend/database/deployment)
2. **Read the relevant instruction files** (see mappings below)
3. **Check current sprint tasks** (see Sprint Tasks section)
4. **Apply patterns from instruction files** to all generated code
5. **Cross-reference architecture decisions** in ARCHITECTURE.md

### Instruction File Mappings

| Task Domain | Required Reading | File Path |
|-------------|-----------------|-----------|
| **Backend Development** | Backend instructions + Architecture | `.github/instructions/backend.instructions.md`<br>`.github/instructions/ARCHITECTURE.md` |
| **Frontend Development** | Frontend instructions + Architecture | `.github/instructions/frontend.instructions.md`<br>`.github/instructions/ARCHITECTURE.md` |
| **Python Code** | Python conventions + Backend instructions | `.github/instructions/python.instructions.md`<br>`.github/instructions/backend.instructions.md` |
| **Quick Reference** | Development guide | `.github/instructions/DEVELOPMENT_GUIDE.md` |
| **System Architecture** | Architecture overview | `.github/instructions/ARCHITECTURE.md` |
| **Current Sprint** | Sprint implementation guides | `SPRINT_IMPLEMENTATION_GUIDE.md`<br>`SPRINT_IMPLEMENTATION_GUIDE_PART2.md` |

### Access Pattern Examples

**Example 1: Adding a new backend endpoint**
```
1. Read: .github/instructions/backend.instructions.md
2. Find: "WHDS-G" pattern (routes → controller → service → schemas → security)
3. Read: Example endpoint patterns
4. Check: Current sprint tasks for related work
5. Apply: Generate code following exact pattern
6. Validate: Cross-check with ARCHITECTURE.md feature-slice structure
```

**Example 2: Creating a frontend component**
```
1. Read: .github/instructions/frontend.instructions.md
2. Find: "TSS-D" pattern (Logic-View-Style-Types separation)
3. Read: Component structure examples
4. Check: Portfolio Dashboard patterns if applicable
5. Apply: Generate 3 separate files (Component.tsx, Component.view.tsx, Component.styles.scss)
6. Validate: SCSS imports use relative paths, BEM naming, design tokens
```

**Example 3: Implementing file upload security**
```
1. Read: SPRINT_IMPLEMENTATION_GUIDE.md → Task 1
2. Find: "EMMS" pattern (Extension-MIME-Magic-Size)
3. Read: Complete security validation implementation
4. Apply: Implement all 4 validation layers
5. Test: Write 15+ security test cases
6. Validate: Cross-check with OWASP guidelines
```

---

## 📅 Current Sprint Tasks

> **Sprint**: November 2025  
> **Status**: Active Development  
> **Duration**: 3 weeks

### Sprint Goals

**Primary Goal**: Secure MVP with complete authentication, file upload, and portfolio dashboard

**Success Criteria**:
- ✅ All P0 tasks completed and tested
- ✅ File uploads validated with EMMS pattern
- ✅ Guest upload flow working with 2-minute timeout
- ✅ Portfolio dashboard functional with live preview
- ✅ >80% test coverage
- ✅ All tests passing in CI
- ✅ Production-ready security validation

### Priority Matrix

#### P0: Critical (Must complete before anything else) 🔴

```
┌─────────────────────────────────────────────────────────┐
│ 🔴 P0 - BLOCKING TASKS                                  │
├─────────────────────────────────────────────────────────┤
│ 1. File Upload Security Layer (EMMS Pattern)           │
│    Owner: Backend (Israel, Ido, Yarin)                             │
│    Time: 2-3 days                                       │
│    Blocks: All upload features                          │
│                                                         │
│ 2. Database Resumes-Users Link                         │
│    Owner: Backend (Israel, Ido, Yarin)                             │
│    Time: 1 day                                          │
│    Blocks: Tasks 5, 6                                   │
│                                                         │
│ 3. UI Login-Registration Behavior Fixes               │
│    Owner: Frontend (Netanel)                           │
│    Time: 1 day                                          │
│    Blocks: Task 8                                       │
└─────────────────────────────────────────────────────────┘
```

#### P1: High Priority (Core MVP features) 🟠

```
┌─────────────────────────────────────────────────────────┐
│ 🟠 P1 - HIGH PRIORITY                                   │
├─────────────────────────────────────────────────────────┤
│ 4. Portfolio Dashboard Screen                          │
│    Owner: Frontend (Netanel)                           │
│    Time: 3-4 days                                       │
│    Features: Settings sidebar, customization toolbar,  │
│              live preview, display mode                 │
│                                                         │
│ 5. Portfolio Versioning System                         │
│    Owner: Backend (Israel, Ido, Yarin)                             │
│    Time: 2 days                                         │
│    Features: Version snapshots, rollback, history      │
│                                                         │
│ 6. User Dashboard API                                  │
│    Owner: Backend (Israel, Ido, Yarin)                             │
│    Time: 2 days                                         │
│    Features: Portfolio list, filter, sort, pagination  │
│                                                         │
│ 7. Authorization & Permission Tests                    │
│    Owner: Backend (Israel, Ido, Yarin)                             │
│    Time: 2 days                                         │
│    Features: Test all protected endpoints              │
└─────────────────────────────────────────────────────────┘
```

#### P2: Medium Priority (Quality & Testing) 🟡

```
┌─────────────────────────────────────────────────────────┐
│ 🟡 P2 - MEDIUM PRIORITY                                 │
├─────────────────────────────────────────────────────────┤
│ 8. E2E Tests for Critical User Flows (Playwright)      │
│ 9. Frontend Auth Store Unit Tests (Vitest)             │
│ 10. Rate Limiting Automated Tests (Pytest)             │
│ 11. Migration Verification Tests                       │
│ 12. Smoke Tests for Empty Endpoints                    │
└─────────────────────────────────────────────────────────┘
```

#### P3: Lower Priority (Infrastructure) 🟢

```
┌─────────────────────────────────────────────────────────┐
│ 🟢 P3 - LOWER PRIORITY                                  │
├─────────────────────────────────────────────────────────┤
│ 13. CI Pipeline Setup                                  │
│ 14. Deployment Pipeline                                │
│ 15. Production Environment Setup                       │
│ 16. Pre-Launch Checklist                               │
│ 17. UI/UX Final Polish                                 │
└─────────────────────────────────────────────────────────┘
```

### Task Dependencies

```
P0 Tasks (Week 1):
├─ Task 1: File Security → All upload features
├─ Task 2: DB Link → Task 5 (Versioning), Task 6 (Dashboard API)
└─ Task 3: UI Fixes → Task 8 (E2E Tests)

P1 Tasks (Week 2):
├─ Task 4: Dashboard → Task 5 (Versioning)
├─ Task 5: Versioning → (depends on Task 2)
├─ Task 6: Dashboard API → (depends on Task 2)
└─ Task 7: Auth Tests → (depends on Tasks 1-3)

P2 Tasks (Week 2-3):
├─ Task 8: E2E Tests (depends on Tasks 1-4)
├─ Task 9: Auth Store Tests (parallel)
├─ Task 10: Rate Limit Tests (parallel)
├─ Task 11: Migration Tests (parallel)
└─ Task 12: Smoke Tests (parallel)

P3 Tasks (Week 3):
Task 13 → Task 14 → Task 15 → Task 16 → Task 17
```

### Quick Task Reference

| Task # | Owner | Time | Sprint Guide Location |
|--------|-------|------|----------------------|
| 1 | Backend (Israel, Ido, Yarin) | 2-3 days | SPRINT_IMPLEMENTATION_GUIDE.md § Task 1 |
| 2 | Backend (Israel, Ido, Yarin) | 1 day | SPRINT_IMPLEMENTATION_GUIDE.md § Task 2 |
| 3 | Frontend (Netanel) | 1 day | SPRINT_IMPLEMENTATION_GUIDE.md § Task 3 |
| 4 | Frontend (Netanel) | 3-4 days | SPRINT_IMPLEMENTATION_GUIDE.md § Task 4 |
| 5 | Backend (Israel, Ido, Yarin) | 2 days | SPRINT_IMPLEMENTATION_GUIDE.md § Task 5 |
| 6 | Backend (Israel, Ido, Yarin) | 2 days | SPRINT_IMPLEMENTATION_GUIDE.md § Task 6 |
| 7 | Backend (Israel, Ido, Yarin) | 2 days | SPRINT_IMPLEMENTATION_GUIDE.md § Task 7 |
| 8 | Frontend (Netanel) | 3-4 days | SPRINT_IMPLEMENTATION_GUIDE_PART2.md § Task 8 |
| 9 | Frontend (Netanel) | 1 day | SPRINT_IMPLEMENTATION_GUIDE_PART2.md § Task 9 |
| 10 | Backend (Israel, Ido, Yarin) | 1 day | SPRINT_IMPLEMENTATION_GUIDE_PART2.md § Task 10 |

### Implementation Guides

**Detailed implementation guides with complete code examples available in:**
- `SPRINT_IMPLEMENTATION_GUIDE.md` - Part 1 (P0, P1 tasks with full code)
- `SPRINT_IMPLEMENTATION_GUIDE_PART2.md` - Part 2 (P2 testing tasks with test suites)
- `INSTRUCTION_IMPROVEMENTS.md` - Patterns, architecture, team coordination

**Quick reference for developers:**
- `QUICK_REFERENCE.md` - Print and keep on desk (patterns, commands, checklists)

---

## 📚 Instruction File Hierarchy

```
.github/instructions/
│
├── copilot-instructions.md    ← You are here (master index + sprint tasks)
│   └── Directs to all other files + current sprint guidance
│
├── ARCHITECTURE.md             ← System design & decisions
│   ├── Technology stack
│   ├── Architecture patterns (Feature-slice, Logic-View-Style)
│   ├── Data flow diagrams
│   ├── Security architecture
│   ├── Portfolio Dashboard architecture (NEW)
│   └── Deployment architecture
│
├── DEVELOPMENT_GUIDE.md        ← Quick reference & patterns
│   ├── Memory aids (WHDS-G, TSS-D, EMMS, NAAR)
│   ├── Code pattern library
│   ├── Common problems & solutions
│   └── Command reference
│
├── backend.instructions.md     ← Backend implementation patterns
│   ├── Feature-slice architecture (WHDS-G)
│   ├── FastAPI + Pydantic v2
│   ├── SQLAlchemy 2.0 async
│   ├── Security validation (EMMS pattern)
│   └── Testing patterns
│
├── frontend.instructions.md    ← Frontend implementation patterns
│   ├── Logic-View-Style separation (TSS-D)
│   ├── React + TypeScript
│   ├── SCSS + BEM + design tokens
│   ├── State management (Zustand)
│   ├── Guest upload pattern (NEW)
│   └── Testing patterns
│
└── python.instructions.md      ← General Python conventions
    ├── Code style (PEP 8)
    ├── Type hints
    ├── Docstrings
    └── Testing approach
```

---

## 🧠 System Thinking Principles

All contributors MUST approach the project with a holistic, system-oriented mindset:

### Core Principles

1. **Interrelationships First**
   - Consider how changes affect backend, frontend, database, and deployment
   - Trace dependencies across all layers before implementing
   - Document cross-cutting concerns explicitly
   - Check sprint task dependencies before starting work

2. **Pattern Recognition**
   - Identify recurring patterns in architecture (WHDS-G, TSS-D, EMMS)
   - Follow established patterns consistently
   - Propose pattern improvements through proper channels

3. **Root Cause Analysis**
   - Address underlying system issues, not symptoms
   - Map data flows and dependencies before debugging
   - Consider performance, security, and maintainability impacts

4. **Continuous Learning**
   - Review architecture decisions regularly
   - Update instruction files when patterns evolve
   - Share learnings through documentation

### Mandatory Questions Before Implementation

- [ ] How does this change affect other system components?
- [ ] Are there cascading dependencies or feedback loops?
- [ ] Is this addressing root cause or just a symptom?
- [ ] What patterns or anti-patterns are present?
- [ ] Have I consulted the relevant instruction files?
- [ ] Is this task part of the current sprint? What priority?
- [ ] Are there any blocking dependencies I need to wait for?

---

## 🏗️ Architecture Overview

### Technology Stack

| Layer | Technologies | Version | Purpose |
|-------|-------------|---------|---------|
| **Backend** | FastAPI + Pydantic v2 + SQLAlchemy 2.0 | Latest | Async API with type safety |
| **Database** | PostgreSQL + asyncpg | 15 | Relational data + JSONB |
| **Frontend** | React 19 + TypeScript + Vite | Latest | Type-safe UI with HMR |
| **Styling** | SCSS + BEM + Design Tokens | Latest | Maintainable, scalable CSS |
| **State** | Zustand | Latest | Minimal state management |
| **Testing** | Pytest + Vitest + Playwright | Latest | Unit + Integration + E2E |
| **Deployment** | Docker Compose | Latest | Multi-service orchestration |

**For detailed technology rationale and versions, see:** [ARCHITECTURE.md](./ARCHITECTURE.md)

### Architecture Patterns

#### Backend: Feature-Slice Architecture (WHDS-G)

```
features/<feature>/
  ├── routes.py       → Where: URL paths & HTTP methods
  ├── controller.py   → Handle: Request/response & validation
  ├── service.py      → Do: Business logic (pure functions)
  ├── schemas.py      → Shape: Data contracts (Pydantic)
  └── security.py     → Guard: Validation & sanitization
```

**Memory Aid: WHDS-G**
- **W**here: Define endpoints
- **H**andle: HTTP concerns
- **D**o: Business logic
- **S**hape: Data contracts
- **G**uard: Security validation

**For complete patterns and examples, see:** [backend.instructions.md](./backend.instructions.md)

#### Frontend: Logic-View-Style Separation (TSS-D)

```
Component/
  ├── Component.tsx        → Think: State & logic
  ├── Component.view.tsx   → Show: Presentational JSX
  ├── Component.styles.scss → Style: BEM + tokens
  └── Component.types.ts   → Define: Interfaces
```

**Memory Aid: TSS-D**
- **T**hink: Logic file
- **S**how: View file
- **S**tyle: SCSS file
- **D**efine: Types file

**For complete patterns and examples, see:** [frontend.instructions.md](./frontend.instructions.md)

#### Security: EMMS Pattern (File Upload)

```
File Upload Validation:
  1. Extension → Verify extension (whitelist, reject double extensions)
  2. MIME     → Verify Content-Type header
  3. Magic    → Inspect first 8 bytes (%PDF or PK\x03\x04)
  4. Size     → Stream and validate (5MB max)
```

**Memory Aid: EMMS**
- **E**xtension validation
- **M**IME type verification
- **M**agic bytes inspection
- **S**ize limits

**For complete implementation, see:** `SPRINT_IMPLEMENTATION_GUIDE.md` → Task 1

---

## 🔒 Security Requirements

### Non-Negotiable Security Standards

All code MUST implement defense-in-depth security:

#### 1. File Upload Security (EMMS Pattern) - PRIORITY P0

**Complete validation pipeline**:
```python
async def validate_upload_security(file: UploadFile) -> dict:
    # Step 1: Extension (reject .php.pdf, etc.)
    is_valid_ext, ext = verify_extension(file.filename)
    if not is_valid_ext:
        raise HTTPException(415, detail="Invalid extension")
    
    # Step 2: MIME type
    is_valid_mime, mime = verify_mime_type(file)
    if not is_valid_mime:
        raise HTTPException(415, detail="Invalid MIME type")
    
    # Step 3: Magic bytes
    first_chunk = await file.read(8)
    if not verify_magic_bytes(first_chunk, ext):
        raise HTTPException(415, detail="File content mismatch")
    await file.seek(0)
    
    # Step 4: Size (streaming)
    await verify_size_streaming(file)
    
    return {"valid": True, "extension": ext, "mime_type": mime}
```

**Testing requirements**:
- [ ] Test double extension rejection (malicious.php.pdf)
- [ ] Test magic byte mismatch (fake PDF)
- [ ] Test file too large (>5MB)
- [ ] Test wrong MIME type
- [ ] Test macro-enabled DOCX rejection

**Implementation guide**: `SPRINT_IMPLEMENTATION_GUIDE.md` § Task 1

#### 2. Input Validation

- Pydantic strict mode for all API inputs
- SQLAlchemy parameterized queries (no string concatenation)
- JSONB schema validation with Pydantic
- XSS prevention (sanitize all user input)

#### 3. Security Headers (FastAPI middleware)

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy: default-src 'self'`

#### 4. Database Security

- Least-privilege PostgreSQL user
- TLS connections in production
- No PII in logs
- CASCADE deletes for referential integrity
- Regular backup strategy

**For detailed security patterns, see:** [backend.instructions.md § Security](./backend.instructions.md#security-validation-patterns)

---

## 🎯 Code Quality Standards

### Mandatory Requirements

All code MUST meet these standards:

| Category | Requirement | Validation |
|----------|------------|------------|
| **Type Safety** | TypeScript (frontend), type hints (backend) | `tsc --noEmit`, `mypy` |
| **Code Style** | PEP 8 (Python), ESLint (TypeScript) | `black`, `ruff`, `eslint` |
| **Testing** | >80% coverage, unit + integration + E2E | `pytest --cov`, `vitest`, `playwright` |
| **Documentation** | Docstrings (Python), JSDoc (TypeScript) | Code review |
| **Security** | OWASP Top 10 compliance, EMMS pattern | `bandit`, manual review |
| **Performance** | Async I/O, pagination, caching | Load testing |

### Code Review Checklist

Before submitting code for review:

- [ ] Read relevant instruction files
- [ ] Followed architecture patterns (WHDS-G or TSS-D or EMMS)
- [ ] Checked current sprint tasks for related work
- [ ] All tests passing (unit + integration + E2E)
- [ ] Linting passing (no warnings)
- [ ] Type checking passing (no errors)
- [ ] Security validation implemented
- [ ] Documentation updated
- [ ] Docker build successful

---

## 📋 Development Workflow

### Step-by-Step Process

1. **Plan**
   - [ ] Read feature requirements
   - [ ] Check sprint tasks and priorities
   - [ ] Identify affected components (backend/frontend/database)
   - [ ] Review [ARCHITECTURE.md](./ARCHITECTURE.md)
   - [ ] Review domain-specific instruction files
   - [ ] Review sprint implementation guide if applicable
   - [ ] Check task dependencies
   - [ ] Create implementation plan

2. **Implement**
   - [ ] Create feature branch: `<role>/<name>/<task>`
   - [ ] Follow patterns from instruction files
   - [ ] Apply sprint-specific implementations if applicable
   - [ ] Write tests alongside code (TDD)
   - [ ] Commit frequently with conventional commits
   - [ ] Reference sprint task number in commits

3. **Validate**
   - [ ] Run tests locally
   - [ ] Run linters and type checkers
   - [ ] Test in Docker environment
   - [ ] Review checklist above
   - [ ] Verify sprint task completion criteria

4. **Review**
   - [ ] Create pull request with description
   - [ ] Reference sprint task number
   - [ ] Reference instruction file patterns used
   - [ ] Include screenshots for UI changes
   - [ ] Address review comments
   - [ ] Merge after approval

### Git Workflow

**Branch Structure:**
```
main          → Production-ready only
  ├── dev     → Staging/integration branch
      ├── feature/<sprint-n>              → Sprint feature branches
          ├── <role>/<dev>/<task>         → Individual dev branches
```

**Commit Message Format:** (Conventional Commits)
```
<type>(<scope>): <description> [Sprint Task #N]

[optional body]
[optional footer]
```

**Examples:**
```
feat(auth): implement EMMS file validation [Sprint Task #1]
fix(dashboard): correct color palette CSS variables [Sprint Task #4]
test(e2e): add guest upload flow tests [Sprint Task #8]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**For complete workflow guide, see:** `WORKFLOW_GUIDE.md`

---

## 🚀 Quick Start Commands

### Local Development

**Backend (without Docker):**
```bash
cd backend
python -m venv venv && source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -e .
alembic upgrade head
uvicorn app.main:app --reload --port 9000
```

**Frontend (without Docker):**
```bash
cd frontend
npm install
npm run dev  # Vite dev server on :5173
```

### Docker Development (Recommended)

```bash
# Start all services
docker compose up --build -d

# View logs
docker compose logs -f backend frontend

# Run migrations
docker compose up migrate

# Restart after changes
docker compose restart backend frontend

# Stop all
docker compose down
```

### Testing

**Backend:**
```bash
pytest backend/app/tests/              # All tests
pytest backend/app/tests/unit/         # Unit only
pytest -k "test_upload" -v             # Specific test
pytest --cov=app                       # With coverage
```

**Frontend:**
```bash
npm test                               # Unit tests (Vitest)
npm run test:ui                        # Vitest UI
npm run test:coverage                  # With coverage
npm run e2e                            # E2E tests (Playwright)
npm run e2e:ui                         # Playwright UI
```

**For complete command reference, see:** [DEVELOPMENT_GUIDE.md § Commands](./DEVELOPMENT_GUIDE.md#quick-command-reference)

---

## ❌ Prohibited Actions

AI assistants MUST NOT:

- ❌ Generate code without reading instruction files first
- ❌ Skip sprint implementation guides for current sprint tasks
- ❌ Deviate from established patterns without explicit approval
- ❌ Add new technology dependencies without team discussion
- ❌ Bypass security validation layers (especially EMMS)
- ❌ Mix logic and presentation in single files (frontend)
- ❌ Use synchronous database queries (backend)
- ❌ Use absolute paths in SCSS imports
- ❌ Store secrets in code or version control
- ❌ Suggest Tailwind or other CSS frameworks (we use pure SCSS)
- ❌ Use Pydantic v1 syntax (only v2)
- ❌ Use SQLAlchemy 1.x query API (only 2.0 async)
- ❌ Implement file uploads without EMMS validation
- ❌ Skip guest upload flow considerations

---

## 🆘 Getting Help

### For AI Assistants

When uncertain about implementation:

1. **Check sprint tasks first** - Is this part of current sprint?
2. **Read sprint implementation guide** - Complete code examples available
3. **Read instruction files** - Most answers are documented
4. **Check DEVELOPMENT_GUIDE.md** - Quick patterns and solutions
5. **Reference ARCHITECTURE.md** - System design decisions
6. **Ask specific questions** - Reference file locations and patterns

### For Human Developers

- **Sprint Questions:** Check `SPRINT_IMPLEMENTATION_GUIDE.md` first
- **Documentation Issues:** Open PR to update instruction files
- **Pattern Questions:** Review [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
- **Architecture Decisions:** Review [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Code Review:** Reference specific instruction file sections
- **Blockers:** Post in `#blockers` Slack channel immediately
- **General Questions:** Ask in `#dev` Slack channel

---

## 📖 Learning Path

### For New AI Assistants

**Recommended reading order:**

1. **This file** (copilot-instructions.md) - Understand the system + current sprint
2. **SPRINT_IMPLEMENTATION_GUIDE.md** - Review current sprint tasks
3. **ARCHITECTURE.md** - Learn system design and patterns
4. **DEVELOPMENT_GUIDE.md** - Study memory aids and quick patterns
5. **Domain-specific file** - Deep dive into backend or frontend patterns
6. **python.instructions.md** - General Python conventions (if backend)

### For New Developers

**Recommended path:**

1. Setup local environment (Docker + dependencies)
2. Read this file (understand system + current sprint)
3. Read sprint implementation guides (understand current work)
4. Read ARCHITECTURE.md (understand the "why")
5. Read DEVELOPMENT_GUIDE.md (learn the patterns)
6. Study existing feature (e.g., `features/resumes/`)
7. Start with assigned sprint task following patterns
8. Request code review with instruction file references

---

## 📝 Maintenance

### Keeping Instructions Current

**When to update instruction files:**

- ✅ New pattern introduced and validated
- ✅ Architecture decision changes
- ✅ Technology version upgraded
- ✅ Common problem identified
- ✅ Best practice discovered
- ✅ Sprint patterns become permanent patterns

**How to update:**

1. Create PR with proposed changes
2. Update relevant instruction file(s)
3. Add examples and rationale
4. Update cross-references
5. Update sprint guides if applicable
5. Request review from tech lead (Amir) or senior developers

---

## 🎓 Key Takeaways

### For AI Assistants

1. **Always check sprint tasks first** - Current work has priority
2. **Read sprint implementation guides** - Complete code examples
3. **Always read instruction files before coding**
4. **Follow established patterns exactly** (WHDS-G, TSS-D, EMMS)
5. **Maintain separation of concerns**
6. **Prioritize security and type safety**
7. **Reference specific instruction files in responses**

### For Developers

1. **Check sprint board first** - Know your priorities
2. **Sprint guides have complete implementations** - Don't reinvent
3. **Instruction files are the source of truth**
4. **Patterns exist for a reason** (see ARCHITECTURE.md)
5. **When in doubt, follow existing examples**
6. **Update docs when patterns evolve**
7. **Code reviews check pattern adherence**
8. **Communicate blockers immediately**

---

## 🎯 Sprint-Specific Reminders

### This Sprint's Focus

**Week 1**: P0 Tasks (BLOCKING)
- File Upload Security with EMMS pattern
- Database Resumes-Users link with CASCADE
- UI Login-Registration fixes with guest upload

**Week 2**: P1 & P2 Tasks
- Portfolio Dashboard with live preview
- Portfolio Versioning with rollback
- Comprehensive E2E test suite

**Week 3**: P3 Tasks + Polish
- CI/CD pipeline
- Production deployment
- Final QA and polish

### Critical Patterns to Apply

1. **EMMS Pattern** - Every file upload must validate all 4 layers
2. **Guest Upload Flow** - 2-minute timeout, state persistence
3. **TSS-D Pattern** - All new frontend components follow separation
4. **CASCADE Deletes** - All user relationships use ondelete="CASCADE"
5. **Test Coverage** - Every new feature >80% coverage

---

**Version**: 4.0  
**Last Updated**: November 2025  
**Sprint**: November 2025 (3 weeks)  
**Next Review**: End of Sprint  

**Team Roster**:
- **Team Lead & Full-Stack**: Amir
- **Backend Developers**: Israel, Ido, Yarin
- **Frontend Developer**: Netanel
- **DevOps Engineer**: Yarin
- **Security Engineer**: Morris
- **Project Manager**: Hezi
- **UI/UX Designer**: Yoad

**Feedback**: Open PR with suggested improvements to `.github/instructions/` files

---

## 📚 Additional Resources

### Sprint Documentation
- `SPRINT_IMPLEMENTATION_GUIDE.md` - P0 & P1 tasks with complete code
- `SPRINT_IMPLEMENTATION_GUIDE_PART2.md` - P2 testing tasks with test suites
- `INSTRUCTION_IMPROVEMENTS.md` - Architecture patterns & team coordination
- `QUICK_REFERENCE.md` - Print-friendly quick reference card

### External Resources
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **FastAPI Security**: https://fastapi.tiangolo.com/tutorial/security/
- **React Testing**: https://testing-library.com/react
- **Playwright**: https://playwright.dev/docs/best-practices
- **PostgreSQL**: https://www.postgresql.org/docs/current/

---

**🚀 Ready to start? Check your sprint task assignment and dive into the implementation guide!**