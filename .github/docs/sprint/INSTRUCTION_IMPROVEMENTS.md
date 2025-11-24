# Portfolio Builder - Instruction Improvements & Sprint Summary

> **Version**: 1.0  
> **Date**: November 2025  
> **Purpose**: Improve existing instructions and provide sprint guidance

---

## 📋 Executive Summary

This document provides:
1. **Actionable improvements** to existing instruction files
2. **Sprint task prioritization** and dependencies
3. **Team coordination** patterns
4. **Portfolio dashboard architecture** guidance (based on designs)
5. **Quick reference** for common implementations

---

## 🎯 Critical Instruction Improvements

### 1. Add Sprint-Specific Section to copilot-instructions.md

**Location**: `.github/instructions/copilot-instructions.md`

**Add after "Quick Start Commands" section**:

```markdown
## 📅 Current Sprint Tasks

> **Sprint**: November 2025  
> **Status**: Active Development

### Priority Overview

**P0 - BLOCKING** (Must complete first):
1. File Upload Security Layer (EMMS pattern)
2. Database Resumes-Users Link
3. UI Login-Registration Behavior Fixes

**P1 - HIGH** (Core MVP features):
4. Portfolio Dashboard Screen
5. Portfolio Versioning System
6. User Dashboard API
7. Authorization & Permission Tests

**P2 - MEDIUM** (Quality & Testing):
8. E2E Tests for Critical User Flows (Playwright)
9. Frontend Auth Store Unit Tests (Vitest)
10. Rate Limiting Automated Tests (Pytest)
11. Migration Verification Tests
12. Smoke Tests for Empty Endpoints

**P3 - LOWER** (Infrastructure):
13. CI Pipeline Setup
14. Deployment Pipeline
15. Production Environment Setup
16. Pre-Launch Checklist
17. UI/UX Final Polish

### Task Dependencies

```
P0 Tasks (Parallel):
├─ Task 1: File Security → All upload features
├─ Task 2: DB Link → Task 5 (Versioning), Task 6 (Dashboard API)
└─ Task 3: UI Fixes → Task 8 (E2E Tests)

P1 Tasks:
├─ Task 4: Dashboard → Task 5 (Versioning)
├─ Task 5: Versioning → (depends on Task 2)
├─ Task 6: Dashboard API → (depends on Task 2)
└─ Task 7: Auth Tests → (depends on Tasks 1-3)

P2 Tasks (Parallel after P0/P1):
├─ Task 8: E2E Tests
├─ Task 9: Auth Store Tests
├─ Task 10: Rate Limit Tests
├─ Task 11: Migration Tests
└─ Task 12: Smoke Tests

P3 Tasks (Sequential):
Task 13 → Task 14 → Task 15 → Task 16 → Task 17
```

### Quick Task Reference

| Task # | Owner | Time | Blocking |
|--------|-------|------|----------|
| 1 | Backend (Israel, Ido, Yarin) | 2-3 days | All upload features |
| 2 | Backend (Israel, Ido, Yarin) | 1 day | Tasks 5, 6 |
| 3 | Frontend (Netanel) | 1 day | Task 8 |
| 4 | Frontend (Netanel) | 3-4 days | Task 5 |
| 5 | Backend (Israel, Ido, Yarin) | 2 days | - |
| 6 | Backend (Israel, Ido, Yarin) | 2 days | - |
| 7 | Backend (Israel, Ido, Yarin) | 2 days | - |
| 8 | Frontend (Netanel) | 3-4 days | - |
| 9 | Frontend (Netanel) | 1 day | - |
| 10 | Backend (Israel, Ido, Yarin) | 1 day | - |

### Implementation Guides

Detailed implementation guides available in:
- `SPRINT_IMPLEMENTATION_GUIDE.md` - Part 1 (P0, P1 tasks)
- `SPRINT_IMPLEMENTATION_GUIDE_PART2.md` - Part 2 (P2 testing tasks)
```

---

### 2. Add Security Patterns Section to backend.instructions.md

**Location**: `.github/instructions/backend.instructions.md`

**Add new section after "Feature-Slice Architecture"**:

```markdown
## Security Validation Patterns

### EMMS Pattern (File Upload Security)

**Memory Aid: EMMS**
- **E**xtension validation (whitelist only)
- **M**IME type verification (Content-Type header)
- **M**agic bytes inspection (first 8 bytes)
- **S**ize limits (streaming validation)

#### Implementation Example

```python
async def validate_upload_security(file: UploadFile) -> dict:
    """
    Complete EMMS validation pipeline.
    
    Returns:
        Dict with validation results
        
    Raises:
        HTTPException: On any security violation
    """
    # Step 1: Verify extension (no double extensions)
    is_valid_ext, ext_or_error = verify_extension(file.filename)
    if not is_valid_ext:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=ext_or_error
        )
    
    # Step 2: Verify MIME type
    is_valid_mime, mime_or_error = verify_mime_type(file)
    if not is_valid_mime:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=mime_or_error
        )
    
    # Step 3: Read first chunk for magic bytes
    first_chunk = await file.read(8)
    if not verify_magic_bytes(first_chunk, extension):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="File content does not match extension"
        )
    
    await file.seek(0)  # Reset file pointer
    
    # Step 4: Verify size (streaming)
    await verify_size_streaming(file)
    
    return {"valid": True, "extension": extension, "mime_type": mime_or_error}
```

#### Testing Pattern

```python
class TestFileSecurity:
    async def test_double_extension_rejected(self):
        """Reject files like malicious.php.pdf"""
        is_valid, error = verify_extension("malicious.php.pdf")
        assert is_valid is False
        assert "Double extensions" in error
    
    async def test_magic_byte_mismatch(self):
        """Reject files with spoofed extensions"""
        content = b"FAKE PDF CONTENT"  # Not %PDF
        assert verify_magic_bytes(content, "pdf") is False
```

### Database Security Patterns

#### Cascade Delete Configuration

```python
class Resume(Base):
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    
    user = relationship("User", back_populates="resumes")
```

**Why CASCADE**:
- When user deleted, all resumes automatically deleted
- Prevents orphaned data
- Maintains referential integrity

#### Preventing SQL Injection

```python
# ✅ CORRECT - Parameterized query
stmt = select(Resume).where(Resume.id == resume_id)
result = await db.execute(stmt)

# ❌ WRONG - String concatenation
query = f"SELECT * FROM resumes WHERE id = {resume_id}"  # NEVER DO THIS
```

### Rate Limiting Pattern

```python
from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/v1/resumes/upload")
@limiter.limit("5/minute")  # 5 uploads per minute
async def upload_resume(request: Request, file: UploadFile):
    # Implementation
    pass
```
```

---

### 3. Add Guest Upload Pattern to frontend.instructions.md

**Location**: `.github/instructions/frontend.instructions.md`

**Add new section after "API Integration with Axios"**:

```markdown
## Guest Upload with Temporary Storage

### Pattern Overview

Users can upload CV before authentication, but must log in within 2 minutes to save permanently.

### State Management

```typescript
// uploadStore.ts
interface UploadState {
  tempUploadId: string | null;
  tempUploadExpiry: number | null;
  pendingAuth: boolean;
  
  setTempUpload: (tempId: string, expirySeconds: number) => void;
  clearTempUpload: () => void;
  isUploadExpired: () => boolean;
}

export const useUploadStore = create<UploadState>()(
  persist(
    (set, get) => ({
      tempUploadId: null,
      tempUploadExpiry: null,
      pendingAuth: false,
      
      setTempUpload: (tempId, expirySeconds) => {
        const expiry = Date.now() + (expirySeconds * 1000);
        set({ tempUploadId: tempId, tempUploadExpiry: expiry, pendingAuth: true });
      },
      
      clearTempUpload: () => {
        set({ tempUploadId: null, tempUploadExpiry: null, pendingAuth: false });
      },
      
      isUploadExpired: () => {
        const { tempUploadExpiry } = get();
        if (!tempUploadExpiry) return true;
        return Date.now() > tempUploadExpiry;
      }
    }),
    { name: 'portfolio-upload-storage' }
  )
);
```

### Upload Flow

```typescript
const handleFileSelect = useCallback(async (file: File) => {
  if (isAuthenticated) {
    // Authenticated upload - save directly
    const result = await uploadResume(file);
    onUploadComplete(result);
  } else {
    // Guest upload - save temporarily
    const result = await uploadResumeGuest(file);
    setTempUpload(result.temp_id, result.expires_in);
    
    toast.success('Upload successful! Log in within 2 minutes to save.');
    navigate('/preview');
  }
}, [isAuthenticated]);
```

### Auth Prompt Modal

```typescript
<AuthPromptModal
  timeRemaining={timeRemaining}
  onClose={() => setShowAuthModal(false)}
  onLogin={() => navigate('/login')}
  onRegister={() => navigate('/register')}
/>
```

### Claiming Upload After Login

```typescript
const handleLogin = async (data: LoginFormData) => {
  await login(data.email, data.password);
  
  const { tempUploadId, pendingAuth } = useUploadStore.getState();
  
  if (pendingAuth && tempUploadId) {
    try {
      await claimGuestUpload(tempUploadId);
      useUploadStore.getState().clearTempUpload();
      toast.success('Portfolio saved successfully!');
      navigate('/preview');
    } catch (err) {
      toast.error('Failed to save portfolio. Please upload again.');
      navigate('/');
    }
  } else {
    navigate('/dashboard');
  }
};
```

### Expiration Handling

```typescript
useEffect(() => {
  if (pendingAuth && !isAuthenticated) {
    const interval = setInterval(() => {
      if (isUploadExpired()) {
        clearInterval(interval);
        toast.error('Upload expired. Please upload again.');
        navigate('/');
        clearTempUpload();
      } else {
        const remaining = Math.floor((tempUploadExpiry! - Date.now()) / 1000);
        setTimeRemaining(remaining);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }
}, [pendingAuth, isAuthenticated]);
```
```

---

### 4. Add Portfolio Dashboard Architecture to ARCHITECTURE.md

**Location**: `.github/instructions/ARCHITECTURE.md`

**Add new section after "Frontend Stack"**:

```markdown
## Portfolio Dashboard Architecture

### Overview

The Portfolio Dashboard allows users to customize their portfolio appearance in real-time with live preview.

### Component Hierarchy

```
Dashboard (Container)
├── SettingsSidebar
│   ├── UserProfile
│   ├── Navigation (Profile, Settings)
│   ├── HelpSection
│   └── SaveButton
│
├── CustomizationToolbar
│   ├── HistoryControls (Undo/Redo)
│   ├── StylePicker (Dropdown)
│   ├── ColorPicker (Dropdown + Swatches)
│   ├── TypographyPicker (Dropdown + Font Preview)
│   └── ModeToogle (Edit/Display)
│
└── PortfolioPreview
    ├── LivePreview (applies CSS variables)
    └── ExitButton (in Display mode)
```

### State Management (Zustand)

```typescript
interface DashboardState {
  // Settings
  colorPalette: ColorPalette;  // 'white' | 'black' | 'red' | ...
  styleOption: StyleOption;    // 'style-1' | 'style-2' | 'style-3'
  typography: TypographyOption; // 'Inter' | 'Roboto' | ...
  viewMode: ViewMode;          // 'edit' | 'display'
  
  // Flags
  hasUnsavedChanges: boolean;
  
  // Actions
  setColorPalette: (palette: ColorPalette) => void;
  setStyleOption: (style: StyleOption) => void;
  setTypography: (font: TypographyOption) => void;
  setViewMode: (mode: ViewMode) => void;
  saveSettings: () => Promise<void>;
  markDirty: () => void;
}
```

### Live Preview Implementation

```typescript
const cssVariables = useMemo(() => {
  const colors = COLOR_PALETTES[colorPalette];
  const fonts = TYPOGRAPHY_OPTIONS[typography];
  
  return {
    '--portfolio-primary': colors.primary,
    '--portfolio-secondary': colors.secondary,
    '--portfolio-accent': colors.accent,
    '--portfolio-font-family': fonts.family
  } as React.CSSProperties;
}, [colorPalette, typography]);

// Apply to preview
<div className="portfolio-preview__content" style={cssVariables}>
  {/* Portfolio content */}
</div>
```

### View Modes

**Edit Mode** (default):
- Sidebar visible (left)
- Toolbar visible (top)
- Preview in center
- Changes trigger unsaved indicator

**Display Mode**:
- Full-screen preview
- All controls hidden
- Exit button in top-right
- Used for presenting/reviewing final design

### Settings Persistence

```typescript
// Auto-save to localStorage via Zustand persist middleware
persist(
  (set, get) => ({ /* state */ }),
  {
    name: 'portfolio-dashboard-settings',
    partialize: (state) => ({
      colorPalette: state.colorPalette,
      styleOption: state.styleOption,
      typography: state.typography
    })
  }
)
```

### Unsaved Changes Warning

```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = '';
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [hasUnsavedChanges]);
```
```

---

## 🎨 Portfolio View Design Patterns

Based on the uploaded portfolio design example, here are key patterns:

### Layout Structure

```
Portfolio View
├── Header Section
│   ├── Profile Photo (left)
│   ├── Name & Title (center-left)
│   └── Contact Links (right: CV, Email, Portfolio icons)
│
├── Hero Section
│   ├── Main Heading
│   ├── Subheading
│   └── Profile Description
│
├── Projects Grid
│   ├── Project Cards (4 columns on desktop)
│   │   ├── Project Image/Thumbnail
│   │   ├── Project Name
│   │   ├── Completion Year
│   │   ├── Brief Description
│   │   ├── Technologies Used (pills)
│   │   └── Links (Next.js, MongoDB, etc)
│   │
│   └── Responsive: 2 cols (tablet), 1 col (mobile)
│
├── Education Section
│   ├── Institution
│   ├── Degree & Major
│   ├── Years
│   └── Key Achievements
│
├── Work Experience Section
│   └── Collapsible Card per Job
│       ├── Company & Role
│       ├── Duration
│       └── Description (full paragraph on expand)
│
└── Skills Section
    └── Technology Pills (grouped)
```

### Design Tokens

```scss
// Colors (from design)
$portfolio-primary: #10B981;      // Green accent
$portfolio-secondary: #F3F4F6;    // Light gray background
$portfolio-text: #1F2937;         // Dark gray text
$portfolio-card-bg: #FFFFFF;      // White cards

// Typography
$portfolio-font-heading: 'Inter', sans-serif;
$portfolio-font-body: 'Inter', sans-serif;

// Spacing
$portfolio-section-gap: 4rem;     // Between major sections
$portfolio-card-gap: 2rem;        // Between project cards
$portfolio-card-padding: 1.5rem;  // Inside cards

// Border Radius
$portfolio-card-radius: 1rem;     // Rounded corners
$portfolio-pill-radius: 9999px;   // Technology pills
```

### Component Patterns

**Project Card Component**:
```typescript
interface ProjectCardProps {
  title: string;
  year: number;
  description: string;
  technologies: string[];
  links: { label: string; url: string }[];
  image?: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  year,
  description,
  technologies,
  links,
  image
}) => (
  <article className="project-card">
    {image && (
      <div className="project-card__image">
        <img src={image} alt={title} />
      </div>
    )}
    
    <div className="project-card__content">
      <h3 className="project-card__title">{title}</h3>
      <span className="project-card__year">{year}</span>
      
      <p className="project-card__description">{description}</p>
      
      <div className="project-card__technologies">
        {technologies.map((tech) => (
          <span key={tech} className="project-card__tech-pill">
            {tech}
          </span>
        ))}
      </div>
      
      <div className="project-card__links">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.url}
            className="project-card__link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  </article>
);
```

**Collapsible Section Component**:
```typescript
const CollapsibleSection: React.FC<{
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}> = ({ title, children, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  return (
    <div className="collapsible-section">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="collapsible-section__toggle"
        aria-expanded={isExpanded}
      >
        <span className="collapsible-section__title">{title}</span>
        <span className="collapsible-section__icon">
          {isExpanded ? '−' : '+'}
        </span>
      </button>
      
      {isExpanded && (
        <div className="collapsible-section__content">
          {children}
        </div>
      )}
    </div>
  );
};
```

---

## 🚀 Team Coordination Patterns

### Daily Workflow

```
Morning (9:00 AM):
├─ Pull latest from feature branch
├─ Review sprint board
├─ Check dependencies (blocked tasks?)
└─ Plan daily tasks

Development:
├─ Work in small increments
├─ Commit frequently (every 2-3 hours)
├─ Write tests alongside code
└─ Merge to feature branch daily (if stable)

End of Day:
├─ Push completed work
├─ Update sprint board
├─ Note blockers/questions
└─ Brief status update in team chat
```

### Communication Channels

| Channel | Purpose | Examples |
|---------|---------|----------|
| **Slack #dev** | Quick questions, status updates | "Deployed DB migration", "Need review on PR #42" |
| **Slack #blockers** | Urgent blockers | "API endpoint returning 500", "Can't push to dev branch" |
| **GitHub Issues** | Bug reports, feature discussions | "Button doesn't disable on invalid form" |
| **GitHub PRs** | Code review, implementation details | "Add file upload security validation" |
| **Weekly Sync** | Sprint planning, retrospectives | Monday 10 AM - review progress, plan week |

### Code Review Protocol

**Before requesting review**:
- [ ] All tests passing locally
- [ ] Code follows patterns from instruction files
- [ ] No linting errors
- [ ] Self-reviewed diff for obvious issues
- [ ] Meaningful commit messages

**PR Description Template**:
```markdown
## Task
Closes #[issue-number]

## Changes
- Added file upload security validation (EMMS pattern)
- Created tests for double extension detection
- Updated controller to use validation

## Patterns Used
- EMMS pattern (backend.instructions.md § Security)
- Feature-slice architecture (backend.instructions.md § Architecture)

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots
[If UI changes]
```

**Reviewer Checklist**:
- [ ] Code follows instruction file patterns
- [ ] Tests cover happy path + edge cases
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed
- [ ] Documentation updated

---

## 📊 Sprint Progress Tracking

### Recommended Tools

**GitHub Projects Board**:
```
Columns:
├─ Backlog (all sprint tasks)
├─ Ready (dependencies met)
├─ In Progress (actively working)
├─ Review (PR submitted)
├─ Testing (QA in progress)
└─ Done (merged + deployed)
```

**Task Status Indicators**:
- 🔴 Blocked (waiting on dependency)
- 🟡 In Progress (active development)
- 🟢 Ready for Review (PR submitted)
- ✅ Complete (merged + tested)

### Sprint Metrics to Track

| Metric | Target | Current |
|--------|--------|---------|
| **Velocity** | 20 story points/week | TBD |
| **Test Coverage** | >80% | TBD |
| **PR Merge Time** | <24 hours | TBD |
| **Blocker Resolution** | <4 hours | TBD |

---

## 🎯 Definition of Done

A task is considered **Done** when:

### Code Quality
- [ ] Follows patterns from instruction files
- [ ] No linting warnings
- [ ] Type-safe (TypeScript/Python type hints)
- [ ] Self-documenting (clear naming, comments where needed)

### Testing
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing (if applicable)
- [ ] E2E tests written and passing (if user-facing feature)
- [ ] Test coverage >80%

### Review
- [ ] Code reviewed by at least one team member
- [ ] All review comments addressed
- [ ] Approved by reviewer
- [ ] Squashed/rebased commits

### Deployment
- [ ] Merged to feature/dev branch
- [ ] Deployed to staging environment
- [ ] Smoke tested in staging
- [ ] Documentation updated

### Handoff
- [ ] Demo completed (if user-facing)
- [ ] Stakeholders notified
- [ ] Ready for next sprint planning

---

## 🔧 Troubleshooting Guide

### Common Issues

#### "My test is failing in CI but passes locally"

**Possible causes**:
1. **Environment differences**: Check environment variables
2. **Timing issues**: Add proper waits in E2E tests
3. **Database state**: Ensure tests clean up after themselves
4. **Dependency versions**: Check package-lock.json is committed

**Solution**:
```bash
# Run tests in CI-like environment
docker compose run --rm frontend npm test
docker compose run --rm backend pytest
```

#### "Rate limiting is blocking my development"

**Solution**: Increase limits for development environment

`backend/app/config.py`:
```python
if settings.ENVIRONMENT == "development":
    RATE_LIMIT_PER_MINUTE = 1000  # Very high for dev
else:
    RATE_LIMIT_PER_MINUTE = 60    # Production limit
```

#### "Upload is failing with 'File too large'"

**Check**:
1. Frontend validation (5MB limit)
2. Backend validation (5MB limit)
3. Nginx configuration (client_max_body_size)

```nginx
# nginx.conf
client_max_body_size 10M;  # Allow up to 10MB
```

#### "Migration failed: column already exists"

**Cause**: Migration was partially applied

**Solution**:
```bash
# Rollback to previous version
docker compose exec backend alembic downgrade -1

# Re-apply migration
docker compose up migrate
```

---

## 📝 Next Steps

### Immediate Actions (This Week)

1. **Review Sprint Implementation Guides**
   - Read `SPRINT_IMPLEMENTATION_GUIDE.md` (P0, P1 tasks)
   - Read `SPRINT_IMPLEMENTATION_GUIDE_PART2.md` (P2 testing)

2. **Team Assignments**
   - **Amir (Team Lead)**: Oversee all tasks, code review, architecture decisions
   - **Backend Team**:
     - Israel: Lead Task 1 (File Security), Task 5 (Versioning)
     - Ido: Support Task 1, Lead Task 2 (DB Link), Task 10 (Testing)
     - Yarin: Task 6 (Dashboard API), Task 7 (Auth Tests)
   - **Netanel (Frontend)**: Task 3 (UI Fixes), Task 4 (Dashboard), Tasks 8-9 (Testing)
   - **Yarin (DevOps)**: Tasks 13-15 (CI/CD, Deployment)
   - **Morris (Security)**: Security review for Tasks 1, 6, 7, 16
   - **Hezi (PM)**: Sprint coordination, daily standups, tracking
   - **Yoad (UI/UX)**: Design support for Tasks 3, 4, 17

3. **Set Up Development Environment**
   - Pull latest from `dev` branch
   - Run `docker compose up --build`
   - Verify all services healthy
   - Run existing tests to establish baseline

4. **Sprint Planning Meeting**
   - Review all sprint tasks
   - Confirm priorities and dependencies
   - Estimate time for each task
   - Assign owners
   - Set sprint goals

### Week 1 Goals

- ✅ Complete all P0 tasks (Tasks 1-3)
- ✅ Begin P1 tasks (Tasks 4-7)
- ✅ Set up CI pipeline (Task 13)

### Week 2 Goals

- ✅ Complete P1 tasks
- ✅ Complete P2 testing tasks
- ✅ Begin P3 deployment tasks

### Sprint Demo (End of Week 2)

**Prepare to demonstrate**:
1. Secure file upload with validation
2. Guest upload flow with auth prompt
3. Portfolio dashboard with live customization
4. Portfolio versioning and rollback
5. Full E2E test suite running
6. CI pipeline working

---

## 📚 Additional Resources

### Learning Materials

**Backend Security**:
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- FastAPI Security: https://fastapi.tiangolo.com/tutorial/security/
- SQLAlchemy Security: https://docs.sqlalchemy.org/en/20/tutorial/

**Frontend Testing**:
- Playwright Best Practices: https://playwright.dev/docs/best-practices
- Vitest Guide: https://vitest.dev/guide/
- React Testing Library: https://testing-library.com/react

**DevOps**:
- GitHub Actions: https://docs.github.com/en/actions
- Docker Compose: https://docs.docker.com/compose/
- PostgreSQL Performance: https://www.postgresql.org/docs/current/performance-tips.html

---

## 🎓 Key Takeaways

1. **Always read instruction files before coding** - Patterns are documented
2. **Follow EMMS pattern for file uploads** - Security first
3. **Test at multiple levels** - Unit, integration, E2E
4. **Use feature-slice architecture** - WHDS-G (backend) and TSS-D (frontend)
5. **Communicate blockers immediately** - Don't let them slow the sprint
6. **Review code against instruction files** - Maintain consistency
7. **Write tests alongside code** - TDD approach
8. **Commit frequently** - Small, atomic commits
9. **Document as you go** - Update instruction files when patterns evolve

---

**Version**: 1.0  
**Last Updated**: November 2025  
**Next Review**: End of Sprint (Week 2)

**Feedback**: Open PR to `.github/instructions/` with improvements
