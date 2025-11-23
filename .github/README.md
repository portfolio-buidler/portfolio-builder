# Portfolio Builder - Instructions & Guidelines

> **Complete documentation for developers, AI assistants, and contributors**

## 📋 Quick Start

**New to the project?** Start here:
1. Read [`copilot-instructions.md`](./copilot-instructions.md) - Master overview
2. Review [`ARCHITECTURE.md`](./ARCHITECTURE.md) - System design
3. Check [`DEVELOPMENT_GUIDE.md`](./DEVELOPMENT_GUIDE.md) - Quick patterns

---

## 📚 Core Documentation

### Main Instruction Files

| File | Purpose | Who Should Read |
|------|---------|----------------|
| **[copilot-instructions.md](./copilot-instructions.md)** | Master instruction file, directs to all other docs | Everyone (start here) |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | System architecture, tech stack, design decisions | Developers, architects |
| **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** | Quick reference, memory aids, common patterns | Active developers |

### Technology-Specific Guides

| File | Purpose | Applies To |
|------|---------|-----------|
| **[backend.instructions.md](./backend.instructions.md)** | Backend patterns (FastAPI, Pydantic v2, SQLAlchemy 2.0) | `backend/**/*.py` |
| **[frontend.instructions.md](./frontend.instructions.md)** | Frontend patterns (React, TypeScript, SCSS) | `frontend/**/*.{ts,tsx,scss}` |
| **[python.instructions.md](./python.instructions.md)** | General Python conventions | `**/*.py` |

### Specialized Guides

| File | Purpose |
|------|---------|
| **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** | Testing strategies (Vitest, Playwright, Pytest) |
| **[FRONTEND_SCSS_ARCHITECTURE_GUIDE.md](./FRONTEND_SCSS_ARCHITECTURE_GUIDE.md)** | SCSS structure, design tokens, BEM methodology |

---

## 🎯 Common Use Cases

### "I want to add a new backend endpoint"
1. Read [backend.instructions.md](./backend.instructions.md) § WHDS-G pattern
2. Study existing feature: `backend/app/features/resumes/`
3. Follow feature-slice architecture

### "I want to add a new frontend component"
1. Read [frontend.instructions.md](./frontend.instructions.md) § TSS-D pattern
2. Study existing component: `frontend/src/features/UploadCV/`
3. Follow Logic-View-Style separation

### "I need to understand the authentication flow"
1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) § Auth Restore & Rate Limiting
2. Review [backend.instructions.md](./backend.instructions.md) § Auth Endpoint Considerations
3. Check [frontend.instructions.md](./frontend.instructions.md) § Authentication Bootstrap

### "I encountered an error or problem"
1. Check [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) § Common Problems & Solutions
2. Review technology-specific troubleshooting sections
3. Check error patterns in respective instruction files

---

## 🔍 File Organization

```
.github/instructions/
├── README.md (this file)              ← Navigation & overview
├── copilot-instructions.md            ← Master index (read first!)
├── ARCHITECTURE.md                    ← System design & decisions
├── DEVELOPMENT_GUIDE.md               ← Quick patterns & memory aids
│
├── Backend Instructions
│   ├── backend.instructions.md        ← FastAPI, Pydantic, SQLAlchemy
│   └── python.instructions.md         ← General Python conventions
│
├── Frontend Instructions
│   ├── frontend.instructions.md       ← React, TypeScript, SCSS
│   ├── TESTING_GUIDE.md              ← Vitest, Playwright patterns
│   └── FRONTEND_SCSS_ARCHITECTURE_GUIDE.md ← Design tokens, BEM
```

---

## 🚀 For AI Assistants

**Before generating any code:**
1. **Read [`copilot-instructions.md`](./copilot-instructions.md)** - Understand mandatory reading protocol
2. **Identify domain** (backend/frontend/database)
3. **Read relevant instruction file** (backend/frontend/python)
4. **Apply documented patterns** exactly

**Critical rules:**
- ❌ Never generate code without reading instruction files first
- ✅ Always follow established patterns (WHDS-G, TSS-D, etc.)
- ✅ Reference specific instruction file sections in responses
- ✅ Maintain separation of concerns (layers, files)

---

## 📝 Contributing to Docs

**When to update instruction files:**
- New pattern validated and adopted
- Architecture decision changes
- Technology version upgraded
- Common problem identified

**How to update:**
1. Create PR with proposed changes
2. Update relevant file(s) with examples
3. Update cross-references
4. Request review from architecture team

---

## 🎓 Learning Path

### For New Developers
1. **Week 1:** Read ARCHITECTURE.md + DEVELOPMENT_GUIDE.md
2. **Week 2:** Study backend.instructions.md OR frontend.instructions.md (your domain)
3. **Week 3:** Review existing features in codebase
4. **Week 4:** Start with small task following patterns

### For AI Assistants
1. **Always:** Read copilot-instructions.md first
2. **Per task:** Read domain-specific instruction file
3. **When stuck:** Check DEVELOPMENT_GUIDE.md troubleshooting
4. **Reference:** Cite specific instruction file sections

---

## 📞 Support

- **Documentation Issues:** Open PR to update instruction files
- **Pattern Questions:** Reference DEVELOPMENT_GUIDE.md
- **Architecture Decisions:** See ARCHITECTURE.md
- **Code Review:** Reference specific instruction file sections

---

**Last Updated:** November 2025  
