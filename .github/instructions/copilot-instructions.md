---
description: 'Portfolio Builder - Master instruction file for AI assistants and developers'
applyTo: '**/*'
---

# GitHub Copilot Instructions — Portfolio Builder

> **Version**: 3.0  
> **Last Updated**: October 2025  
> **Maintained By**: Architecture Team

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
3. **Apply patterns from instruction files** to all generated code
4. **Cross-reference architecture decisions** in ARCHITECTURE.md

### Instruction File Mappings

| Task Domain | Required Reading | File Path |
|-------------|-----------------|-----------|
| **Backend Development** | Backend instructions + Architecture | `.github/instructions/backend.instructions.md`<br>`.github/instructions/ARCHITECTURE.md` |
| **Frontend Development** | Frontend instructions + Architecture | `.github/instructions/frontend.instructions.md`<br>`.github/instructions/ARCHITECTURE.md` |
| **Python Code** | Python conventions + Backend instructions | `.github/instructions/python.instructions.md`<br>`.github/instructions/backend.instructions.md` |
| **Quick Reference** | Development guide | `.github/instructions/DEVELOPMENT_GUIDE.md` |
| **System Architecture** | Architecture overview | `.github/instructions/ARCHITECTURE.md` |

### Access Pattern Examples

**Example 1: Adding a new backend endpoint**
```
1. Read: .github/instructions/backend.instructions.md
2. Find: "WHDS-G" pattern (routes → controller → service → schemas → security)
3. Read: Example endpoint patterns
4. Apply: Generate code following exact pattern
5. Validate: Cross-check with ARCHITECTURE.md feature-slice structure
```

**Example 2: Creating a frontend component**
```
1. Read: .github/instructions/frontend.instructions.md
2. Find: "TSS-D" pattern (Logic-View-Style-Types separation)
3. Read: Component structure examples
4. Apply: Generate 3 separate files (Component.tsx, Component.view.tsx, Component.styles.scss)
5. Validate: SCSS imports use relative paths, BEM naming, design tokens
```

**Example 3: Database migration**
```
1. Read: .github/instructions/ARCHITECTURE.md (Migration Philosophy section)
2. Read: .github/instructions/backend.instructions.md (SQLAlchemy patterns)
3. Apply: Async SQLAlchemy 2.0 syntax with proper transactions
4. Validate: Reversible migration with downgrade() function
```

---

## 📚 Instruction File Hierarchy

```
.github/instructions/
│
├── copilot-instructions.md    ← You are here (master index)
│   └── Directs to all other files
│
├── ARCHITECTURE.md             ← System design & decisions
│   ├── Technology stack
│   ├── Architecture patterns
│   ├── Data flow diagrams
│   └── Deployment architecture
│
├── DEVELOPMENT_GUIDE.md        ← Quick reference & patterns
│   ├── Memory aids (WHDS-G, TSS-D, EMMS, NAAR)
│   ├── Code pattern library
│   ├── Common problems & solutions
│   └── Command reference
│
├── backend.instructions.md     ← Backend implementation patterns
│   ├── Feature-slice architecture
│   ├── FastAPI + Pydantic v2
│   ├── SQLAlchemy 2.0 async
│   ├── Security validation
│   └── Testing patterns
│
├── frontend.instructions.md    ← Frontend implementation patterns
│   ├── Logic-View-Style separation
│   ├── React + TypeScript
│   ├── SCSS + BEM + design tokens
│   ├── State management
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

2. **Pattern Recognition**
   - Identify recurring patterns in architecture (feature-slice, Logic-View-Style)
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
| **Testing** | Pytest + Vitest + Playwright | Latest | Unit + E2E coverage |
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

---

## 🔒 Security Requirements

### Non-Negotiable Security Standards

All code MUST implement defense-in-depth security:

1. **File Upload Security (EMMS Pattern)**
   - **E**xtension validation (whitelist only)
   - **M**IME type verification (Content-Type header)
   - **M**agic bytes inspection (first 8 bytes)
   - **S**ize limits (streaming validation)

2. **Input Validation**
   - Pydantic strict mode for all API inputs
   - SQLAlchemy parameterized queries (no string concatenation)
   - JSONB schema validation with Pydantic
   - XSS prevention (sanitize all user input)

3. **Security Headers** (FastAPI middleware)
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Content-Security-Policy: default-src 'self'`

4. **Database Security**
   - Least-privilege PostgreSQL user
   - TLS connections in production
   - No PII in logs
   - Regular backup strategy

**For detailed security patterns, see:** [backend.instructions.md § Security](.backend.instructions.md#security-validation-patterns)

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
| **Security** | OWASP Top 10 compliance | `bandit`, manual review |
| **Performance** | Async I/O, pagination, caching | Load testing |

### Code Review Checklist

Before submitting code for review:

- [ ] Read relevant instruction files
- [ ] Followed architecture patterns (WHDS-G or TSS-D)
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
   - [ ] Identify affected components (backend/frontend/database)
   - [ ] Review [ARCHITECTURE.md](./ARCHITECTURE.md)
   - [ ] Review domain-specific instruction files
   - [ ] Create implementation plan

2. **Implement**
   - [ ] Create feature branch: `<role>/<name>/<task>`
   - [ ] Follow patterns from instruction files
   - [ ] Write tests alongside code (TDD)
   - [ ] Commit frequently with conventional commits

3. **Validate**
   - [ ] Run tests locally
   - [ ] Run linters and type checkers
   - [ ] Test in Docker environment
   - [ ] Review checklist above

4. **Review**
   - [ ] Create pull request with description
   - [ ] Reference instruction file patterns used
   - [ ] Address review comments
   - [ ] Merge after approval

### Git Workflow

**Branch Structure:**
```
main          → Production-ready only
  ├── dev     → Staging/integration branch
      ├── feature/<n>              → Sprint feature branches
          ├── <role>/<dev>/<task>  → Individual dev branches
```

**Commit Message Format:** (Conventional Commits)
```
<type>(<scope>): <description>

[optional body]
[optional footer]
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
```

**Frontend:**
```bash
npm test                               # Unit tests (Vitest)
npm run test:ui                        # Vitest UI
npm run e2e                            # E2E tests (Playwright)
npm run e2e:ui                         # Playwright UI
```

**For complete command reference, see:** [DEVELOPMENT_GUIDE.md § Commands](./DEVELOPMENT_GUIDE.md#quick-command-reference)

---

## ❌ Prohibited Actions

AI assistants MUST NOT:

- ❌ Generate code without reading instruction files first
- ❌ Deviate from established patterns without explicit approval
- ❌ Add new technology dependencies without team discussion
- ❌ Bypass security validation layers
- ❌ Mix logic and presentation in single files (frontend)
- ❌ Use synchronous database queries (backend)
- ❌ Use absolute paths in SCSS imports
- ❌ Store secrets in code or version control
- ❌ Suggest Tailwind or other CSS frameworks (we use pure SCSS)
- ❌ Use Pydantic v1 syntax (only v2)
- ❌ Use SQLAlchemy 1.x query API (only 2.0 async)

---

## 🆘 Getting Help

### For AI Assistants

When uncertain about implementation:

1. **Read instruction files** - Most answers are documented
2. **Check DEVELOPMENT_GUIDE.md** - Quick patterns and solutions
3. **Reference ARCHITECTURE.md** - System design decisions
4. **Ask specific questions** - Reference file locations and patterns

### For Human Developers

- **Documentation Issues:** Open PR to update instruction files
- **Pattern Questions:** Review [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
- **Architecture Decisions:** Review [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Code Review:** Reference specific instruction file sections

---

## 📖 Learning Path

### For New AI Assistants

**Recommended reading order:**

1. **This file** (copilot-instructions.md) - Understand the system
2. **ARCHITECTURE.md** - Learn system design and patterns
3. **DEVELOPMENT_GUIDE.md** - Study memory aids and quick patterns
4. **Domain-specific file** - Deep dive into backend or frontend patterns
5. **python.instructions.md** - General Python conventions (if backend)

### For New Developers

**Recommended path:**

1. Setup local environment (Docker + dependencies)
2. Read ARCHITECTURE.md (understand the "why")
3. Read DEVELOPMENT_GUIDE.md (learn the patterns)
4. Study existing feature (e.g., `features/resumes/`)
5. Start with small task following patterns
6. Request code review with instruction file references

---

## 📝 Maintenance

### Keeping Instructions Current

**When to update instruction files:**

- ✅ New pattern introduced and validated
- ✅ Architecture decision changes
- ✅ Technology version upgraded
- ✅ Common problem identified
- ✅ Best practice discovered

**How to update:**

1. Create PR with proposed changes
2. Update relevant instruction file(s)
3. Add examples and rationale
4. Update cross-references
5. Request review from architecture team

---

## 🎓 Key Takeaways

### For AI Assistants

1. **Always read instruction files before coding**
2. **Follow established patterns exactly**
3. **Maintain separation of concerns**
4. **Prioritize security and type safety**
5. **Reference specific instruction files in responses**

### For Developers

1. **Instruction files are the source of truth**
2. **Patterns exist for a reason (see ARCHITECTURE.md)**
3. **When in doubt, follow existing examples**
4. **Update docs when patterns evolve**
5. **Code reviews check pattern adherence**

---

**Version**: 3.0  
**Last Updated**: October 2025  
**Next Review**: December 2025  
**Maintained By**: Frontend (Natanel), Backend (Daniel), DevOps (Maya)

**Feedback**: Open PR with suggested improvements to `.github/instructions/` files
