# Portfolio Builder - Developer Quick Reference Card

> **Print this and keep on your desk!**

---

## 🎯 Critical Patterns (Memorize These)

### EMMS Pattern (File Upload Security)
```
E → Extension validation (whitelist only, reject double extensions)
M → MIME type verification (Content-Type header)
M → Magic bytes inspection (first 8 bytes: %PDF or PK\x03\x04)
S → Size limits (streaming validation, 5MB max)
```

### TSS-D Pattern (Frontend Components)
```
T → Think (Component.tsx - state, logic, handlers)
S → Show (Component.view.tsx - presentational JSX only)
S → Style (Component.styles.scss - BEM + design tokens)
D → Define (Component.types.ts - TypeScript interfaces)
```

### WHDS-G Pattern (Backend Features)
```
W → Where (routes.py - URL paths, HTTP methods)
H → Handle (controller.py - request/response, validation)
D → Do (service.py - business logic, pure functions)
S → Shape (schemas.py - Pydantic models)
G → Guard (security.py - validation, sanitization)
```

---

## ⚡ Quick Commands

### Development
```bash
# Start everything
docker compose up --build -d

# View logs
docker compose logs -f backend frontend

# Run migrations
docker compose up migrate

# Stop everything
docker compose down
```

### Testing
```bash
# Backend
cd backend && pytest -v
pytest --cov=app  # With coverage

# Frontend
cd frontend && npm test
npm run test:coverage  # With coverage

# E2E
npm run e2e  # Headless
npm run e2e:ui  # Interactive
```

### Code Quality
```bash
# Backend
ruff check .  # Lint
black .  # Format
mypy .  # Type check

# Frontend
npm run lint  # ESLint
npm run typecheck  # TypeScript
```

---

## 🚨 Before Every Commit

- [ ] All tests pass locally
- [ ] No linting errors
- [ ] Code follows TSS-D or WHDS-G pattern
- [ ] Meaningful commit message
- [ ] No console.log statements (frontend)

---

## 📋 PR Checklist

- [ ] Task number in PR title
- [ ] Description explains WHAT and WHY
- [ ] References instruction file patterns used
- [ ] Tests included and passing
- [ ] Screenshots for UI changes
- [ ] Self-reviewed diff
- [ ] No merge conflicts

---

## 🔐 Security Checklist

- [ ] Input validation (Pydantic strict mode)
- [ ] SQL queries parameterized (never string concat)
- [ ] File uploads validated (EMMS pattern)
- [ ] Auth required on protected endpoints
- [ ] Secrets in .env (never hardcoded)
- [ ] Error messages don't leak system info

---

## 🎨 Design Tokens (Frontend)

### Colors
```scss
var(--primary)          // #34C759 (green)
var(--error)            // #EF4444 (red)
var(--success)          // #10B981 (green)
var(--surface-primary)  // #FFFFFF (white)
var(--text-primary)     // #1F2937 (dark gray)
```

### Spacing
```scss
var(--space-xs)   // 0.25rem
var(--space-sm)   // 0.5rem
var(--space-md)   // 1rem
var(--space-lg)   // 1.5rem
var(--space-xl)   // 2rem
```

### Border Radius
```scss
var(--radius-sm)   // 0.25rem
var(--radius-md)   // 0.5rem
var(--radius-lg)   // 1rem
var(--radius-xl)   // 1.5rem
var(--radius-full) // 9999px
```

---

## 🗄️ Database Patterns

### Foreign Key with Cascade
```python
user_id = Column(
    Integer,
    ForeignKey("users.id", ondelete="CASCADE"),
    nullable=False,
    index=True
)
```

### Async Query
```python
stmt = select(Resume).where(Resume.id == resume_id)
result = await db.execute(stmt)
return result.scalar_one_or_none()
```

### Migration Template
```python
def upgrade() -> None:
    op.add_column('table', sa.Column('col', sa.Integer()))
    op.create_index('ix_table_col', 'table', ['col'])
    op.create_foreign_key('fk_name', 'table', 'other', ['col'], ['id'])

def downgrade() -> None:
    op.drop_constraint('fk_name', 'table', type_='foreignkey')
    op.drop_index('ix_table_col', 'table')
    op.drop_column('table', 'col')
```

---

## 🧪 Test Patterns

### Backend Unit Test
```python
@pytest.mark.asyncio
async def test_upload_validates_security(client: AsyncClient):
    response = await client.post(
        "/api/v1/resumes/upload",
        files={"file": ("malicious.php.pdf", b"content", "application/pdf")}
    )
    assert response.status_code == 415
    assert "Double extensions" in response.json()["detail"]
```

### Frontend Unit Test
```typescript
it('should show error for weak password', () => {
  render(<Registration />);
  
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'weak' }
  });
  
  expect(screen.getByText(/at least 12 characters/i)).toBeInTheDocument();
});
```

### E2E Test
```typescript
test('should complete registration flow', async ({ page }) => {
  await page.goto('/register');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'SecurePass123!@#');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('/dashboard');
  await expect(page).toHaveURL('/dashboard');
});
```

---

## 🚦 Sprint Priorities

```
P0 (BLOCKING) → P1 (CORE) → P2 (TESTING) → P3 (INFRASTRUCTURE)
```

### This Week Focus
1. ✅ File Upload Security (Task 1)
2. ✅ Database Resumes-Users Link (Task 2)
3. ✅ UI Login-Registration Fixes (Task 3)

---

## 📞 Who to Ask

| Question | Contact |
|----------|---------|
| Architecture & technical decisions | Amir (Team Lead) |
| Backend patterns & APIs | Israel, Ido, Yarin |
| Frontend patterns & UI | Netanel |
| CI/CD & deployment | Yarin (DevOps) |
| Security review & testing | Morris |
| Sprint planning & priorities | Hezi (PM) |
| Design & user experience | Yoad (UI/UX) |
| Blockers | #blockers Slack |
| General dev questions | #dev Slack |

---

## 🔗 Important Links

**Documentation**:
- Instruction Files: `.github/instructions/`
- Sprint Guide: `SPRINT_IMPLEMENTATION_GUIDE.md`
- Architecture: `ARCHITECTURE.md`

**External**:
- FastAPI: https://fastapi.tiangolo.com/
- React: https://react.dev/
- Playwright: https://playwright.dev/
- PostgreSQL: https://www.postgresql.org/docs/

---

## 💡 Pro Tips

1. **Read instruction files BEFORE coding** - Save yourself hours
2. **Write tests ALONGSIDE code** - TDD prevents bugs
3. **Commit frequently** - Small atomic commits are easier to review
4. **Ask early** - Don't waste time being blocked
5. **Review your own PRs** - Catch obvious issues before review
6. **Follow the patterns** - Consistency makes codebase maintainable

---

## 🎯 Definition of Done

A task is done when:
- [ ] Code follows instruction file patterns
- [ ] Tests written and passing (>80% coverage)
- [ ] PR reviewed and approved
- [ ] Merged to feature/dev branch
- [ ] Deployed to staging
- [ ] Smoke tested

---

## 🏁 Daily Routine

**Morning**:
1. Pull latest from feature branch
2. Check sprint board for blockers
3. Plan today's tasks
4. Sync with team

**Development**:
1. Work in small increments
2. Write tests alongside code
3. Commit every 2-3 hours
4. Merge to feature branch daily

**End of Day**:
1. Push completed work
2. Update sprint board
3. Note blockers
4. Brief team update

---

**Keep this visible while coding! 🚀**

**Version**: 1.0 | **Sprint**: November 2025
